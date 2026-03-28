package com.pcparts.module.product.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Attribute entity — dynamic attributes per category (EAV pattern).
 */
@Entity
@Table(name = "attribute")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attribute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Category category;
}
