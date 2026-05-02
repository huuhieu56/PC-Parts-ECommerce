package com.pcparts.module.product.repository;

import com.pcparts.module.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * Repository for ProductImage entity.
 */
@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    List<ProductImage> findByProductIdInOrderBySortOrderAsc(Collection<Long> productIds);

    void deleteByProductId(Long productId);
}

