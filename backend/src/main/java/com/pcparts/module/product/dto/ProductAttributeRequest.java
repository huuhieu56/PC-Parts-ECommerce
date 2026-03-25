package com.pcparts.module.product.dto;

import lombok.*;

/**
 * Request DTO for product attribute assignment.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductAttributeRequest {
    private Long attributeId;
    private Long attributeValueId;
}
