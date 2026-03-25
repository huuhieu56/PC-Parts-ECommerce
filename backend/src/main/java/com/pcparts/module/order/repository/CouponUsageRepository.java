package com.pcparts.module.order.repository;

import com.pcparts.module.order.entity.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for CouponUsage entity.
 */
@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    boolean existsByCouponIdAndUserId(Long couponId, Long userId);
}
