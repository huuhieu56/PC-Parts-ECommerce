package com.pcparts.module.buildpc.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.buildpc.dto.CompatibilityRequest;
import com.pcparts.module.buildpc.dto.CompatibilityResponse;
import com.pcparts.module.buildpc.service.BuildPcService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Build PC feature.
 * Provides AI-powered compatibility checking for PC components.
 */
@RestController
@RequestMapping("/api/v1/build-pc")
@RequiredArgsConstructor
@Slf4j
public class BuildPcController {

    private final BuildPcService buildPcService;

    /**
     * Check compatibility of selected PC components using AI.
     * Requires authentication (Customer role minimum).
     *
     * @param request the compatibility check request
     * @return compatibility analysis result
     */
    @PostMapping("/check-compatibility")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CompatibilityResponse>> checkCompatibility(
            @Valid @RequestBody CompatibilityRequest request) {
        log.info("Checking compatibility for {} components", request.getComponents().size());

        CompatibilityResponse response = buildPcService.checkCompatibility(request);

        return ResponseEntity.ok(ApiResponse.success("Kiểm tra tương thích hoàn tất", response));
    }
}
