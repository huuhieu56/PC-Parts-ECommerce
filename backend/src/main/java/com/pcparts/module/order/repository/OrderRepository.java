package com.pcparts.module.order.repository;

import com.pcparts.module.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

/**
 * Repository for Order entity with aggregate query support.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Order> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /**
     * Returns the sum of all order totalAmount values.
     * Uses JPQL aggregate query for O(1) performance instead of loading all orders.
     *
     * @return total revenue as BigDecimal, or BigDecimal.ZERO if no orders exist
     */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o")
    BigDecimal sumTotalRevenue();
}
