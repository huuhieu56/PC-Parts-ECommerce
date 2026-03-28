package com.pcparts.module.warranty.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.warranty.service.ReturnService;
import com.pcparts.module.warranty.service.ReturnService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * REST controller for return/refund requests (UC-CUS-11).
 */
@RestController
@RequestMapping("/api/v1/returns")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    /**
     * Creates a return/refund request. Requires authentication.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ReturnDto>> create(
            Authentication auth,
            @RequestBody ReturnRequestDto req) {
        Long accountId = Long.parseLong(auth.getName());
        ReturnDto dto = returnService.createRequest(accountId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Yêu cầu đổi trả đã được tạo", dto));
    }

    /**
     * Gets return requests for the current user.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<ReturnDto>>> getMyRequests(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long accountId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Danh sách đổi trả",
                returnService.getMyRequests(accountId, page, size)));
    }

    /**
     * Gets all return requests (admin/sales).
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('return.view', 'return.manage')")
    public ResponseEntity<ApiResponse<Page<ReturnDto>>> getAllRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Tất cả yêu cầu đổi trả",
                returnService.getAllRequests(status, page, size)));
    }

    /**
     * Updates return request status (admin/sales).
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('return.manage')")
    public ResponseEntity<ApiResponse<ReturnDto>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) BigDecimal refundAmount) {
        ReturnDto dto = returnService.updateStatus(id, status, refundAmount);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đổi trả", dto));
    }
}
