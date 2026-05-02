package com.pcparts.security;

import com.pcparts.module.auth.repository.TokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * JWT authentication filter that intercepts requests
 * and validates Bearer tokens.
 * After validation, loads user by account ID (not email).
 *
 * Uses an in-memory cache (30s TTL) for token DB lookups
 * to avoid hitting the database on every authenticated request.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final TokenRepository tokenRepository;

    /** Cache: token hash → expiry timestamp (epoch ms). Valid tokens cached for 30 seconds. */
    private static final long TOKEN_CACHE_TTL_MS = 30_000;
    private final ConcurrentHashMap<String, Long> validTokenCache = new ConcurrentHashMap<>();

    /**
     * Filters each request to extract and validate JWT token.
     * Sets SecurityContext with authenticated principal if valid.
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = getTokenFromRequest(request);

        if (StringUtils.hasText(token)
                && jwtTokenProvider.validateToken(token)
                && isTokenActiveInDb(token)) {
            String accountId = jwtTokenProvider.getAccountIdFromToken(token);
            UserDetails userDetails = customUserDetailsService.loadUserById(accountId);

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Checks whether the token exists in the DB as a valid ACCESS token.
     * Results are cached in-memory for 30 seconds to avoid per-request DB queries.
     */
    private boolean isTokenActiveInDb(String token) {
        Long cachedExpiry = validTokenCache.get(token);
        if (cachedExpiry != null && cachedExpiry > System.currentTimeMillis()) {
            return true;
        }
        // Cache miss or expired — check DB
        boolean exists = tokenRepository.existsByTokenValueAndTokenType(token, "ACCESS");
        if (exists) {
            validTokenCache.put(token, System.currentTimeMillis() + TOKEN_CACHE_TTL_MS);
        } else {
            validTokenCache.remove(token);
        }
        return exists;
    }

    /**
     * Extracts Bearer token from Authorization header.
     *
     * @param request the HTTP request
     * @return token string or null
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
