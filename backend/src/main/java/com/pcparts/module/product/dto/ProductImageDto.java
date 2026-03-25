package com.pcparts.module.product.dto;

import lombok.*;

/**
 * DTO for product images.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageDto {
    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
    private Integer sortOrder;
}
