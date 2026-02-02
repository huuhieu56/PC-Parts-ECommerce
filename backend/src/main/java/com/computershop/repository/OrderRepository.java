package com.computershop.repository;

import com.computershop.entity.Order;
import com.computershop.entity.Order.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderCode(String orderCode);

    @Query("SELECT o FROM Order o WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    Page<Order> findOrdersByUserId(@Param("userId") Long userId, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.user.id = :userId AND o.status = :status ORDER BY o.createdAt DESC")
    Page<Order> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") OrderStatus status,
                                      Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findOrdersBetweenDates(@Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = :status")
    Optional<BigDecimal> getTotalRevenueByStatus(@Param("status") OrderStatus status);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate AND o.status = :status")
    Optional<BigDecimal> getTotalRevenueBetweenDatesAndStatus(@Param("startDate") LocalDateTime startDate,
                                                              @Param("endDate") LocalDateTime endDate,
                                                              @Param("status") OrderStatus status);

    long countByStatus(OrderStatus status);

    long countByUserIdAndStatus(Long userId, OrderStatus status);

    Optional<Order> findFirstByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query(value = "SELECT * FROM orders o WHERE o.user_id = :userId ORDER BY o.created_at DESC", countQuery = "SELECT count(*) FROM orders o WHERE o.user_id = :userId", nativeQuery = true)
    Page<Order> findOrdersByUserIdNative(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT * FROM orders o WHERE o.user_id = :userId ORDER BY o.created_at DESC LIMIT 1", nativeQuery = true)
    Optional<Order> findLatestOrderByUserIdNative(@Param("userId") Long userId);

    boolean existsByIdAndUser_Id(Long id, Long userId);

    @Query("SELECT o FROM Order o LEFT JOIN o.user u "
            + "WHERE (LOWER(o.orderCode) LIKE %:kw%) "
            + "OR (LOWER(o.customerName) LIKE %:kw%) "
            + "OR (LOWER(o.customerEmail) LIKE %:kw%) "
            + "OR (LOWER(o.shippingPhone) LIKE %:kw%) "
            + "OR (LOWER(u.username) LIKE %:kw%) "
            + "OR (LOWER(u.email) LIKE %:kw%) "
            + "OR (LOWER(u.phone) LIKE %:kw%) "
            + "ORDER BY o.createdAt DESC")
    Page<Order> searchByKeyword(@Param("kw") String kw, Pageable pageable);
}
