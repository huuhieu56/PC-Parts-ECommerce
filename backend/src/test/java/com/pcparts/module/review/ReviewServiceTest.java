package com.pcparts.module.review;

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
import com.pcparts.module.review.service.ReviewService;
import com.pcparts.module.review.service.ReviewService.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private com.pcparts.module.order.repository.OrderDetailRepository orderDetailRepository;

    @InjectMocks
    private ReviewService reviewService;

    private UserProfile testUser;
    private Product testProduct;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        testUser = UserProfile.builder().id(1L).fullName("Test").phone("0901111111").build();
        testProduct = Product.builder().id(10L).name("GPU RTX 4090").sellingPrice(new BigDecimal("45000000")).build();
        testOrder = Order.builder().id(100L).user(testUser).status("COMPLETED").build();
    }

    @Test
    @DisplayName("Create review — success")
    void createReview_success() {
        ReviewRequest req = new ReviewRequest(10L, 100L, 5, "Excellent product!");

        when(reviewRepository.existsByUserIdAndProductId(1L, 10L)).thenReturn(false);
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findById(100L)).thenReturn(Optional.of(testOrder));
        when(orderDetailRepository.findByOrderId(100L)).thenReturn(List.of(
                com.pcparts.module.order.entity.OrderDetail.builder().product(testProduct).build()
        ));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(1L);
            r.setCreatedAt(LocalDateTime.now());
            return r;
        });

        ReviewDto result = reviewService.createReview(1L, req);

        assertThat(result).isNotNull();
        assertThat(result.getRating()).isEqualTo(5);
        assertThat(result.getContent()).isEqualTo("Excellent product!");
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    @DisplayName("Create review — duplicate throws conflict")
    void createReview_duplicate() {
        ReviewRequest req = new ReviewRequest(10L, 100L, 5, "Duplicate");
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(reviewRepository.existsByUserIdAndProductId(1L, 10L)).thenReturn(true);

        assertThatThrownBy(() -> reviewService.createReview(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã đánh giá");
    }

    @Test
    @DisplayName("Create review — product not found throws")
    void createReview_productNotFound() {
        ReviewRequest req = new ReviewRequest(999L, 100L, 5, "Test");
        when(reviewRepository.existsByUserIdAndProductId(1L, 999L)).thenReturn(false);
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.createReview(1L, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
