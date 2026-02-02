package com.computershop.service.interfaces;

import com.computershop.dto.request.CommentRequest;
import com.computershop.dto.response.CommentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentService {


    Page<CommentResponse> getCommentsByProduct(Long productId, Pageable pageable);


    List<CommentResponse> getRootCommentsByProduct(Long productId);


    CommentResponse getCommentById(Long id);

    CommentResponse createComment(Long productId, Long userId, CommentRequest request);


    CommentResponse replyComment(Long parentCommentId, Long userId, CommentRequest request);

    CommentResponse updateComment(Long id, CommentRequest request);

    void deleteComment(Long id);

    boolean isCommentOwner(Long commentId, Long userId);

    Page<CommentResponse> getCommentsByUser(Long userId, Pageable pageable);

    List<CommentResponse> getRepliesByComment(Long commentId);

    Page<CommentResponse> getAllComments(Pageable pageable);
}
