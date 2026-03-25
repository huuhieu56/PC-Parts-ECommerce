package com.pcparts.module.product.dto;

import lombok.*;

/**
 * DTO for product attributes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductAttributeDto {
    private Long attributeId;
    private String attributeName;
    private String value;
}
