package com.pcparts.module.order.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for order details (listing and detail views).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private String orderNumber;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String status;
    private String note;
    private String recipientName;
    private String recipientPhone;
    private String shippingAddress;
    private String paymentMethod;
    private String paymentStatus;
    private String createdAt;
    private int itemCount;
    private List<OrderDetailDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderDetailDto {
        private Long id;
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
