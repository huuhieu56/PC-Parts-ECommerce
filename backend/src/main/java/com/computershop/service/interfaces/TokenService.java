package com.computershop.service.interfaces;

import com.computershop.entity.Token;
import com.computershop.entity.User;

import java.util.List;

public interface TokenService {

    String generateToken(User user);

    String generateRefreshToken(User user);

    boolean isTokenValid(String token, User user);

    String extractUsername(String token);

    void saveUserToken(User user, String jwtToken);

    void revokeAllUserTokens(User user);

    List<Token> getValidUserTokens(User user);

    String refreshToken(String refreshToken);

    void logout(String token);

    void cleanupExpiredTokens();

    boolean isTokenExpired(String token);

    boolean isTokenRevoked(String token);
}
