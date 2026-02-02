package com.computershop.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtils {

    @Value("${app.jwt.secret:your_jwt_secret_key_here_change_in_production}")
    private String secretKey;

    @Value("${app.jwt.expiration:2592000000}") // 30 days in milliseconds
    private long jwtExpiration;

    @Value("${app.jwt.refresh-token.expiration:7776000000}") // 90 days in milliseconds
    private long refreshExpiration;

    // Extract username từ token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extract một claim cụ thể từ token
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Tạo access token với user_id claim
    public String generateToken(UserDetails userDetails, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        if (userId != null) {
            claims.put("user_id", userId);
        }
        return buildToken(claims, userDetails, jwtExpiration);
    }

    // Tạo refresh token với user_id claim
    public String generateRefreshToken(UserDetails userDetails, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        if (userId != null) {
            claims.put("user_id", userId);
        }
        return buildToken(claims, userDetails, refreshExpiration);
    }

    // Build token với expiration time
    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration) {
        return Jwts
                .builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey())
                .compact();
    }

    // Validate token với UserDetails
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    // Kiểm tra token có expired không
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Extract expiration date từ token
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Extract expiration date từ token
    private Claims extractAllClaims(String token) {
        return Jwts
                .parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Lấy signing key
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Lấy expiration time của token (tính bằng giây)
    public long getJwtExpirationInSeconds() {
        return jwtExpiration / 1000;
    }

    // Lấy refresh token expiration time (tính bằng giây)
    public long getRefreshExpirationInSeconds() {
        return refreshExpiration / 1000;
    }

    // Extract user id claim từ token
    public Long extractUserId(String token) {
        try {
            Object val = extractClaim(token, claims -> claims.get("user_id"));
            if (val == null)
                return null;
            return Long.valueOf(String.valueOf(val));
        } catch (Exception ex) {
            return null;
        }
    }

    // Lấy user id hiện tại từ SecurityContext nếu có JWT raw được lưu trong
    // Authentication.details
    public Long getCurrentUserId() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            if (auth == null)
                return null;
            Object details = auth.getDetails();
            if (details instanceof java.util.Map) {
                Object jwt = ((java.util.Map<?, ?>) details).get("jwt");
                if (jwt instanceof String) {
                    return extractUserId((String) jwt);
                }
            }
        } catch (Exception ex) {
            // ignore
        }
        return null;
    }
}
