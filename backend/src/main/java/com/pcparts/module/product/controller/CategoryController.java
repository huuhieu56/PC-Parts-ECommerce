package com.pcparts.module.product.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.product.dto.CategoryDto;
import com.pcparts.module.product.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for category operations.
 */
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * Gets full category tree (public).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategoryTree() {
        List<CategoryDto> tree = categoryService.getCategoryTree();
        return ResponseEntity.ok(ApiResponse.success("Danh sách danh mục", tree));
    }

    /**
     * Gets category by ID (public).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> getById(@PathVariable Long id) {
        CategoryDto category = categoryService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết danh mục", category));
    }

    /**
     * Creates a new category (admin).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('category.create')")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@Valid @RequestBody CategoryDto dto) {
        CategoryDto created = categoryService.createCategory(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo danh mục thành công", created));
    }

    /**
     * Updates a category (admin).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('category.update')")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable Long id, @Valid @RequestBody CategoryDto dto) {
        CategoryDto updated = categoryService.updateCategory(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công", updated));
    }

    /**
     * Deletes a category (admin).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('category.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa danh mục thành công", null));
    }
}
