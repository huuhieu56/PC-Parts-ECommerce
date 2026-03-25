package com.pcparts.module.product.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

/**
 * ProductAttribute entity — links products to attribute values (EAV join table).
 */
@Entity
@Table(name = "product_attribute")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ProductAttribute.ProductAttributeId.class)
public class ProductAttribute {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attribute_id")
    private Attribute attribute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attribute_value_id", nullable = false)
    private AttributeValue attributeValue;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductAttributeId implements Serializable {
        private Long product;
        private Long attribute;
    }
}
