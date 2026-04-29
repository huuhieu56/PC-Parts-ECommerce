package com.pcparts.module.auth.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.auth.dto.ChangePasswordRequest;
import com.pcparts.module.auth.dto.UpdateUserProfileRequest;
import com.pcparts.module.auth.dto.UserProfileDto;
import com.pcparts.module.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
     * GET /api/v1/users/me — Get current user's profile.
     */
    @GetMapping({"/me", "/profile"})
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(Authentication authentication) {
        UserProfileDto profile = userService.getProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * PUT /api/v1/users/me — Update current user's profile.
     */
    @PutMapping({"/me", "/profile"})
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            Authentication authentication,
            @RequestBody UpdateUserProfileRequest request) {
        UserProfileDto updated = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * POST /api/v1/users/me/avatar — Upload current user's avatar.
     */
    @PostMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateAvatar(
            Authentication authentication,
            @RequestParam("avatar") MultipartFile avatar) {
        UserProfileDto updated = userService.updateAvatar(authentication.getName(), avatar);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * PUT /api/v1/users/password — Change password.
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(
                authentication.getName(),
                request.getCurrentPassword(),
                request.getNewPassword(),
                request.getConfirmPassword()
        );
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }
}
