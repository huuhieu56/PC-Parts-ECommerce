package com.pcparts.module.product.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for creating/updating products.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @NotBlank(message = "SKU không được để trống")
    private String sku;

    @NotNull(message = "Giá gốc không được để trống")
    @DecimalMin(value = "0", message = "Giá gốc phải >= 0")
    private BigDecimal originalPrice;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0", message = "Giá bán phải >= 0")
    private BigDecimal sellingPrice;

    private String description;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotNull(message = "Thương hiệu không được để trống")
    private Long brandId;

    private String condition;

    private List<ProductAttributeRequest> attributes;
}
