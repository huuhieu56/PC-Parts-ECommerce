package com.pcparts.module.order.repository;

import com.pcparts.module.order.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {
    List<OrderDetail> findByOrderId(Long orderId);

    /**
     * Checks whether a user has purchased a specific product in an order with the given status.
     * Eliminates N+1 queries when validating review/warranty eligibility.
     */
    @Query("SELECT CASE WHEN COUNT(od) > 0 THEN true ELSE false END " +
           "FROM OrderDetail od " +
           "WHERE od.order.user.id = :userId AND od.order.status = :status AND od.product.id = :productId")
    boolean existsByOrderUserIdAndOrderStatusAndProductId(
            @Param("userId") Long userId,
            @Param("status") String status,
            @Param("productId") Long productId);
}

