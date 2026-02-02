package com.computershop.service.interfaces;

import com.computershop.dto.request.CategoryRequest;
import com.computershop.dto.response.CategoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CategoryService {


    List<CategoryResponse> getActiveCategories();


    List<CategoryResponse> getRootCategories();


    List<CategoryResponse> getSubCategories(Long parentCategoryId);


    CategoryResponse getCategoryById(Long id);


    CategoryResponse createCategory(CategoryRequest request);


    CategoryResponse updateCategory(Long id, CategoryRequest request);


    void deleteCategory(Long id);


    Page<CategoryResponse> getAllCategories(Pageable pageable);
}
