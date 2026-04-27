package com.pcparts.module.auth.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.auth.dto.AuthResponse;
import com.pcparts.module.auth.dto.ForgotPasswordRequest;
import com.pcparts.module.auth.dto.LoginRequest;
import com.pcparts.module.auth.dto.RegisterRequest;
import com.pcparts.module.auth.dto.RegisterResponse;
import com.pcparts.module.auth.dto.ResetPasswordRequest;
import com.pcparts.module.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for authentication endpoints.
 * Base path: /api/v1/auth
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/register — Register a new customer account.
     * Returns basic user info only. User must login separately after registration.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(response));
    }

    /**
     * POST /api/v1/auth/login — Login with email and password.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/auth/refresh-token — Refresh access token.
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/auth/logout — Logout and invalidate refresh token.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
        authService.logout(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    /**
     * POST /api/v1/auth/forgot-password — Request password reset link.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    /**
     * POST /api/v1/auth/reset-password — Set a new password by reset token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }
}
