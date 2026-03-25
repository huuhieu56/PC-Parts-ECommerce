package com.pcparts.module.buildpc.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.buildpc.service.PcBuildService;
import com.pcparts.module.buildpc.service.PcBuildService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Build PC feature.
 * Supports both guest (via X-Session-Id header) and authenticated users.
 */
@RestController
@RequestMapping("/api/v1/build-pc")
@RequiredArgsConstructor
public class PcBuildController {

    private final PcBuildService pcBuildService;

    /**
     * Gets available slot types.
     */
    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<List<String>>> getSlotTypes() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách loại slot", pcBuildService.getSlotTypes()));
    }

    /**
     * Creates a new build configuration.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PcBuildDto>> createBuild(
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestBody(required = false) CreateBuildRequest request) {
        Long userId = getAccountId(auth);
        String name = request != null ? request.getName() : null;
        PcBuildDto dto = pcBuildService.createBuild(userId, sessionId, name);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo cấu hình thành công", dto));
    }

    /**
     * Lists all builds for the current user/session.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PcBuildDto>>> getBuilds(
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        Long userId = getAccountId(auth);
        return ResponseEntity.ok(ApiResponse.success("Danh sách cấu hình", pcBuildService.getBuilds(userId, sessionId)));
    }

    /**
     * Gets a specific build by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PcBuildDto>> getBuild(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        Long userId = getAccountId(auth);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết cấu hình", pcBuildService.getBuild(id, userId, sessionId)));
    }

    /**
     * Adds or replaces a component in a slot.
     */
    @PostMapping("/{id}/components")
    public ResponseEntity<ApiResponse<PcBuildDto>> addComponent(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestBody AddComponentRequest request) {
        Long userId = getAccountId(auth);
        int qty = request.getQuantity() != null ? request.getQuantity() : 1;
        PcBuildDto dto = pcBuildService.addComponent(id, userId, sessionId,
                request.getSlotType(), request.getProductId(), qty);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm linh kiện", dto));
    }

    /**
     * Removes a component from a slot.
     */
    @DeleteMapping("/{id}/components/{slotType}")
    public ResponseEntity<ApiResponse<PcBuildDto>> removeComponent(
            @PathVariable Long id,
            @PathVariable String slotType,
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        Long userId = getAccountId(auth);
        PcBuildDto dto = pcBuildService.removeComponent(id, userId, sessionId, slotType);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa linh kiện", dto));
    }

    /**
     * Adds all components of the build to the shopping cart.
     * Requires authentication.
     */
    @PostMapping("/{id}/add-to-cart")
    public ResponseEntity<ApiResponse<Void>> addBuildToCart(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = getAccountId(auth);
        pcBuildService.addBuildToCart(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm cấu hình vào giỏ hàng", null));
    }

    /**
     * Deletes a build configuration.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBuild(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {
        Long userId = getAccountId(auth);
        pcBuildService.deleteBuild(id, userId, sessionId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa cấu hình", null));
    }

    private Long getAccountId(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return Long.parseLong(auth.getName());
        }
        return null;
    }
}
