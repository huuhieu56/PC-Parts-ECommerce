package com.pcparts.module.warranty.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.warranty.service.WarrantyService;
import com.pcparts.module.warranty.service.WarrantyService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/warranty")
@RequiredArgsConstructor
public class WarrantyController {

    private final WarrantyService warrantyService;

    @PostMapping
    public ResponseEntity<ApiResponse<WarrantyDto>> create(Authentication auth, @RequestBody WarrantyRequestDto req) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi yêu cầu thành công", warrantyService.createRequest(userId, req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WarrantyDto>>> getMyRequests(
            Authentication auth, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu bảo hành", warrantyService.getMyRequests(userId, page, size)));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('warranty.view')")
    public ResponseEntity<ApiResponse<Page<WarrantyDto>>> getAllRequests(
            @RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Tất cả yêu cầu", warrantyService.getAllRequests(status, page, size)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('warranty.manage')")
    public ResponseEntity<ApiResponse<WarrantyDto>> updateStatus(
            @PathVariable Long id, @RequestParam String status, @RequestParam(required = false) String resolution) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", warrantyService.updateStatus(id, status, resolution)));
    }
}
