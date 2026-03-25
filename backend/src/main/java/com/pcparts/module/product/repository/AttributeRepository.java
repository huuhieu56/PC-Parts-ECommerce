package com.pcparts.module.product.repository;

import com.pcparts.module.product.entity.Attribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Attribute entity.
 */
@Repository
public interface AttributeRepository extends JpaRepository<Attribute, Long> {

    List<Attribute> findByCategoryId(Long categoryId);
}
