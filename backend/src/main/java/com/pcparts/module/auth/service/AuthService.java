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
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service handling authentication: register, login, logout, refresh token.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final LoginRateLimiter loginRateLimiter;

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    /**
     * Registers a new customer account.
     * Flow: validate → check duplicate → hash password → create Account + UserProfile.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
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

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(account.getId().toString());
        String refreshToken = jwtTokenProvider.generateRefreshToken(account.getId().toString());

        // Save refresh token
        saveRefreshToken(account, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(toUserProfileDto(account, userProfile))
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

        // Delete old refresh tokens and save new one
        tokenRepository.deleteByAccountIdAndTokenType(account.getId(), "REFRESH");
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
        Token storedToken = tokenRepository.findByTokenValueAndTokenType(refreshTokenValue, "REFRESH")
                .orElseThrow(() -> new BusinessException("Refresh token không tồn tại", HttpStatus.UNAUTHORIZED));

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Refresh token đã hết hạn", HttpStatus.UNAUTHORIZED);
        }

        Account account = storedToken.getAccount();
        String accountId = account.getId().toString();

        // Generate new tokens (rotation: old refresh token is invalidated)
        String newAccessToken = jwtTokenProvider.generateAccessToken(accountId);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(accountId);

        // BUG-15 fix: Delete ALL old refresh tokens and save new one (prevent token leak)
        tokenRepository.deleteByAccountIdAndTokenType(account.getId(), "REFRESH");
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
     * Saves a refresh token to the database.
     */
    private void saveRefreshToken(Account account, String refreshTokenValue) {
        Token token = Token.builder()
                .account(account)
                .tokenType("REFRESH")
                .tokenValue(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
        tokenRepository.save(token);
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
