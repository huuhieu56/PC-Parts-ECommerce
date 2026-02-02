package com.computershop.controller;

import com.computershop.dto.request.InventoryRequest;
import com.computershop.dto.response.*;
import com.computershop.service.interfaces.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// REST controller cho quản lý tồn kho.
// Chỉ chứa các API cần thiết cho STAFF/ADMIN: điều chỉnh, xem lịch sử, báo cáo low-stock.
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Slf4j
public class InventoryController {

    private final InventoryService inventoryService;


    // Lấy sản phẩm sắp hết kho (dưới ngưỡng). Quyền: STAFF, ADMIN
    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LowStockSummaryResponse>> getLowStockProducts(
            @RequestParam(defaultValue = "10") int threshold) {

        log.info("Lấy sản phẩm sắp hết kho với ngưỡng: {}", threshold);
        LowStockSummaryResponse response = inventoryService.getLowStockSummary(threshold);

        return ResponseEntity.ok(ApiResponse.<LowStockSummaryResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách sản phẩm sắp hết hàng thành công")
                .data(response)
                .build());
    }

    // Điều chỉnh tồn kho cho một sản phẩm. Quyền: ADMIN
    @PostMapping("/products/{productId}/adjust")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustInventory(
            @PathVariable Long productId,
            @Valid @RequestBody InventoryRequest request) {

        log.info("Điều chỉnh tồn kho cho sản phẩm {} với yêu cầu: {}", productId, request);
        InventoryResponse response = inventoryService.adjustInventory(productId, request);

        return ResponseEntity.ok(ApiResponse.<InventoryResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Điều chỉnh tồn kho thành công")
                .data(response)
                .build());
    }


    // Lấy toàn bộ lịch sử thay đổi kho theo phân trang (InventoryLog -> DTO). Quyền: ADMIN
    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<InventoryLogResponse>>> getAllInventoryHistory(
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("Lấy toàn bộ lịch sử tồn kho với phân trang: {}", pageable);

        Page<InventoryLogResponse> historyPage = inventoryService.getAllInventoryHistory(pageable);

        PagedResponse<InventoryLogResponse> payload = PagedResponse.fromPage(historyPage);

        return ResponseEntity.ok(ApiResponse.<PagedResponse<InventoryLogResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy toàn bộ lịch sử tồn kho thành công")
                .data(payload)
                .build());
    }

}
