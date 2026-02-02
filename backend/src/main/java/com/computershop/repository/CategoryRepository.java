package com.computershop.repository;

import com.computershop.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByIsActiveTrue();

    List<Category> findByParentCategoryIsNull();

    List<Category> findByParentCategoryId(Long parentCategoryId);

    @Query("SELECT c FROM Category c WHERE c.isActive = true AND c.parentCategory IS NULL")
    List<Category> findActiveRootCategories();

    @Query("SELECT c FROM Category c WHERE c.isActive = true AND c.parentCategory.id = :parentId")
    List<Category> findActiveSubCategories(Long parentId);

    boolean existsByName(String name);
}