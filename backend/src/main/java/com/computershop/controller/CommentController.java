package com.computershop.controller;

import com.computershop.dto.request.CommentRequest;
import com.computershop.dto.response.ApiResponse;
import com.computershop.dto.response.CommentResponse;
import com.computershop.dto.response.PagedResponse;
import com.computershop.service.interfaces.CommentService;
import com.computershop.util.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final JwtUtils jwtUtils;

    // Lấy bình luận của sản phẩm
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<PagedResponse<CommentResponse>>> getCommentsByProduct(
            @PathVariable Long productId, Pageable pageable) {
        Page<CommentResponse> comments = commentService.getCommentsByProduct(productId, pageable);
        PagedResponse<CommentResponse> paged = PagedResponse.fromPage(comments);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<CommentResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy bình luận sản phẩm thành công")
                .data(paged)
                .build());
    }

    // Lấy tất cả bình luận của mọi sản phẩm (dành cho staff/admin)
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<CommentResponse>>> getAllComments(Pageable pageable) {
        Page<CommentResponse> comments = commentService.getAllComments(pageable);
        PagedResponse<CommentResponse> paged = PagedResponse.fromPage(comments);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<CommentResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách bình luận thành công")
                .data(paged)
                .build());
    }

    // Lấy chi tiết bình luận theo ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> getCommentById(@PathVariable Long id) {
        CommentResponse comment = commentService.getCommentById(id);
        return ResponseEntity.ok(ApiResponse.<CommentResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy thông tin bình luận thành công")
                .data(comment)
                .build());
    }

    // Tạo bình luận mới
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('STAFF') or hasRole('ADMIN')")
    @PostMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable Long productId,
            @Valid @RequestBody CommentRequest request) {
        Long userId = jwtUtils.getCurrentUserId();
        CommentResponse comment = commentService.createComment(productId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<CommentResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Tạo bình luận thành công")
                        .data(comment)
                        .build());
    }

    // Reply bình luận (dành cho staff)
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    @PostMapping("/{commentId}/reply")
    public ResponseEntity<ApiResponse<CommentResponse>> replyComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request) {
        Long userId = jwtUtils.getCurrentUserId();
        CommentResponse comment = commentService.replyComment(commentId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<CommentResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Reply bình luận thành công")
                        .data(comment)
                        .build());
    }

    // Cập nhật bình luận
    @PreAuthorize("hasRole('ADMIN') or @commentService.isCommentOwner(#id, @jwtUtils.getCurrentUserId())")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request) {
        CommentResponse comment = commentService.updateComment(id, request);
        return ResponseEntity.ok(ApiResponse.<CommentResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật bình luận thành công")
                .data(comment)
                .build());
    }

    // Xóa bình luận
    @PreAuthorize("hasRole('ADMIN') or @commentService.isCommentOwner(#id, @jwtUtils.getCurrentUserId())")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Xóa bình luận thành công")
                .build());
    }
}
