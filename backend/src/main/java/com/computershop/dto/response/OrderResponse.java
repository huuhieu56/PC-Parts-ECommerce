package com.computershop.dto.response;

import com.computershop.entity.Order;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("user_name")
    private String userName;

    @JsonProperty("user_username")
    private String userUsername;

    @JsonProperty("user_email")
    private String userEmail;

    @JsonProperty("user_phone")
    private String userPhone;

    @JsonProperty("order_code")
    private String orderCode;

    @JsonProperty("subtotal")
    private BigDecimal subtotal;

    @JsonProperty("total_amount")
    private BigDecimal totalAmount;

    @JsonProperty("discount_amount")
    private BigDecimal discountAmount;

    @JsonProperty("final_amount")
    private BigDecimal finalAmount;

    @JsonProperty("tax_amount")
    private BigDecimal taxAmount;

    @JsonProperty("shipping_cost")
    private BigDecimal shippingCost;

    @JsonProperty("customer_name")
    private String customerName;

    @JsonProperty("customer_email")
    private String customerEmail;

    @JsonProperty("shipping_phone")
    private String shippingPhone;

    @JsonProperty("promotion_id")
    private Long promotionId;

    @JsonProperty("promotion_name")
    private String promotionName;

    private String status;

    @JsonProperty("shipping_address")
    private String shippingAddress;

    private String notes;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    @JsonProperty("order_items")
    private List<OrderItemResponse> orderItems;

    private static final BigDecimal VAT_RATE = new BigDecimal("0.10");
    private static final BigDecimal SHIPPING_THRESHOLD = new BigDecimal("1000000");
    private static final BigDecimal SHIPPING_FEE = new BigDecimal("50000");

    public static OrderResponse fromEntity(Order order) {
        if (order == null) {
            return null;
        }

    BigDecimal subtotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
    BigDecimal taxAmount = subtotal.multiply(VAT_RATE).setScale(0, RoundingMode.HALF_UP);
    BigDecimal shippingCost = subtotal.compareTo(SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : SHIPPING_FEE;

    OrderResponseBuilder builder = OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
        .subtotal(subtotal)
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
        .taxAmount(taxAmount)
        .shippingCost(shippingCost)
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .shippingPhone(order.getShippingPhone())
                .status(order.getStatus().toString())
                .shippingAddress(order.getShippingAddress())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt());

        // Lấy order items nếu có
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            List<OrderItemResponse> orderItemResponses = order.getOrderItems()
                    .stream()
                    .map(OrderItemResponse::fromEntity)
                    .collect(Collectors.toList());
            builder.orderItems(orderItemResponses);
        }
        if (order.getPromotion() != null) {
            builder.promotionId(order.getPromotion().getId());
            builder.promotionName(order.getPromotion().getName());
        }
        if (order.getUser() != null) {
            try {
                builder.userId(order.getUser().getId());
                builder.userName(order.getUser().getFullName());
                builder.userUsername(order.getUser().getUsername());
                builder.userEmail(order.getUser().getEmail());
                builder.userPhone(order.getUser().getPhone());
            } catch (Exception ex) {
            }
        }

        return builder.build();
    }

    public static OrderResponse fromEntityWithoutItems(Order order) {
        if (order == null) {
            return null;
        }

        BigDecimal subtotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal taxAmount = subtotal.multiply(VAT_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal shippingCost = subtotal.compareTo(SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : SHIPPING_FEE;

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .subtotal(subtotal)
                .totalAmount(order.getTotalAmount())
                .taxAmount(taxAmount)
                .shippingCost(shippingCost)
                .status(order.getStatus().toString())
                .shippingAddress(order.getShippingAddress())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .promotionId(order.getPromotion() != null ? order.getPromotion().getId() : null)
                .promotionName(order.getPromotion() != null ? order.getPromotion().getName() : null)
                .build();
    }
}
