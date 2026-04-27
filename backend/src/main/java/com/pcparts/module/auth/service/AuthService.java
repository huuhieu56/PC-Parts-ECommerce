package com.pcparts.module.auth.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.dto.*;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Permission;
import com.pcparts.module.auth.entity.Role;
import com.pcparts.module.auth.entity.Token;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.RoleRepository;
import com.pcparts.module.auth.repository.TokenRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.security.JwtTokenProvider;
import com.pcparts.security.LoginRateLimiter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service handling authentication: register, login, logout, refresh token.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String TOKEN_TYPE_ACCESS = "ACCESS";
    private static final String TOKEN_TYPE_REFRESH = "REFRESH";
    private static final String TOKEN_TYPE_RESET_PASSWORD = "RESET_PASSWORD";
    private static final String FORGOT_PASSWORD_MESSAGE =
            "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi";
    private static final String RESET_TOKEN_INVALID_MESSAGE =
            "Liên kết đã hết hạn. Vui lòng yêu cầu lại";

    private final LoginRateLimiter loginRateLimiter;

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final PasswordResetEmailService passwordResetEmailService;

    @Value("${jwt.access-expiration:900000}")
    private long accessTokenExpirationMs;

    /**
     * Registers a new customer account.
     * Flow: validate → check duplicate → hash password → create Account + UserProfile.
     * Note: Does NOT auto-login. User must login separately after registration.
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // Check duplicate email
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email đã được sử dụng", HttpStatus.CONFLICT);
        }

        // Check duplicate phone
        if (userProfileRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("Số điện thoại đã được sử dụng", HttpStatus.CONFLICT);
        }

        // Get CUSTOMER role
        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "CUSTOMER"));

        // Create Account
        Account account = Account.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(customerRole)
                .isActive(true)
                .isVerified(false)
                .build();
        account = accountRepository.save(account);

        // Create UserProfile
        UserProfile userProfile = UserProfile.builder()
                .account(account)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .build();
        userProfileRepository.save(userProfile);

        // Return basic user info only (no tokens - user must login separately)
        return RegisterResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .fullName(userProfile.getFullName())
                .build();
    }

    /**
     * Authenticates a user and returns JWT tokens.
     * Flow: validate → authenticate → generate tokens → (cart merge done by CartService).
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // SEC-07: Check rate limit before authentication
        if (loginRateLimiter.isBlocked(request.getEmail())) {
            long remaining = loginRateLimiter.getRemainingLockSeconds(request.getEmail());
            throw new BusinessException(
                    "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau " + remaining + " giây.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }

        // Authenticate via Spring Security
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            loginRateLimiter.recordFailedAttempt(request.getEmail());
            throw e;
        }

        // Fetch account
        Account account = accountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Account", "email", request.getEmail()));

        if (!account.getIsActive()) {
            throw new BusinessException("Tài khoản đã bị khóa", HttpStatus.FORBIDDEN);
        }

        // SEC-07: Reset rate limit on successful login
        loginRateLimiter.resetAttempts(request.getEmail());

        // Update last login
        account.setLastLoginAt(LocalDateTime.now());
        accountRepository.save(account);

        // Get user profile
        UserProfile userProfile = userProfileRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", account.getId()));

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(account.getId().toString());
        String refreshToken = jwtTokenProvider.generateRefreshToken(account.getId().toString());

        // Delete old session tokens and save the new token pair.
        tokenRepository.deleteByAccountIdAndTokenType(account.getId(), TOKEN_TYPE_ACCESS);
        tokenRepository.deleteByAccountIdAndTokenType(account.getId(), TOKEN_TYPE_REFRESH);
        saveToken(account, TOKEN_TYPE_ACCESS, accessToken, accessTokenExpiresAt());
        saveRefreshToken(account, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(toUserProfileDto(account, userProfile))
                .build();
    }

    /**
     * Refreshes the access token using a valid refresh token.
     */
    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {
        // Validate refresh token
        if (!jwtTokenProvider.validateToken(refreshTokenValue)) {
            throw new BusinessException("Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED);
        }

        // Find token in DB
        Token storedToken = tokenRepository.findByTokenValueAndTokenType(refreshTokenValue, TOKEN_TYPE_REFRESH)
                .orElseThrow(() -> new BusinessException("Refresh token không tồn tại", HttpStatus.UNAUTHORIZED));

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Refresh token đã hết hạn", HttpStatus.UNAUTHORIZED);
        }

        Account account = storedToken.getAccount();
        String accountId = account.getId().toString();

        // Generate new tokens (rotation: old refresh token is invalidated)
        String newAccessToken = jwtTokenProvider.generateAccessToken(accountId);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(accountId);

        // Delete old session tokens and save the rotated token pair.
        tokenRepository.deleteByAccountIdAndTokenType(account.getId(), TOKEN_TYPE_ACCESS);
        tokenRepository.deleteByAccountIdAndTokenType(account.getId(), TOKEN_TYPE_REFRESH);
        saveToken(account, TOKEN_TYPE_ACCESS, newAccessToken, accessTokenExpiresAt());
        saveRefreshToken(account, newRefreshToken);

        UserProfile userProfile = userProfileRepository.findByAccountId(account.getId())
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", account.getId()));

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(toUserProfileDto(account, userProfile))
                .build();
    }

    /**
     * Logs out by deleting all refresh tokens for the account.
     *
     * @param accountId the account ID (from auth.getName())
     */
    @Transactional
    public void logout(String accountId) {
        Long id = Long.parseLong(accountId);
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
        tokenRepository.deleteByAccountId(account.getId());
    }

    /**
     * Requests a reset password link while always returning a neutral message.
     */
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        accountRepository.findByEmail(request.getEmail())
                .filter(account -> Boolean.TRUE.equals(account.getIsActive()))
                .ifPresent(account -> {
                    String resetToken = UUID.randomUUID().toString();
                    tokenRepository.deleteByAccountIdAndTokenType(account.getId(), TOKEN_TYPE_RESET_PASSWORD);
                    saveToken(account, TOKEN_TYPE_RESET_PASSWORD, resetToken, LocalDateTime.now().plusMinutes(30));
                    passwordResetEmailService.sendResetPasswordEmail(account.getEmail(), resetToken);
                });

        return FORGOT_PASSWORD_MESSAGE;
    }

    /**
     * Sets a new password with a valid reset token and revokes all old sessions.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("Mật khẩu xác nhận không khớp", HttpStatus.BAD_REQUEST);
        }

        Token resetToken = tokenRepository
                .findByTokenValueAndTokenType(request.getToken(), TOKEN_TYPE_RESET_PASSWORD)
                .orElseThrow(() -> new BusinessException(RESET_TOKEN_INVALID_MESSAGE, HttpStatus.BAD_REQUEST));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(RESET_TOKEN_INVALID_MESSAGE, HttpStatus.BAD_REQUEST);
        }

        Account account = resetToken.getAccount();
        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);
        tokenRepository.deleteByAccountId(account.getId());
    }

    /**
     * Saves a refresh token to the database.
     */
    private void saveRefreshToken(Account account, String refreshTokenValue) {
        saveToken(account, TOKEN_TYPE_REFRESH, refreshTokenValue, LocalDateTime.now().plusDays(30));
    }

    /**
     * Saves a typed token to the database.
     */
    private void saveToken(Account account, String tokenType, String tokenValue, LocalDateTime expiresAt) {
        Token token = Token.builder()
                .account(account)
                .tokenType(tokenType)
                .tokenValue(tokenValue)
                .expiresAt(expiresAt)
                .build();
        tokenRepository.save(token);
    }

    private LocalDateTime accessTokenExpiresAt() {
        return LocalDateTime.now().plusNanos(accessTokenExpirationMs * 1_000_000);
    }

    /**
     * Maps Account + UserProfile to DTO.
     */
    private UserProfileDto toUserProfileDto(Account account, UserProfile profile) {
        Set<String> permissionCodes = account.getRole().getPermissions()
                .stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        return UserProfileDto.builder()
                .id(profile.getId())
                .email(account.getEmail())
                .fullName(profile.getFullName())
                .phone(profile.getPhone())
                .avatarUrl(profile.getAvatarUrl())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .role(account.getRole().getName())
                .permissions(permissionCodes)
                .build();
    }
}
