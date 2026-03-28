package com.pcparts.module.warranty.entity;

import com.pcparts.module.product.entity.Category;
import com.pcparts.module.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;

/**
 * WarrantyPolicy entity — maps to DB table warranty_policy.
 * Defines warranty duration and conditions per Category or Product.
 */
@Entity
@Table(name = "warranty_policy")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarrantyPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product;

    @Column(name = "duration_months", nullable = false)
    private Integer durationMonths;

    @Column(columnDefinition = "TEXT")
    private String conditions;

    @Column(columnDefinition = "TEXT")
    private String description;
}
