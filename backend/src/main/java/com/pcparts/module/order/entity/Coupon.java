package com.pcparts.module.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Coupon entity — matches DB: min_order_value, max_uses, no is_active.
 */
@Entity
@Table(name = "coupon")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(name = "discount_type", nullable = false, length = 10)
    private String discountType;

    @Column(name = "discount_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "min_order_value", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    @Column(name = "max_discount", precision = 15, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "max_uses")
    @Builder.Default
    private Integer maxUses = 0;

    @Column(name = "used_count")
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Helper: check if active based on dates and usage.
     */
    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return (startDate == null || !now.isBefore(startDate))
            && (endDate == null || !now.isAfter(endDate))
            && (maxUses == null || maxUses <= 0 || (usedCount != null ? usedCount : 0) < maxUses);
    }
}
