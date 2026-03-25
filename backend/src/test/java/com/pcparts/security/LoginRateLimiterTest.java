package com.pcparts.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LoginRateLimiter.
 */
@ExtendWith(MockitoExtension.class)
class LoginRateLimiterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    @InjectMocks
    private LoginRateLimiter rateLimiter;

    private static final String TEST_EMAIL = "test@example.com";
    private static final String KEY = "login:attempts:test@example.com";

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void isBlocked_returnsFalse_whenNoAttempts() {
        when(valueOps.get(KEY)).thenReturn(null);
        assertThat(rateLimiter.isBlocked(TEST_EMAIL)).isFalse();
    }

    @Test
    void isBlocked_returnsFalse_whenBelowLimit() {
        when(valueOps.get(KEY)).thenReturn("3");
        assertThat(rateLimiter.isBlocked(TEST_EMAIL)).isFalse();
    }

    @Test
    void isBlocked_returnsTrue_whenAtLimit() {
        when(valueOps.get(KEY)).thenReturn("5");
        assertThat(rateLimiter.isBlocked(TEST_EMAIL)).isTrue();
    }

    @Test
    void isBlocked_returnsTrue_whenAboveLimit() {
        when(valueOps.get(KEY)).thenReturn("8");
        assertThat(rateLimiter.isBlocked(TEST_EMAIL)).isTrue();
    }

    @Test
    void recordFailedAttempt_incrementsAndSetsExpiry_onFirstAttempt() {
        when(valueOps.increment(KEY)).thenReturn(1L);

        rateLimiter.recordFailedAttempt(TEST_EMAIL);

        verify(valueOps).increment(KEY);
        verify(redisTemplate).expire(eq(KEY), any(Duration.class));
    }

    @Test
    void recordFailedAttempt_incrementsOnly_onSubsequentAttempts() {
        when(valueOps.increment(KEY)).thenReturn(3L);

        rateLimiter.recordFailedAttempt(TEST_EMAIL);

        verify(valueOps).increment(KEY);
        verify(redisTemplate, never()).expire(anyString(), any(Duration.class));
    }

    @Test
    void resetAttempts_deletesKey() {
        rateLimiter.resetAttempts(TEST_EMAIL);
        verify(redisTemplate).delete(KEY);
    }

    @Test
    void getRemainingLockSeconds_returnsTtl() {
        when(redisTemplate.getExpire(KEY)).thenReturn(420L);
        assertThat(rateLimiter.getRemainingLockSeconds(TEST_EMAIL)).isEqualTo(420L);
    }

    @Test
    void getRemainingLockSeconds_returnsZero_whenNoTtl() {
        when(redisTemplate.getExpire(KEY)).thenReturn(-1L);
        assertThat(rateLimiter.getRemainingLockSeconds(TEST_EMAIL)).isEqualTo(0L);
    }

    @Test
    void isBlocked_caseInsensitive() {
        when(valueOps.get("login:attempts:test@example.com")).thenReturn("5");
        assertThat(rateLimiter.isBlocked("TEST@EXAMPLE.COM")).isTrue();
    }
}
