package com.pcparts.module.product.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for product responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private String name;
    private String sku;
    private String slug;
    private BigDecimal originalPrice;
    private BigDecimal sellingPrice;
    private String description;
    private Long categoryId;
    private String categoryName;
    private Long brandId;
    private String brandName;
    private String condition;
    private String status;
    private List<ProductImageDto> images;
    private List<ProductAttributeDto> attributes;
}
