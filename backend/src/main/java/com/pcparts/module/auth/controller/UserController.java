package com.pcparts.module.auth.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.auth.dto.UserProfileDto;
import com.pcparts.module.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for user profile endpoints.
 * Base path: /api/v1/users
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * GET /api/v1/users/profile — Get current user's profile.
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(Authentication authentication) {
        UserProfileDto profile = userService.getProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * PUT /api/v1/users/profile — Update current user's profile.
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            Authentication authentication,
            @RequestBody UserProfileDto dto) {
        UserProfileDto updated = userService.updateProfile(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * PUT /api/v1/users/password — Change password.
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @RequestBody Map<String, String> request) {
        userService.changePassword(
                authentication.getName(),
                request.get("currentPassword"),
                request.get("newPassword")
        );
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }
}
