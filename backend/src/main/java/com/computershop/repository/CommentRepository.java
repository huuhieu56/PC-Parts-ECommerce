package com.computershop.repository;

import com.computershop.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c WHERE c.product.id = :productId AND c.parentComment IS NULL ORDER BY c.createdAt DESC")
    Page<Comment> findRootCommentsByProductId(@Param("productId") Long productId, Pageable pageable);

    @Query("SELECT c FROM Comment c WHERE c.parentComment.id = :parentId ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByParentId(@Param("parentId") Long parentId);

    long countByProductId(Long productId);

    long countByParentCommentId(Long parentId);

    @Query("SELECT c FROM Comment c WHERE c.user.id = :userId ORDER BY c.createdAt DESC")
    Page<Comment> findCommentsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT c FROM Comment c WHERE c.product.id = :productId ORDER BY c.createdAt DESC")
    List<Comment> findAllCommentsByProductId(@Param("productId") Long productId);

    @Query("SELECT c FROM Comment c WHERE c.parentComment IS NULL ORDER BY c.createdAt DESC")
    Page<Comment> findAllRootComments(Pageable pageable);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
