package com.pcparts.module.product.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * AttributeValue entity — possible values for an attribute.
 */
@Entity
@Table(name = "attribute_value")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attribute_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Attribute attribute;

    @Column(nullable = false)
    private String value;
}
