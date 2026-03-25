package com.pcparts.module.shopping.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for cart display.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDto {
    private Long id;
    private List<CartItemDto> items;
    private BigDecimal totalAmount;
    private Integer totalItems;
}
