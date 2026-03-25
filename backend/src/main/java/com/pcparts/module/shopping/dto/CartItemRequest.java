package com.pcparts.module.shopping.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for adding/updating cart items.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemRequest {

    @NotNull(message = "Product ID không được để trống")
    private Long productId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải >= 1")
    private Integer quantity;
}
