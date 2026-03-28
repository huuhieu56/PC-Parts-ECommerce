package com.pcparts.module.warranty.entity;

import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.order.entity.Order;
import com.pcparts.module.order.entity.OrderDetail;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ReturnRequest entity — maps to DB table return_request.
 * Handles return/refund requests linked to specific OrderDetail.
 */
@Entity
@Table(name = "return_request")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserProfile user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_detail_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private OrderDetail orderDetail;

    @Column(length = 20, nullable = false)
    private String type; // EXCHANGE or REFUND

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING_APPROVAL"; // PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED

    @Column(name = "refund_amount", precision = 15, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
