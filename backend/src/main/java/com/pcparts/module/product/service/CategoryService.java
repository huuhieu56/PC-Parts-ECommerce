package com.pcparts.module.product.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.product.dto.CategoryDto;
import com.pcparts.module.product.entity.Category;
import com.pcparts.module.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for category CRUD with hierarchy support.
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * Gets all categories as a tree (root categories with children).
     */
    @Transactional(readOnly = true)
    public List<CategoryDto> getCategoryTree() {
        List<Category> roots = categoryRepository.findByParentIsNullOrderByNameAsc();
        return roots.stream().map(this::toDtoWithChildren).collect(Collectors.toList());
    }

    /**
     * Gets a single category by ID.
     */
    @Transactional(readOnly = true)
    public CategoryDto getById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return toDtoWithChildren(category);
    }

    /**
     * Creates a new category.
     */
    @Transactional
    public CategoryDto createCategory(CategoryDto dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new BusinessException("Danh mục đã tồn tại", HttpStatus.CONFLICT);
        }

        Category category = Category.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();

        if (dto.getParentId() != null) {
            Category parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", dto.getParentId()));
            category.setParent(parent);
            category.setLevel(parent.getLevel() + 1);
        }

        category = categoryRepository.save(category);
        return toDto(category);
    }

    /**
     * Updates an existing category.
     */
    @Transactional
    public CategoryDto updateCategory(Long id, CategoryDto dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        category.setName(dto.getName());
        category.setDescription(dto.getDescription());

        if (dto.getParentId() != null && !dto.getParentId().equals(id)) {
            Category parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", dto.getParentId()));
            category.setParent(parent);
            category.setLevel(parent.getLevel() + 1);
        }

        category = categoryRepository.save(category);
        return toDto(category);
    }

    /**
     * Deletes a category.
     */
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        categoryRepository.delete(category);
    }

    private CategoryDto toDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .level(category.getLevel())
                .build();
    }

    private CategoryDto toDtoWithChildren(Category category) {
        List<CategoryDto> children = categoryRepository.findByParentIdOrderByNameAsc(category.getId())
                .stream()
                .map(this::toDtoWithChildren)
                .collect(Collectors.toList());

        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .level(category.getLevel())
                .children(children)
                .build();
    }
}
