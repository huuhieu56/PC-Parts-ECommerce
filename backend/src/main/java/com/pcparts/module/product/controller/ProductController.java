package com.pcparts.module.product.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.common.dto.PageResponse;
import com.pcparts.module.product.dto.ProductDto;
import com.pcparts.module.product.dto.ProductImageDto;
import com.pcparts.module.product.dto.ProductRequest;
import com.pcparts.module.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST controller for product operations.
 */
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // --- Public endpoints ---

    /**
     * Lists active products with pagination, filtering, and search.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductDto>>> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String keyword) {

        PageResponse<ProductDto> result = productService.listProducts(page, size, sort, categoryId, brandId, keyword);
        return ResponseEntity.ok(ApiResponse.success("Danh sách sản phẩm", result));
    }

    /**
     * Gets product detail by slug.
     */
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<ProductDto>> getBySlug(@PathVariable String slug) {
        ProductDto product = productService.getBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết sản phẩm", product));
    }

    // --- Admin endpoints ---

    /**
     * Gets product by ID (admin).
     */
    @GetMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<ApiResponse<ProductDto>> getById(@PathVariable Long id) {
        ProductDto product = productService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết sản phẩm", product));
    }

    /**
     * Creates a new product (admin/sales).
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductDto product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo sản phẩm thành công", product));
    }

    /**
     * Updates an existing product (admin/sales).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        ProductDto product = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sản phẩm thành công", product));
    }

    /**
     * Soft-deletes a product (admin only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sản phẩm thành công", null));
    }

    /**
     * Uploads images for a product (admin/sales).
     */
    @PostMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<ApiResponse<List<ProductImageDto>>> uploadImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(defaultValue = "true") boolean primaryFirst) {
        List<ProductImageDto> images = productService.uploadImages(id, files, primaryFirst);
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", images));
    }

    /**
     * Deletes a product image (admin/sales).
     */
    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable Long imageId) {
        productService.deleteImage(imageId);
        return ResponseEntity.ok(ApiResponse.success("Xóa ảnh thành công", null));
    }
}
