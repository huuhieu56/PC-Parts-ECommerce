package com.pcparts.module.product.repository;

import com.pcparts.module.product.entity.AttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for AttributeValue entity.
 */
@Repository
public interface AttributeValueRepository extends JpaRepository<AttributeValue, Long> {

    List<AttributeValue> findByAttributeId(Long attributeId);

    List<AttributeValue> findByAttributeCategoryId(Long categoryId);
}
