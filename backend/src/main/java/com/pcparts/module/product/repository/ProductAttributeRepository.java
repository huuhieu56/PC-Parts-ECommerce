package com.pcparts.module.product.repository;

import com.pcparts.module.product.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ProductAttribute entity.
 */
@Repository
public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, ProductAttribute.ProductAttributeId> {

    List<ProductAttribute> findByProductId(Long productId);

    void deleteByProductId(Long productId);
}
