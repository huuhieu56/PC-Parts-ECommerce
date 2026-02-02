package com.computershop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "product_images_seq")
    @SequenceGenerator(name = "product_images_seq", sequenceName = "product_images_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "image_url", length = 500, nullable = false)
    private String filePath;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;
}
