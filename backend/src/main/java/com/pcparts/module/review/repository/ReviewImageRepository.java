package com.pcparts.module.review.repository;

import com.pcparts.module.review.entity.ReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ReviewImage entity.
 */
@Repository
public interface ReviewImageRepository extends JpaRepository<ReviewImage, Long> {

    /**
     * Finds all images for a specific review.
     *
     * @param reviewId the review ID
     * @return list of review images
     */
    List<ReviewImage> findByReviewId(Long reviewId);

    /**
     * Deletes all images for a specific review.
     *
     * @param reviewId the review ID
     */
    void deleteByReviewId(Long reviewId);
}
