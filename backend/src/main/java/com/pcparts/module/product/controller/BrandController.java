package com.pcparts.module.product.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.product.dto.BrandDto;
import com.pcparts.module.product.service.BrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for brand operations.
 */
@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;

    /**
     * Gets all brands (public).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BrandDto>>> getAllBrands() {
        List<BrandDto> brands = brandService.getAllBrands();
        return ResponseEntity.ok(ApiResponse.success("Danh sách thương hiệu", brands));
    }

    /**
     * Gets brand by ID (public).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandDto>> getById(@PathVariable Long id) {
        BrandDto brand = brandService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết thương hiệu", brand));
    }

    /**
     * Creates a new brand (admin).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BrandDto>> createBrand(@Valid @RequestBody BrandDto dto) {
        BrandDto created = brandService.createBrand(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo thương hiệu thành công", created));
    }

    /**
     * Updates a brand (admin).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BrandDto>> updateBrand(
            @PathVariable Long id, @Valid @RequestBody BrandDto dto) {
        BrandDto updated = brandService.updateBrand(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thương hiệu thành công", updated));
    }

    /**
     * Deletes a brand (admin).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBrand(@PathVariable Long id) {
        brandService.deleteBrand(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa thương hiệu thành công", null));
    }
}
