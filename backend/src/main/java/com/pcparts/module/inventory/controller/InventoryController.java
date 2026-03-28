package com.pcparts.module.inventory.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.inventory.entity.InventoryLog;
import com.pcparts.module.inventory.service.InventoryService;
import com.pcparts.module.inventory.service.InventoryService.InventoryDto;
import com.pcparts.module.inventory.service.InventoryService.StockRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for inventory management.
 * Only accessible by ADMIN and WAREHOUSE staff.
 */
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    /**
     * Gets inventory for a product.
     */
    @GetMapping("/{productId}")
    @PreAuthorize("hasAuthority('inventory.view')")
    public ResponseEntity<ApiResponse<InventoryDto>> getInventory(@PathVariable Long productId) {
        InventoryDto dto = inventoryService.getByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success("Thông tin tồn kho", dto));
    }

    /**
     * Imports stock.
     */
    @PostMapping("/{productId}/import")
    @PreAuthorize("hasAuthority('inventory.import')")
    public ResponseEntity<ApiResponse<InventoryDto>> importStock(
            @PathVariable Long productId,
            @RequestBody StockRequest request,
            Authentication auth) {
        InventoryDto dto = inventoryService.importStock(
                productId, request.getQuantity(), request.getReason(), auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Nhập kho thành công", dto));
    }

    /**
     * Exports stock.
     */
    @PostMapping("/{productId}/export")
    @PreAuthorize("hasAuthority('inventory.import')")
    public ResponseEntity<ApiResponse<InventoryDto>> exportStock(
            @PathVariable Long productId,
            @RequestBody StockRequest request,
            Authentication auth) {
        InventoryDto dto = inventoryService.exportStock(
                productId, request.getQuantity(), request.getReason(), auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Xuất kho thành công", dto));
    }

    /**
     * Adjusts stock (manual correction).
     */
    @PostMapping("/{productId}/adjust")
    @PreAuthorize("hasAuthority('inventory.adjust')")
    public ResponseEntity<ApiResponse<InventoryDto>> adjustStock(
            @PathVariable Long productId,
            @RequestBody StockRequest request,
            Authentication auth) {
        InventoryDto dto = inventoryService.adjustStock(
                productId, request.getQuantity(), request.getReason(), auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Điều chỉnh tồn kho thành công", dto));
    }

    /**
     * Gets audit log for a product.
     */
    @GetMapping("/{productId}/logs")
    @PreAuthorize("hasAuthority('inventory.view')")
    public ResponseEntity<ApiResponse<Page<InventoryLog>>> getAuditLog(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<InventoryLog> logs = inventoryService.getAuditLog(productId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử biến động kho", logs));
    }
}
