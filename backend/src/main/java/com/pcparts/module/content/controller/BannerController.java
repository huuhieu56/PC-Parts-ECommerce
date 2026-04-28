package com.pcparts.module.content.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.content.dto.BannerDto;
import com.pcparts.module.content.dto.BannerOrderRequest;
import com.pcparts.module.content.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST controller for homepage banner/slider content.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BannerController {

    private final BannerService bannerService;

    /**
     * Public endpoint for active homepage banners.
     */
    @GetMapping("/banners")
    public ResponseEntity<ApiResponse<List<BannerDto>>> getActiveBanners() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách banner trang chủ", bannerService.getActiveBanners()));
    }

    /**
     * Admin endpoint for all banners.
     */
    @GetMapping("/admin/banners")
    @PreAuthorize("hasAuthority('banner.view')")
    public ResponseEntity<ApiResponse<List<BannerDto>>> getAllBanners() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách banner", bannerService.getAllBanners()));
    }

    /**
     * Creates a banner with an uploaded image.
     */
    @PostMapping(value = "/admin/banners", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('banner.create')")
    public ResponseEntity<ApiResponse<BannerDto>> createBanner(
            @RequestParam String title,
            @RequestParam MultipartFile image,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(required = false) String placement,
            @RequestParam(required = false) Integer sortOrder,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String status) {
        BannerDto created = bannerService.createBanner(title, image, linkUrl, placement, sortOrder, startDate, endDate, status);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo banner thành công", created));
    }

    /**
     * Updates a banner and optionally replaces its image.
     */
    @PutMapping(value = "/admin/banners/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('banner.update')")
    public ResponseEntity<ApiResponse<BannerDto>> updateBanner(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(required = false) String placement,
            @RequestParam(required = false) Integer sortOrder,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String status) {
        BannerDto updated = bannerService.updateBanner(id, title, image, linkUrl, placement, sortOrder, startDate, endDate, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật banner thành công", updated));
    }

    /**
     * Deletes a banner.
     */
    @DeleteMapping("/admin/banners/{id}")
    @PreAuthorize("hasAuthority('banner.delete')")
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa banner thành công", null));
    }

    /**
     * Updates banner display order.
     */
    @PatchMapping("/admin/banners/reorder")
    @PreAuthorize("hasAuthority('banner.update')")
    public ResponseEntity<ApiResponse<List<BannerDto>>> reorderBanners(
            @Valid @RequestBody List<BannerOrderRequest> requests) {
        return ResponseEntity.ok(ApiResponse.success("Sắp xếp banner thành công", bannerService.reorderBanners(requests)));
    }
}
