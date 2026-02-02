package com.computershop.controller;

import com.computershop.dto.request.*;
import com.computershop.dto.response.ApiResponse;
import com.computershop.dto.response.AuthResponse;
import com.computershop.dto.response.PagedResponse;
import com.computershop.dto.response.UserResponse;
import com.computershop.service.interfaces.TokenService;
import com.computershop.service.interfaces.UserService;
import com.computershop.util.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final TokenService tokenService;
    private final JwtUtils jwtUtils;

    // ==================== JWT AUTHENTICATION ENDPOINTS ====================

    // Đăng nhập người dùng
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = userService.login(request);
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Đăng nhập thành công")
                .data(authResponse)
                .build());
    }

    // Đăng ký người dùng mới
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse authResponse = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<AuthResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Đăng ký thành công")
                        .data(authResponse)
                        .build());
    }

    // Refresh JWT token
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<Map<String, String>>> refreshToken(
            @RequestParam String refreshToken) {
        String newAccessToken = tokenService.refreshToken(refreshToken);
        Map<String, String> response = Map.of(
                "access_token", newAccessToken,
                "token_type", "Bearer"
        );
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Refresh token thành công")
                .data(response)
                .build());
    }

    // Đăng xuất người dùng
    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            tokenService.logout(token);
        }
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Đăng xuất thành công")
                .build());
    }

    // ==================== USER PROFILE ENDPOINTS ====================

    // Lấy thông tin profile của user hiện tại
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUserProfile(Authentication authentication) {
        String username = authentication.getName();
        UserResponse userProfile = userService.getCurrentUserProfile(username);
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy thông tin profile thành công")
                .data(userProfile)
                .build());
    }

    // Cập nhật thông tin profile của user hiện tại
    // ( Cần sửa không được update password, chỉ update thông tin cá nhân )
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUserProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        UserResponse updatedProfile = userService.updateCurrentUserProfile(username, request);
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật profile thành công")
                .data(updatedProfile)
                .build());
    }

    // Đổi mật khẩu cho user hiện tại
    // Yêu cầu: header Authorization: Bearer <token>
    @PutMapping("/profile/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {

        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.<Void>builder()
                            .statusCode(HttpStatus.UNAUTHORIZED.value())
                            .message("Yêu cầu xác thực Bearer token")
                            .build());
        }

        String token = authHeader.substring(7);
        Long userId = jwtUtils.extractUserId(token);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.<Void>builder()
                            .statusCode(HttpStatus.UNAUTHORIZED.value())
                            .message("Không thể lấy user_id từ token")
                            .build());
        }

        try {
            userService.changePassword(userId, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .statusCode(HttpStatus.OK.value())
                    .message("Đổi mật khẩu thành công")
                    .build());
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Void>builder()
                            .statusCode(HttpStatus.BAD_REQUEST.value())
                            .message(ex.getMessage())
                            .build());
        }
    }

    // ==================== USER MANAGEMENT ENDPOINTS ====================

    // Tạo user mới (chỉ dành cho Admin)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody UserRequest request) {
        UserResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<UserResponse>builder()
                        .statusCode(HttpStatus.CREATED.value())
                        .message("Tạo người dùng mới thành công")
                        .data(user)
                        .build());
    }

    // Lấy tất cả người dùng với phân trang
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getAllUsers(
            @RequestParam(name = "search", required = false) String search,
            Pageable pageable) {
        Page<UserResponse> users = userService.getAllUsers(pageable, search);
        PagedResponse<UserResponse> paged = PagedResponse.fromPage(users);
        return ResponseEntity.ok(ApiResponse.<PagedResponse<UserResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách người dùng thành công")
                .data(paged)
                .build());
    }

    // Lấy chi tiết người dùng theo ID
    @PreAuthorize("hasRole('ADMIN') or #id == @jwtUtils.getCurrentUserId()")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy thông tin người dùng thành công")
                .data(user)
                .build());
    }

    // Cập nhật thông tin người dùng
    // Không thể cập nhật ngoại trừ: role
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRequest request) {
        UserResponse user = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Cập nhật thông tin người dùng thành công")
                .data(user)
                .build());
    }

    // Xóa người dùng (soft delete)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Xóa người dùng thành công")
                .build());
    }

    // ==================== USER UTILITIES ENDPOINTS ====================

    // Lookup user bằng username
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/username/{username}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByUsername(@PathVariable String username) {
        UserResponse user = userService.getUserByUsername(username);
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy thông tin người dùng theo username thành công")
                .data(user)
                .build());
    }

    // Lấy users theo role
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/role/{role}")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByRole(@PathVariable String role) {
        List<UserResponse> users = userService.getUsersByRole(role);
        return ResponseEntity.ok(ApiResponse.<List<UserResponse>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Lấy danh sách người dùng theo quyền thành công")
                .data(users)
                .build());
    }

    // Kiểm tra username đã tồn tại
    @GetMapping("/check/username/{username}")
    public ResponseEntity<ApiResponse<Boolean>> checkUsernameExists(@PathVariable String username) {
        boolean exists = userService.existsByUsername(username);
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Kiểm tra username thành công")
                .data(exists)
                .build());
    }

    // Kiểm tra email đã tồn tại
    @GetMapping("/check/email/{email}")
    public ResponseEntity<ApiResponse<Boolean>> checkEmailExists(@PathVariable String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Kiểm tra email thành công")
                .data(exists)
                .build());
    }
}
