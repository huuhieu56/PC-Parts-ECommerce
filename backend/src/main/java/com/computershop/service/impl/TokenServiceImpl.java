package com.computershop.service.impl;

import com.computershop.entity.Token;
import com.computershop.entity.User;
import com.computershop.repository.TokenRepository;
import com.computershop.service.interfaces.TokenService;
import com.computershop.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TokenServiceImpl implements TokenService {

    private final TokenRepository tokenRepository;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    @Override
    public String generateToken(User user) {
        log.info("Tạo JWT token cho người dùng: {}", user.getUsername());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());

        String jwtToken = jwtUtils.generateToken(userDetails, user.getId());

        // Save token to database
        saveUserToken(user, jwtToken);

        log.info("JWT token đã được tạo và lưu cho người dùng: {}", user.getUsername());
        return jwtToken;
    }

    @Override
    public String generateRefreshToken(User user) {
        log.info("Tạo refresh token cho người dùng: {}", user.getUsername());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());

        String refreshToken = jwtUtils.generateRefreshToken(userDetails, user.getId());

        log.info("Refresh token đã được tạo cho người dùng: {}", user.getUsername());
        return refreshToken;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTokenValid(String token, User user) {
        log.debug("Xác thực JWT token cho người dùng: {}", user.getUsername());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());

        boolean isValid = jwtUtils.isTokenValid(token, userDetails);

        if (isValid) {
            isValid = !isTokenRevoked(token);
        }

        log.debug("Kết quả xác thực token cho người dùng {}: {}", user.getUsername(), isValid);
        return isValid;
    }

    @Override
    @Transactional(readOnly = true)
    public String extractUsername(String token) {
        log.debug("Trích username từ JWT token");
        return jwtUtils.extractUsername(token);
    }

    @Override
    public void saveUserToken(User user, String jwtToken) {
        log.info("Lưu JWT token vào cơ sở dữ liệu cho người dùng: {}", user.getUsername());

        LocalDateTime expirationDate = LocalDateTime.now().plusSeconds(jwtUtils.getJwtExpirationInSeconds());

        Token token = Token.builder()
                .user(user)
                .token(jwtToken)
                .tokenType("ACCESS_TOKEN")
                .expired(false)
                .revoked(false)
                .expirationDate(expirationDate)
                .build();

        tokenRepository.save(token);
        log.info("JWT token đã được lưu vào cơ sở dữ liệu cho người dùng: {}", user.getUsername());
    }

    @Override
    public void revokeAllUserTokens(User user) {
        log.info("Thu hồi tất cả token cho người dùng: {}", user.getUsername());
        List<Token> validUserTokens = getValidUserTokens(user);
        validUserTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(validUserTokens);
        log.info("Đã thu hồi tất cả token cho người dùng: {}", user.getUsername());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Token> getValidUserTokens(User user) {
        return tokenRepository.findAllValidTokensByUser(user);
    }

    @Override
    public String refreshToken(String refreshToken) {
        log.info("Làm mới JWT token");

        try {
            String username = jwtUtils.extractUsername(refreshToken);

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtils.isTokenValid(refreshToken, userDetails)) {

                Long userId = jwtUtils.extractUserId(refreshToken);
                String newAccessToken = jwtUtils.generateToken(userDetails, userId);
                log.info("Đã tạo access token mới cho người dùng: {}", username);
                return newAccessToken;
            } else {
                log.warn("Refresh token không hợp lệ được cung cấp");
                throw new RuntimeException("Refresh token không hợp lệ");
            }
        } catch (Exception e) {
            log.error("Lỗi khi làm mới token: {}", e.getMessage());
            throw new RuntimeException("Làm mới token thất bại", e);
        }
    }

    @Override
    public void logout(String token) {
        log.info("Đăng xuất - thu hồi token");
        tokenRepository.findByToken(token).ifPresent(storedToken -> {
            storedToken.setExpired(true);
            storedToken.setRevoked(true);
            tokenRepository.save(storedToken);
            log.info("Token đã được thu hồi thành công");
        });
    }

    @Override
    public void cleanupExpiredTokens() {
        log.info("Dọn các token đã hết hạn");
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("Đã dọn xong các token hết hạn");
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTokenExpired(String token) {
        log.debug("Kiểm tra token đã hết hạn bằng JwtUtils");
        return jwtUtils.isTokenExpired(token);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTokenRevoked(String token) {
        return tokenRepository.findByToken(token)
                .map(Token::getRevoked)
                .orElse(true);
    }
}
