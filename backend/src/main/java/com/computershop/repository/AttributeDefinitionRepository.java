package com.computershop.repository;

import com.computershop.entity.AttributeDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttributeDefinitionRepository extends JpaRepository<AttributeDefinition, Long> {

    @Query("SELECT a FROM AttributeDefinition a WHERE a.category.id = :categoryId AND a.isActive = true ORDER BY COALESCE(a.sortOrder, 9999)")
    List<AttributeDefinition> findActiveByCategoryId(@Param("categoryId") Long categoryId);

    Optional<AttributeDefinition> findByIdAndCategoryId(Long id, Long categoryId);

    boolean existsByCategoryIdAndCodeIgnoreCase(Long categoryId, String code);

    boolean existsByCategoryIdAndCodeIgnoreCaseAndIdNot(Long categoryId, String code, Long id);
}
