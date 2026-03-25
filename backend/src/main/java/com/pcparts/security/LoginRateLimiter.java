package com.pcparts.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * SEC-07: Redis-backed login rate limiter.
 * Blocks login attempts after exceeding the maximum allowed failures
 * within a configured time window.
 *
 * <p>Default: 5 failed attempts per 15-minute window per email address.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LoginRateLimiter {

    private final StringRedisTemplate redisTemplate;

    private static final String KEY_PREFIX = "login:attempts:";
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    /**
     * Checks whether the given email is currently rate-limited.
     *
     * @param email the user's email address
     * @return true if too many attempts have been made, false otherwise
     */
    public boolean isBlocked(String email) {
        String key = KEY_PREFIX + email.toLowerCase();
        String value = redisTemplate.opsForValue().get(key);
        if (value == null) return false;
        return Integer.parseInt(value) >= MAX_ATTEMPTS;
    }

    /**
     * Records a failed login attempt for the given email.
     * Sets a TTL on the first attempt to auto-expire the counter.
     *
     * @param email the user's email address
     */
    public void recordFailedAttempt(String email) {
        String key = KEY_PREFIX + email.toLowerCase();
        Long attempts = redisTemplate.opsForValue().increment(key);
        if (attempts != null && attempts == 1) {
            redisTemplate.expire(key, WINDOW);
        }
        log.warn("Failed login attempt {} for email: {}", attempts, email);
    }

    /**
     * Resets the counter on successful login.
     *
     * @param email the user's email address
     */
    public void resetAttempts(String email) {
        String key = KEY_PREFIX + email.toLowerCase();
        redisTemplate.delete(key);
    }

    /**
     * Returns the remaining seconds until the rate limit expires.
     *
     * @param email the user's email address
     * @return remaining seconds, or 0 if not rate-limited
     */
    public long getRemainingLockSeconds(String email) {
        String key = KEY_PREFIX + email.toLowerCase();
        Long ttl = redisTemplate.getExpire(key);
        return ttl != null && ttl > 0 ? ttl : 0;
    }
}
