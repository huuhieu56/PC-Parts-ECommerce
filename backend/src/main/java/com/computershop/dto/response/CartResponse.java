package com.computershop.dto.response;

import com.computershop.entity.Cart;
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
public class CartResponse {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    private String username;

    @JsonProperty("cart_items")
    private List<CartItemResponse> cartItems;

    @JsonProperty("total_items")
    private Integer totalItems;

    @JsonProperty("total_amount")
    private BigDecimal totalAmount;

    @JsonProperty("subtotal")
    private BigDecimal subtotal;

    @JsonProperty("tax_amount")
    private BigDecimal taxAmount;

    @JsonProperty("shipping_cost")
    private BigDecimal shippingCost;

    @JsonProperty("discount_amount")
    private BigDecimal discountAmount;

    @JsonProperty("final_amount")
    private BigDecimal finalAmount;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    private static final BigDecimal VAT_RATE = new BigDecimal("0.10");
    private static final BigDecimal SHIPPING_THRESHOLD = new BigDecimal("1000000");
    private static final BigDecimal SHIPPING_FEE = new BigDecimal("50000");

    public static CartResponse fromEntity(Cart cart) {
        List<CartItemResponse> cartItemResponses = cart.getCartItems() != null
                ? cart.getCartItems().stream()
                .map(CartItemResponse::fromEntity)
                .collect(Collectors.toList())
                : List.of();

        BigDecimal subtotal = cartItemResponses.stream()
                .map(item -> item.getSubTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer totalItems = cartItemResponses.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        BigDecimal taxAmount = subtotal.multiply(VAT_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal shippingCost = subtotal.compareTo(SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : SHIPPING_FEE;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(taxAmount).add(shippingCost);
        BigDecimal finalAmount = totalAmount.subtract(discountAmount);

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .username(cart.getUser().getUsername())
                .cartItems(cartItemResponses)
                .totalItems(totalItems)
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .shippingCost(shippingCost)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .finalAmount(finalAmount)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }
}
