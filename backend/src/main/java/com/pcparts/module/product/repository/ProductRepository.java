package com.pcparts.module.product.repository;

import com.pcparts.module.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Product entity.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);

    boolean existsBySku(String sku);

    boolean existsBySlug(String slug);

    Page<Product> findByStatus(String status, Pageable pageable);

    Page<Product> findByCategoryIdAndStatus(Long categoryId, String status, Pageable pageable);

    Page<Product> findByBrandIdAndStatus(Long brandId, String status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchByKeyword(@Param("keyword") String keyword,
                                  @Param("status") String status,
                                  Pageable pageable);
}
