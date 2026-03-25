package com.pcparts.module.review.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.order.entity.Order;
import com.pcparts.module.order.repository.OrderRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.review.entity.Review;
import com.pcparts.module.review.repository.ReviewRepository;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserProfileRepository userProfileRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public ReviewDto createReview(Long userId, ReviewRequest request) {
        if (reviewRepository.existsByUserIdAndProductId(userId, request.getProductId())) {
            throw new BusinessException("Bạn đã đánh giá sản phẩm này rồi", HttpStatus.CONFLICT);
        }
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "id", userId));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));

        Review review = Review.builder().user(user).product(product).order(order)
                .rating(request.getRating()).content(request.getContent()).build();
        review = reviewRepository.save(review);
        return toDto(review);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getProductReviews(Long productId, int page, int size) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, PageRequest.of(page, size)).map(this::toDto);
    }

    private ReviewDto toDto(Review r) {
        return ReviewDto.builder().id(r.getId()).productId(r.getProduct().getId())
                .rating(r.getRating()).content(r.getContent())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null).build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReviewDto { private Long id; private Long productId; private Integer rating; private String content; private String createdAt; }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ReviewRequest { private Long productId; private Long orderId; private Integer rating; private String content; }
}
