package com.pcparts.module.order.service;

import com.pcparts.common.dto.PageResponse;
import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Address;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.inventory.service.InventoryService;
import com.pcparts.module.order.entity.*;
import com.pcparts.module.order.repository.*;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.shopping.entity.CartItem;
import com.pcparts.module.shopping.repository.CartItemRepository;
import com.pcparts.module.shopping.repository.CartRepository;
import com.pcparts.module.auth.repository.AddressRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserProfileRepository userProfileRepository;
    private final AccountRepository accountRepository;
    private final AddressRepository addressRepository;
    private final InventoryService inventoryService;

    @Transactional
    public OrderDto createOrder(Long userId, CreateOrderRequest request) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "id", userId));
        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));

        var cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Giỏ hàng trống", HttpStatus.BAD_REQUEST));
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) throw new BusinessException("Giỏ hàng trống", HttpStatus.BAD_REQUEST);

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderDetail> details = new ArrayList<>();
        Order order = Order.builder().user(user).address(address).note(request.getNote()).status("PENDING").build();

        for (CartItem ci : cartItems) {
            Product product = ci.getProduct();
            BigDecimal lineTotal = product.getSellingPrice().multiply(BigDecimal.valueOf(ci.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            inventoryService.reserveStock(product.getId(), ci.getQuantity());
            details.add(OrderDetail.builder().order(order).product(product).quantity(ci.getQuantity())
                    .unitPrice(product.getSellingPrice()).lineTotal(lineTotal).build());
        }
        order.setSubtotal(subtotal);

        BigDecimal discount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCode(request.getCouponCode())
                    .orElseThrow(() -> new BusinessException("Mã giảm giá không hợp lệ", HttpStatus.BAD_REQUEST));
            if (!coupon.isActive()) throw new BusinessException("Mã giảm giá đã hết hạn", HttpStatus.BAD_REQUEST);
            discount = calculateDiscount(coupon, subtotal);
            order.setCoupon(coupon);
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }
        order.setDiscountAmount(discount);
        order.setTotalAmount(subtotal.subtract(discount));
        order.setDetails(details);
        order = orderRepository.save(order);

        paymentRepository.save(Payment.builder().order(order).method(request.getPaymentMethod())
                .amount(order.getTotalAmount()).status("PENDING").build());

        logStatusChange(order, null, "PENDING", null, "Đơn hàng được tạo");
        cartItemRepository.deleteByCartId(cart.getId());
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (!order.getUser().getId().equals(userId))
            throw new BusinessException("Bạn không có quyền xem đơn hàng này", HttpStatus.FORBIDDEN);
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderDto> getMyOrders(Long userId, int page, int size) {
        Page<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        List<OrderDto> dtos = orders.getContent().stream().map(this::toDto).collect(Collectors.toList());
        return PageResponse.<OrderDto>builder().content(dtos).page(orders.getNumber()).size(orders.getSize())
                .totalElements(orders.getTotalElements()).totalPages(orders.getTotalPages()).last(orders.isLast()).build();
    }

    @Transactional
    public OrderDto updateStatus(Long orderId, String newStatus, String changedByStr) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        String oldStatus = order.getStatus();
        order.setStatus(newStatus);
        orderRepository.save(order);

        if ("CANCELLED".equals(newStatus)) {
            for (OrderDetail d : orderDetailRepository.findByOrderId(orderId))
                inventoryService.releaseStock(d.getProduct().getId(), d.getQuantity());
        }
        if ("COMPLETED".equals(newStatus)) {
            for (OrderDetail d : orderDetailRepository.findByOrderId(orderId))
                inventoryService.exportStock(d.getProduct().getId(), d.getQuantity(), "Hoàn thành đơn #" + orderId, changedByStr);
        }

        Account changedBy = null;
        try { changedBy = accountRepository.findById(Long.parseLong(changedByStr)).orElse(null); } catch (NumberFormatException ignored) {}
        logStatusChange(order, oldStatus, newStatus, changedBy, null);
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderDto> getAllOrders(String status, int page, int size) {
        Page<Order> orders = status != null && !status.isBlank()
                ? orderRepository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size))
                : orderRepository.findAll(PageRequest.of(page, size));
        List<OrderDto> dtos = orders.getContent().stream().map(this::toDto).collect(Collectors.toList());
        return PageResponse.<OrderDto>builder().content(dtos).page(orders.getNumber()).size(orders.getSize())
                .totalElements(orders.getTotalElements()).totalPages(orders.getTotalPages()).last(orders.isLast()).build();
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        if (coupon.getMinOrderValue() != null && subtotal.compareTo(coupon.getMinOrderValue()) < 0)
            throw new BusinessException("Đơn hàng chưa đạt giá trị tối thiểu", HttpStatus.BAD_REQUEST);
        BigDecimal discount;
        if ("PERCENTAGE".equals(coupon.getDiscountType())) {
            discount = subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
            if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) discount = coupon.getMaxDiscount();
        } else { discount = coupon.getDiscountValue(); }
        return discount;
    }

    private void logStatusChange(Order order, String from, String to, Account by, String note) {
        statusHistoryRepository.save(OrderStatusHistory.builder().order(order).oldStatus(from).newStatus(to).changedBy(by).note(note).build());
    }

    private OrderDto toDto(Order order) {
        List<OrderDetailDto> detailDtos = orderDetailRepository.findByOrderId(order.getId()).stream()
                .map(d -> OrderDetailDto.builder().id(d.getId()).productId(d.getProduct().getId()).productName(d.getProduct().getName())
                        .quantity(d.getQuantity()).unitPrice(d.getUnitPrice()).lineTotal(d.getLineTotal()).build())
                .collect(Collectors.toList());
        return OrderDto.builder().id(order.getId()).subtotal(order.getSubtotal()).discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount()).status(order.getStatus()).note(order.getNote())
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null).items(detailDtos).build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateOrderRequest {
        private Long addressId;
        private String note;
        private String couponCode;
        private String paymentMethod;
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
