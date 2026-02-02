package com.computershop.service.impl;

import com.computershop.dto.request.CommentRequest;
import com.computershop.dto.response.CommentResponse;
import com.computershop.entity.Comment;
import com.computershop.entity.Product;
import com.computershop.entity.User;
import com.computershop.repository.CommentRepository;
import com.computershop.repository.ProductRepository;
import com.computershop.repository.UserRepository;
import com.computershop.service.interfaces.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service("commentService")
@Transactional
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsByProduct(Long productId, Pageable pageable) {
        Page<Comment> comments = commentRepository.findRootCommentsByProductId(productId, pageable);
        return comments.map(CommentResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getRootCommentsByProduct(Long productId) {
        List<Comment> comments = commentRepository.findAllCommentsByProductId(productId);
        List<Comment> rootComments = comments.stream()
                .filter(comment -> comment.getParentComment() == null)
                .collect(Collectors.toList());
        return rootComments.stream()
                .map(CommentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CommentResponse getCommentById(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận với id: " + id));
        return CommentResponse.fromEntity(comment);
    }

    @Override
    public CommentResponse createComment(Long productId, Long userId, CommentRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy sản phẩm với id: " + productId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + userId));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .product(product)
                .user(user)
                .parentComment(null)
                .isStaffReply("STAFF".equals(user.getRole().getName())
                        || "ADMIN".equals(user.getRole().getName()))
                .build();

        Comment savedComment = commentRepository.save(comment);
        return CommentResponse.fromEntity(savedComment);
    }

    @Override
    public CommentResponse replyComment(Long parentCommentId, Long userId, CommentRequest request) {
        Comment parentComment = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy bình luận cha với id: " + parentCommentId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với id: " + userId));

        Comment reply = Comment.builder()
                .content(request.getContent())
                .product(parentComment.getProduct())
                .user(user)
                .parentComment(parentComment)
                .isStaffReply("STAFF".equals(user.getRole().getName())
                        || "ADMIN".equals(user.getRole().getName()))
                .build();

        Comment savedReply = commentRepository.save(reply);
        return CommentResponse.fromEntity(savedReply);
    }

    @Override
    public CommentResponse updateComment(Long id, CommentRequest request) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận với id: " + id));

        // Nếu comment đã có replies thì không cho phép chỉnh sửa nội dung
        long repliesCount = commentRepository.countByParentCommentId(id);
        if (repliesCount > 0) {
            throw new RuntimeException("Không thể cập nhật bình luận đã có phản hồi");
        }

        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());

        Comment updatedComment = commentRepository.save(comment);
        return CommentResponse.fromEntity(updatedComment);
    }

    @Override
    public void deleteComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận với id: " + id));

        // Xóa tất cả replies trước
        List<Comment> replies = commentRepository.findRepliesByParentId(id);
        if (!replies.isEmpty()) {
            commentRepository.deleteAll(replies);
        }

        // Xóa comment gốc
        commentRepository.delete(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isCommentOwner(Long commentId, Long userId) {
        if (commentId == null || userId == null)
            return false;
        return commentRepository.existsByIdAndUserId(commentId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsByUser(Long userId, Pageable pageable) {
        Page<Comment> comments = commentRepository.findCommentsByUserId(userId, pageable);
        return comments.map(CommentResponse::fromEntityWithoutReplies);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getRepliesByComment(Long commentId) {
        List<Comment> replies = commentRepository.findRepliesByParentId(commentId);
        return replies.stream()
                .map(CommentResponse::fromEntityWithoutReplies)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> getAllComments(Pageable pageable) {
        Page<Comment> comments = commentRepository.findAllRootComments(pageable);
        return comments.map(CommentResponse::fromEntity);
    }
}
