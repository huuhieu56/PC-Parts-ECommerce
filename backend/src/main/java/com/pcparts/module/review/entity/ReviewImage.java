package com.pcparts.module.review.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * ReviewImage entity — maps to DB table review_image.
 * Stores images uploaded by customers with their product reviews.
 */
@Entity
@Table(name = "review_image")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Review review;

    @Column(name = "image_url", length = 500, nullable = false)
    private String imageUrl;
}
