package com.computershop.repository;

import com.computershop.entity.Promotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    @Query("SELECT p FROM Promotion p WHERE p.isActive = true AND p.startDate <= :now AND p.endDate >= :now")
    List<Promotion> findActivePromotions(@Param("now") LocalDateTime now);

    List<Promotion> findByNameContainingIgnoreCase(String name);

    List<Promotion> findByDiscountType(Promotion.DiscountType discountType);

    Page<Promotion> findByDiscountType(Promotion.DiscountType discountType, Pageable pageable);

    @Query("SELECT p FROM Promotion p WHERE p.isActive = true AND p.startDate <= :now AND p.endDate >= :now AND p.minimumOrderAmount <= :amount")
    List<Promotion> findApplicablePromotions(@Param("now") LocalDateTime now, @Param("amount") Double amount);

    @Query("SELECT COUNT(p) > 0 FROM Promotion p WHERE p.id = :id AND p.isActive = true AND p.startDate <= :now AND p.endDate >= :now")
    boolean isPromotionActive(@Param("id") Long id, @Param("now") LocalDateTime now);

    @Query("SELECT p FROM Promotion p WHERE p.isActive = true AND p.endDate BETWEEN :now AND :endDate")
    List<Promotion> findPromotionsEndingSoon(@Param("now") LocalDateTime now, @Param("endDate") LocalDateTime endDate);

    boolean existsByNameAndIsActiveTrue(String name);
}
