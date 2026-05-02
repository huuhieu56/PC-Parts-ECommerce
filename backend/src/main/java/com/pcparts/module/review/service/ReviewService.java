package com.pcparts.module.review.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.order.entity.Order;

import com.pcparts.module.order.repository.OrderDetailRepository;
import com.pcparts.module.order.repository.OrderRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.review.entity.Review;
import com.pcparts.module.review.entity.ReviewImage;
import com.pcparts.module.review.repository.ReviewRepository;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for product reviews.
 * BUG-06 fix: validates Order is COMPLETED and Product is in Order before allowing review.
 * BUG-13 fix: resolves accountId → UserProfile via findByAccountId.
 * UC-CUS-07: supports Review_Image for customer uploaded images.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserProfileRepository userProfileRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;

    /**
     * Creates a review for a purchased product.
     *
     * @param accountId the account ID from JWT
     * @param request   review creation request
     * @return created review DTO
     */
    @Transactional
    public ReviewDto createReview(Long accountId, ReviewRequest request) {
        // BUG-13 fix: resolve accountId → UserProfile
        UserProfile user = resolveUserProfile(accountId);

        if (reviewRepository.existsByUserIdAndProductId(user.getId(), request.getProductId())) {
            throw new BusinessException("Bạn đã đánh giá sản phẩm này rồi", HttpStatus.CONFLICT);
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        // Validate rating range
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new BusinessException("Số sao phải từ 1 đến 5", HttpStatus.BAD_REQUEST);
        }

        // UC-CUS-07: MUST validate user has purchased the product (order COMPLETED)
        Order order = null;
        if (request.getOrderId() != null) {
            // If orderId provided, validate it
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));

            if (!order.getUser().getId().equals(user.getId())) {
                throw new BusinessException("Đơn hàng không thuộc về bạn", HttpStatus.FORBIDDEN);
            }

            if (!"COMPLETED".equals(order.getStatus())) {
                throw new BusinessException("Chỉ có thể đánh giá sản phẩm khi đơn hàng đã hoàn thành", HttpStatus.BAD_REQUEST);
            }

            boolean productInOrder = orderDetailRepository.findByOrderId(order.getId()).stream()
                    .anyMatch(d -> d.getProduct().getId().equals(product.getId()));
            if (!productInOrder) {
                throw new BusinessException("Sản phẩm này không có trong đơn hàng", HttpStatus.BAD_REQUEST);
            }
        } else {
            // UC-CUS-07: If no orderId provided, verify user has purchased this product in any COMPLETED order
            boolean hasPurchased = orderDetailRepository.existsByOrderUserIdAndOrderStatusAndProductId(
                    user.getId(), "COMPLETED", product.getId());

            // UC-CUS-07 Exception: User has not purchased this product
            if (!hasPurchased) {
                throw new BusinessException("Bạn cần mua sản phẩm này để đánh giá", HttpStatus.BAD_REQUEST);
            }
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .order(order)
                .rating(request.getRating())
                .content(request.getContent())
                .build();

        // UC-CUS-07: Create ReviewImage entities for uploaded images
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<ReviewImage> images = request.getImageUrls().stream()
                    .map(url -> ReviewImage.builder()
                            .review(review)
                            .imageUrl(url)
                            .build())
                    .collect(Collectors.toList());
            review.setImages(images);
        }

        Review savedReview = reviewRepository.save(review);
        return toDto(savedReview);
    }

    /**
     * Gets paginated reviews for a product.
     */
    @Transactional(readOnly = true)
    public Page<ReviewDto> getProductReviews(Long productId, int page, int size) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, PageRequest.of(page, size))
                .map(this::toDto);
    }

    private ReviewDto toDto(Review r) {
        List<String> imageUrls = r.getImages() != null
                ? r.getImages().stream().map(ReviewImage::getImageUrl).collect(Collectors.toList())
                : new ArrayList<>();

         return ReviewDto.builder()
                .id(r.getId())
                .productId(r.getProduct().getId())
                .customerName(r.getUser().getFullName()) // UC-CUS-07: Include customer name
                .rating(r.getRating())
                .content(r.getContent())
                .images(imageUrls) // UC-CUS-07: Include review images
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null)
                .build();
    }

    private UserProfile resolveUserProfile(Long accountId) {
        return userProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", accountId));
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReviewDto {
        private Long id;
        private Long productId;
        private String customerName; // UC-CUS-07: Customer name from UserProfile.fullName
        private Integer rating;
        private String content;
        @Builder.Default
        private List<String> images = new ArrayList<>(); // UC-CUS-07: Review image URLs
        private String createdAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ReviewRequest {
        private Long productId;
        private Long orderId;
        private Integer rating;
        private String content;
        private List<String> imageUrls; // UC-CUS-07: Image URLs after upload to MinIO
    }
}
