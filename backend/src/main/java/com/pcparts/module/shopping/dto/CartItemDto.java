package com.pcparts.module.shopping.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO for cart item display.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private BigDecimal sellingPrice;
    private Integer quantity;
    private BigDecimal lineTotal;
}
