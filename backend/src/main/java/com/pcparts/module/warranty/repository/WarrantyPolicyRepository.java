package com.pcparts.module.warranty.repository;

import com.pcparts.module.warranty.entity.WarrantyPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for WarrantyPolicy entity.
 */
@Repository
public interface WarrantyPolicyRepository extends JpaRepository<WarrantyPolicy, Long> {

    /**
     * Finds warranty policy for a specific product.
     * Product-level policy takes priority over category-level.
     *
     * @param productId the product ID
     * @return warranty policy if found
     */
    Optional<WarrantyPolicy> findByProductId(Long productId);

    /**
     * Finds warranty policies for a category.
     *
     * @param categoryId the category ID
     * @return list of warranty policies
     */
    List<WarrantyPolicy> findByCategoryId(Long categoryId);
}
