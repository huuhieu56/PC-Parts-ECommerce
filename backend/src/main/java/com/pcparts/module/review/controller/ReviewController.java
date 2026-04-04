package com.pcparts.module.review.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.product.service.FileService;
import com.pcparts.module.review.service.ReviewService;
import com.pcparts.module.review.service.ReviewService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final FileService fileService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDto>> create(Authentication auth, @RequestBody ReviewRequest req) {
        Long userId = Long.parseLong(auth.getName());
        ReviewDto dto = reviewService.createReview(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Đánh giá thành công", dto));
    }

    /**
     * UC-CUS-07: Upload images for review before creating review.
     * Returns list of uploaded image URLs to be included in review request.
     */
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<String>>> uploadImages(
            Authentication auth,
            @RequestParam("files") List<MultipartFile> files) {
        // Validate authentication
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Vui lòng đăng nhập"));
        }

        List<String> uploadedUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            String url = fileService.uploadFile(file, "reviews");
            uploadedUrls.add(url);
        }

        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", uploadedUrls));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<ReviewDto>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Đánh giá sản phẩm", reviewService.getProductReviews(productId, page, size)));
    }
}
