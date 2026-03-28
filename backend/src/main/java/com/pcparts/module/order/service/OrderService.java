package com.pcparts.module.order.service;

import com.pcparts.common.dto.PageResponse;
import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Address;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.AddressRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.inventory.service.InventoryService;
import com.pcparts.module.order.entity.*;
import com.pcparts.module.order.repository.*;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.shopping.entity.CartItem;
import com.pcparts.module.shopping.repository.CartItemRepository;
import com.pcparts.module.shopping.repository.CartRepository;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for order operations: create, view, update status.
 * Fixes applied: BUG-02 (state machine), BUG-03 (CouponUsage), BUG-04 (Shipping),
 * BUG-05 (Address ownership), BUG-12 (discount cap), BUG-13 (accountId mapping),
 * BUG-21 (cancel refund).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final PaymentRepository paymentRepository;
    private final ShippingRepository shippingRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserProfileRepository userProfileRepository;
    private final AccountRepository accountRepository;
    private final AddressRepository addressRepository;
    private final InventoryService inventoryService;

    /**
     * Valid order status transitions (State Machine — BUG-02 fix).
     */
    private static final Map<String, Set<String>> VALID_TRANSITIONS = Map.of(
            "PENDING", Set.of("CONFIRMED", "CANCELLED"),
            "CONFIRMED", Set.of("SHIPPING", "CANCELLED"),
            "SHIPPING", Set.of("COMPLETED", "CANCELLED"),
            "COMPLETED", Set.of(),
            "CANCELLED", Set.of()
    );

    /**
     * Creates an order from the user's cart.
     *
     * @param accountId the account ID from JWT (auth.getName())
     * @param request   order creation request
     * @return created order DTO
     */
    @Transactional
    public OrderDto createOrder(Long accountId, CreateOrderRequest request) {
        // BUG-13 fix: resolve accountId → UserProfile via findByAccountId
        UserProfile user = userProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", accountId));

        // Resolve address: either from addressId or inline shippingAddress
        Address address;
        if (request.getAddressId() != null) {
            // Use existing address
            address = addressRepository.findById(request.getAddressId())
                    .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));
            // BUG-05 fix: validate Address belongs to this user
            if (!address.getUser().getId().equals(user.getId())) {
                throw new BusinessException("Địa chỉ không thuộc về tài khoản của bạn", HttpStatus.FORBIDDEN);
            }
        } else if (request.getShippingAddress() != null) {
            // Create new address from inline shipping info
            ShippingAddressRequest sa = request.getShippingAddress();
            address = Address.builder()
                    .user(user)
                    .label("Checkout")
                    .receiverName(sa.getReceiverName())
                    .receiverPhone(sa.getReceiverPhone())
                    .province(sa.getProvince() != null ? sa.getProvince() : "")
                    .district(sa.getDistrict() != null ? sa.getDistrict() : "")
                    .ward(sa.getWard() != null ? sa.getWard() : "")
                    .street(sa.getStreet() != null ? sa.getStreet() : "")
                    .isDefault(false)
                    .build();
            address = addressRepository.save(address);
        } else {
            throw new BusinessException("Vui lòng cung cấp địa chỉ giao hàng", HttpStatus.BAD_REQUEST);
        }

        var cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException("Giỏ hàng trống", HttpStatus.BAD_REQUEST));
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new BusinessException("Giỏ hàng trống", HttpStatus.BAD_REQUEST);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderDetail> details = new ArrayList<>();
        Order order = Order.builder()
                .user(user)
                .address(address)
                .note(request.getNote())
                .status("PENDING")
                .build();

        // BUG-01: reserveStock now actually deducts (fixed in InventoryService)
        for (CartItem ci : cartItems) {
            Product product = ci.getProduct();
            BigDecimal lineTotal = product.getSellingPrice().multiply(BigDecimal.valueOf(ci.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            inventoryService.reserveStock(product.getId(), ci.getQuantity());
            details.add(OrderDetail.builder()
                    .order(order)
                    .product(product)
                    .quantity(ci.getQuantity())
                    .unitPrice(product.getSellingPrice())
                    .lineTotal(lineTotal)
                    .build());
        }
        order.setSubtotal(subtotal);

        // BUG-03 fix: validate coupon per-user usage and create CouponUsage
        BigDecimal discount = BigDecimal.ZERO;
        Coupon coupon = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            coupon = couponRepository.findByCode(request.getCouponCode().toUpperCase())
                    .orElseThrow(() -> new BusinessException("Mã giảm giá không hợp lệ", HttpStatus.BAD_REQUEST));
            if (!coupon.isActive()) {
                throw new BusinessException("Mã giảm giá đã hết hạn hoặc hết lượt sử dụng", HttpStatus.BAD_REQUEST);
            }
            // Check if user has already used this coupon
            if (couponUsageRepository.existsByCouponIdAndUserId(coupon.getId(), user.getId())) {
                throw new BusinessException("Bạn đã sử dụng mã giảm giá này rồi", HttpStatus.BAD_REQUEST);
            }
            discount = calculateDiscount(coupon, subtotal);
            order.setCoupon(coupon);
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        order.setDiscountAmount(discount);
        order.setTotalAmount(subtotal.subtract(discount));
        order.setDetails(details);
        order = orderRepository.save(order);

        // Create Payment
        paymentRepository.save(Payment.builder()
                .order(order)
                .method(request.getPaymentMethod())
                .amount(order.getTotalAmount())
                .status("PENDING")
                .build());

        // BUG-04 fix: create Shipping record
        shippingRepository.save(Shipping.builder()
                .order(order)
                .status("WAITING_PICKUP")
                .build());

        // BUG-03 fix: create CouponUsage record
        if (coupon != null) {
            couponUsageRepository.save(CouponUsage.builder()
                    .coupon(coupon)
                    .user(user)
                    .order(order)
                    .build());
        }

        logStatusChange(order, null, "PENDING", null, "Đơn hàng được tạo");
        cartItemRepository.deleteByCartId(cart.getId());
        return toDto(order);
    }

    /**
     * Gets order detail. BUG-13 fix: uses accountId to resolve UserProfile.
     */
    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long orderId, Long accountId) {
        UserProfile user = userProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", accountId));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Bạn không có quyền xem đơn hàng này", HttpStatus.FORBIDDEN);
        }
        return toDto(order);
    }

    /**
     * Lists orders for the current user. BUG-13 fix: uses accountId.
     */
    @Transactional(readOnly = true)
    public PageResponse<OrderDto> getMyOrders(Long accountId, int page, int size) {
        UserProfile user = userProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", accountId));
        Page<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size));
        List<OrderDto> dtos = orders.getContent().stream().map(this::toDto).collect(Collectors.toList());
        return PageResponse.<OrderDto>builder()
                .content(dtos).page(orders.getNumber()).size(orders.getSize())
                .totalElements(orders.getTotalElements()).totalPages(orders.getTotalPages())
                .last(orders.isLast()).build();
    }

    /**
     * Updates order status with state machine validation (BUG-02 fix).
     * Handles CANCELLED (BUG-21: release stock + refund coupon) and COMPLETED.
     */
    @Transactional
    public OrderDto updateStatus(Long orderId, String newStatus, String changedByStr) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        String oldStatus = order.getStatus();

        // BUG-02 fix: validate state transition
        Set<String> allowedNext = VALID_TRANSITIONS.get(oldStatus);
        if (allowedNext == null || !allowedNext.contains(newStatus)) {
            throw new BusinessException(
                    "Không thể chuyển trạng thái từ '" + oldStatus + "' sang '" + newStatus + "'",
                    HttpStatus.BAD_REQUEST);
        }

        order.setStatus(newStatus);
        orderRepository.save(order);

        // BUG-21 fix: handle CANCELLED — release stock and refund coupon
        if ("CANCELLED".equals(newStatus)) {
            for (OrderDetail d : orderDetailRepository.findByOrderId(orderId)) {
                inventoryService.releaseStock(d.getProduct().getId(), d.getQuantity());
            }
            // Refund coupon usage
            if (order.getCoupon() != null) {
                Coupon coupon = order.getCoupon();
                coupon.setUsedCount(Math.max(0, coupon.getUsedCount() - 1));
                couponRepository.save(coupon);
            }
            // Update payment status
            paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
                payment.setStatus("CANCELLED");
                paymentRepository.save(payment);
            });
        }

        Account changedBy = null;
        try {
            changedBy = accountRepository.findById(Long.parseLong(changedByStr)).orElse(null);
        } catch (NumberFormatException ignored) {
        }
        logStatusChange(order, oldStatus, newStatus, changedBy, null);
        return toDto(order);
    }

    /**
     * Lists all orders for admin with optional status filter.
     */
    @Transactional(readOnly = true)
    public PageResponse<OrderDto> getAllOrders(String status, int page, int size) {
        Page<Order> orders = status != null && !status.isBlank()
                ? orderRepository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size))
                : orderRepository.findAll(PageRequest.of(page, size));
        List<OrderDto> dtos = orders.getContent().stream().map(this::toDto).collect(Collectors.toList());
        return PageResponse.<OrderDto>builder()
                .content(dtos).page(orders.getNumber()).size(orders.getSize())
                .totalElements(orders.getTotalElements()).totalPages(orders.getTotalPages())
                .last(orders.isLast()).build();
    }

    /**
     * Calculates discount with cap (BUG-12 fix: discount cannot exceed subtotal).
     */
    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        if (coupon.getMinOrderValue() != null && subtotal.compareTo(coupon.getMinOrderValue()) < 0) {
            throw new BusinessException("Đơn hàng chưa đạt giá trị tối thiểu để dùng mã giảm giá", HttpStatus.BAD_REQUEST);
        }
        BigDecimal discount;
        if ("PERCENTAGE".equals(coupon.getDiscountType())) {
            discount = subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
            if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                discount = coupon.getMaxDiscount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }
        // BUG-12 fix: discount cannot exceed subtotal
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }
        return discount;
    }

    private void logStatusChange(Order order, String from, String to, Account by, String note) {
        statusHistoryRepository.save(OrderStatusHistory.builder()
                .order(order).oldStatus(from).newStatus(to).changedBy(by).note(note).build());
    }

    private OrderDto toDto(Order order) {
        List<OrderDetailDto> detailDtos = orderDetailRepository.findByOrderId(order.getId()).stream()
                .map(d -> OrderDetailDto.builder()
                        .id(d.getId())
                        .productId(d.getProduct().getId())
                        .productName(d.getProduct().getName())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .lineTotal(d.getLineTotal())
                        .build())
                .collect(Collectors.toList());
        return OrderDto.builder()
                .id(order.getId())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .note(order.getNote())
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null)
                .items(detailDtos)
                .build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateOrderRequest {
        private Long addressId;
        private ShippingAddressRequest shippingAddress;
        private String note;
        private String couponCode;
        private String paymentMethod;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ShippingAddressRequest {
        private String receiverName;
        private String receiverPhone;
        private String province;
        private String district;
        private String ward;
        private String street;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderDto {
        private Long id;
        private BigDecimal subtotal;
        private BigDecimal discountAmount;
        private BigDecimal totalAmount;
        private String status;
        private String note;
        private String createdAt;
        private List<OrderDetailDto> items;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderDetailDto {
        private Long id;
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
