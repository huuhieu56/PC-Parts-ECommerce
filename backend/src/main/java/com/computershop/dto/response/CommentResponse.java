package com.computershop.dto.response;

import com.computershop.entity.Comment;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {

    private Long id;

    private String content;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("product_id")
    private Long productId;

    @JsonProperty("parent_comment_id")
    private Long parentCommentId;

    @JsonProperty("is_staff_reply")
    private Boolean isStaffReply;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    private List<CommentResponse> replies;

    public static CommentResponse fromEntity(Comment comment) {
        if (comment == null) {
            return null;
        }

        CommentResponseBuilder builder = CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .userId(comment.getUser().getId())
                .fullName(comment.getUser().getFullName())
                .productId(comment.getProduct().getId())
                .isStaffReply(comment.getIsStaffReply())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt());

        if (comment.getParentComment() != null) {
            builder.parentCommentId(comment.getParentComment().getId());
        }

        // Lấy replies nếu có
        if (comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            List<CommentResponse> replyResponses = comment.getReplies()
                    .stream()
                    .map(CommentResponse::fromEntity)
                    .collect(Collectors.toList());
            builder.replies(replyResponses);
        }

        return builder.build();
    }

    public static CommentResponse fromEntityWithoutReplies(Comment comment) {
        if (comment == null) {
            return null;
        }

        CommentResponseBuilder builder = CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .userId(comment.getUser().getId())
                .fullName(comment.getUser().getFullName())
                .productId(comment.getProduct().getId())
                .isStaffReply(comment.getIsStaffReply())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt());

        if (comment.getParentComment() != null) {
            builder.parentCommentId(comment.getParentComment().getId());
        }

        return builder.build();
    }
}
