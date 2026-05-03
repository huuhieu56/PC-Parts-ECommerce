package com.pcparts.module.dashboard.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.dashboard.service.AdminDashboardService;
import com.pcparts.module.dashboard.service.AdminDashboardService.DashboardStatsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for admin dashboard analytics endpoints.
 */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('report.revenue', 'inventory.view')")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    /**
     * Returns dashboard summary statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats", dashboardService.getStats()));
    }
}
