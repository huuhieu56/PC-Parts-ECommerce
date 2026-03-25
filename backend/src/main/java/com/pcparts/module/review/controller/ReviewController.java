package com.pcparts.module.review.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.review.service.ReviewService;
import com.pcparts.module.review.service.ReviewService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDto>> create(Authentication auth, @RequestBody ReviewRequest req) {
        Long userId = Long.parseLong(auth.getName());
        ReviewDto dto = reviewService.createReview(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Đánh giá thành công", dto));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<ReviewDto>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Đánh giá sản phẩm", reviewService.getProductReviews(productId, page, size)));
    }
}
