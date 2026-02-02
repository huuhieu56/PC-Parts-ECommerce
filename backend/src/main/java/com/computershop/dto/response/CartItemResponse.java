package com.computershop.dto.response;

import com.computershop.entity.CartItem;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {

    private Long id;

    @JsonProperty("product_id")
    private Long productId;

    @JsonProperty("product_name")
    private String productName;

    @JsonProperty("product_image_url")
    private String productImageUrl;

    @JsonProperty("product_price")
    private BigDecimal productPrice;

    private Integer quantity;

    @JsonProperty("sub_total")
    private BigDecimal subTotal;

    @JsonProperty("is_product_active")
    private Boolean isProductActive;

    @JsonProperty("is_product_available")
    private Boolean isProductAvailable;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    public static CartItemResponse fromEntity(CartItem cartItem) {
        BigDecimal subTotal = cartItem.getProduct().getPrice()
                .multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(cartItem.getProduct().getId())
                .productName(cartItem.getProduct().getName())
                .productImageUrl(cartItem.getProduct().getPrimaryImageUrl())
                .productPrice(cartItem.getProduct().getPrice())
                .quantity(cartItem.getQuantity())
                .subTotal(subTotal)
                .isProductActive(cartItem.getProduct().getIsActive())
                .isProductAvailable(cartItem.getProduct().getQuantity() >= cartItem.getQuantity())
                .createdAt(cartItem.getCreatedAt())
                .updatedAt(cartItem.getUpdatedAt())
                .build();
    }
}
