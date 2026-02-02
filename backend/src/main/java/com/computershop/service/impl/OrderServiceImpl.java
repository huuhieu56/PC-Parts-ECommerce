package com.computershop.service.impl;

import com.computershop.dto.request.OrderRequest;
import com.computershop.dto.response.OrderResponse;
import com.computershop.entity.*;
import com.computershop.repository.*;
import com.computershop.service.interfaces.OrderService;
import com.computershop.service.interfaces.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service("orderService")
@Transactional
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PromotionRepository promotionRepository;
    private final PromotionService promotionService;

    private static final BigDecimal VAT_RATE = new BigDecimal("0.10");
    private static final BigDecimal SHIPPING_THRESHOLD = new BigDecimal("1000000");
    private static final BigDecimal SHIPPING_FEE = new BigDecimal("50000");

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        Page<Order> orders = orderRepository.findAll(pageable);
        return orders.map(OrderResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable, String search) {
        if (search == null || search.isBlank()) {
            return getAllOrders(pageable);
        }
        String kw = search.trim().toLowerCase();
        Page<Order> orders = orderRepository.searchByKeyword(kw, pageable);
        return orders.map(OrderResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByUser(Long userId, Pageable pageable) {
        Page<Order> orders = orderRepository.findOrdersByUserIdNative(userId, pageable);
        return orders.map(OrderResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với id: " + id));
        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + orderCode));
        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByStatus(String status, Pageable pageable) {
        Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        Page<Order> orders = orderRepository.findByStatus(orderStatus, pageable);
        return orders.map(OrderResponse::fromEntity);
    }

    @Override
    public OrderResponse createOrderFromCart(Long userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng cho người dùng: " + userId));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());

        if (cartItems.isEmpty()) {
            throw new RuntimeException("Giỏ hàng đang trống");
        }


        BigDecimal subtotal = cartItems.stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal taxAmount = subtotal.multiply(VAT_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal shippingCost = subtotal.compareTo(SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : SHIPPING_FEE;
        BigDecimal grossAmount = subtotal.add(taxAmount).add(shippingCost);

        Order order = new Order();
        order.setUser(user);
        order.setTotalAmount(subtotal);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setPaymentMethod(Order.PaymentMethod.COD);


        if (request.getCustomerName() != null && !request.getCustomerName().isBlank()) {
            order.setCustomerName(request.getCustomerName());
        } else {
            order.setCustomerName(user.getFullName());
        }

        if (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()) {
            order.setCustomerEmail(request.getCustomerEmail());
        } else {
            order.setCustomerEmail(user.getEmail());
        }

        order.setShippingAddress(request.getShippingAddress());
        if (request.getShippingPhone() != null)
            order.setShippingPhone(request.getShippingPhone());
        order.setNotes(request.getNotes());

        order.setDiscountAmount(BigDecimal.ZERO);
        order.setFinalAmount(grossAmount);

        if (request.getPromotionId() != null) {
            try {
                BigDecimal discount = promotionService.calculateDiscount(subtotal, request.getPromotionId());
                if (discount != null && discount.compareTo(BigDecimal.ZERO) > 0) {
                    order.setDiscountAmount(discount);
                    BigDecimal discountedTotal = grossAmount.subtract(discount);
                    if (discountedTotal.compareTo(BigDecimal.ZERO) < 0) {
                        discountedTotal = BigDecimal.ZERO;
                    }
                    order.setFinalAmount(discountedTotal);
                    // attach promotion entity if needed
                    Promotion promo = promotionRepository.findById(request.getPromotionId()).orElse(null);
                    order.setPromotion(promo);
                }
            } catch (Exception ex) {
                System.err.println("Áp dụng khuyến mãi thất bại: " + ex.getMessage());
            }
        }

        if (order.getOrderCode() == null || order.getOrderCode().isBlank()) {
            String generated = "ORD-"
                    + java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    + "-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            order.setOrderCode(generated);
        }

        Order savedOrder = orderRepository.save(order);

        // Tạo OrderItems từ CartItems
        List<OrderItem> orderItems = cartItems.stream()
                .map(cartItem -> {
                    // Kiểm tra trạng thái sản phẩm (active)
                    Product product = cartItem.getProduct();
                    if (product.getIsActive() == null || !product.getIsActive()) {
                        throw new RuntimeException("Sản phẩm không khả dụng (đã ngừng bán): " + product.getName());
                    }

                    // Kiểm tra tồn kho
                    if (product.getQuantity() < cartItem.getQuantity()) {
                        throw new RuntimeException("Số lượng trong kho không đủ cho sản phẩm: " + product.getName());
                    }

                    // Giảm tồn kho
                    product.setQuantity(product.getQuantity() - cartItem.getQuantity());
                    productRepository.save(product);

                    // Tạo OrderItem
                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(savedOrder);
                    orderItem.setProduct(product);
                    orderItem.setProductName(product.getName());
                    orderItem.setQuantity(cartItem.getQuantity());
                    orderItem.setPrice(product.getPrice());

                    return orderItem;
                })
                .collect(Collectors.toList());

        orderItemRepository.saveAll(orderItems);

        // Xóa giỏ hàng sau khi đặt hàng
        cartItemRepository.deleteAll(cartItems);

        return OrderResponse.fromEntity(savedOrder);
    }

    @Override
    public OrderResponse updateOrderStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        Order.OrderStatus orderStatus;
        try {
            orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái đơn hàng không hợp lệ: " + status);
        }

        order.setStatus(orderStatus);

        Order updatedOrder = orderRepository.save(order);
        return OrderResponse.fromEntity(updatedOrder);
    }

    @Override
    public OrderResponse cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        if (order.getStatus().equals(Order.OrderStatus.DELIVERED)) {
            throw new RuntimeException("Không thể hủy đơn đã giao");
        }

        if (order.getStatus().equals(Order.OrderStatus.CANCELLED)) {
            throw new RuntimeException("Đơn hàng đã bị hủy trước đó");
        }

        // Hoàn lại tồn kho
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(id);
        orderItems.forEach(orderItem -> {
            Product product = orderItem.getProduct();
            product.setQuantity(product.getQuantity() + orderItem.getQuantity());
            productRepository.save(product);
        });

        order.setStatus(Order.OrderStatus.CANCELLED);

        Order cancelledOrder = orderRepository.save(order);
        return OrderResponse.fromEntity(cancelledOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByDateRange(String startDate, String endDate, Pageable pageable) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        LocalDateTime start = LocalDateTime.parse(startDate + " 00:00:00", formatter);
        LocalDateTime end = LocalDateTime.parse(endDate + " 23:59:59", formatter);

        List<Order> orders = orderRepository.findOrdersBetweenDates(start, end);
        // Convert List to Page manually
        Page<Order> page = new PageImpl<>(orders, pageable, orders.size());
        return page.map(OrderResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Double getTotalRevenue() {
        Optional<BigDecimal> revenue = orderRepository.getTotalRevenueByStatus(Order.OrderStatus.DELIVERED);
        return revenue.orElse(BigDecimal.ZERO).doubleValue();
    }

    @Override
    @Transactional(readOnly = true)
    public Long countOrdersByStatus(String status) {
        return orderRepository.countByStatus(Order.OrderStatus.valueOf(status));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isOrderOwner(Long orderId, Long userId) {
        if (orderId == null || userId == null)
            return false;
        try {
            return orderRepository.existsByIdAndUser_Id(orderId, userId);
        } catch (Exception ex) {
            return false;
        }
    }
}
