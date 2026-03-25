package com.pcparts.module.auth;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.dto.LoginRequest;
import com.pcparts.module.auth.dto.AuthResponse;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Role;
import com.pcparts.module.auth.entity.Token;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.TokenRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.auth.service.AuthService;
import com.pcparts.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Extended tests for AuthService: login, refreshToken, logout.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceExtendedTest {

    @Mock private AccountRepository accountRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private TokenRepository tokenRepository;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    @Mock private com.pcparts.module.auth.repository.RoleRepository roleRepository;

    @InjectMocks
    private AuthService authService;

    private Account testAccount;
    private UserProfile testProfile;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        customerRole = Role.builder().id(4L).name("CUSTOMER").build();
        testAccount = Account.builder().id(1L).email("test@test.com").passwordHash("hashed")
                .role(customerRole).isActive(true).isVerified(true).build();
        testProfile = UserProfile.builder().id(1L).account(testAccount).fullName("Nguyễn Văn A")
                .phone("0901234567").build();
    }

    // === Login Tests ===
    @Test
    @DisplayName("Login — success with valid credentials")
    void login_success() {
        LoginRequest req = new LoginRequest("test@test.com", "Password123", null);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));
        when(jwtTokenProvider.generateAccessToken("test@test.com")).thenReturn("access_token");
        when(jwtTokenProvider.generateRefreshToken("test@test.com")).thenReturn("refresh_token");
        when(accountRepository.save(any(Account.class))).thenReturn(testAccount);
        when(tokenRepository.save(any(Token.class))).thenReturn(null);

        AuthResponse response = authService.login(req);

        assertThat(response.getAccessToken()).isEqualTo("access_token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh_token");
        assertThat(response.getUser().getEmail()).isEqualTo("test@test.com");
        verify(tokenRepository).deleteByAccountIdAndTokenType(1L, "REFRESH");
    }

    @Test
    @DisplayName("Login — bad credentials throws")
    void login_badCredentials() {
        LoginRequest req = new LoginRequest("test@test.com", "WrongPassword", null);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("Login — inactive account throws forbidden")
    void login_inactiveAccount() {
        testAccount.setIsActive(false);
        LoginRequest req = new LoginRequest("test@test.com", "Password123", null);
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("bị khóa");
    }

    @Test
    @DisplayName("Login — account not found throws")
    void login_accountNotFound() {
        LoginRequest req = new LoginRequest("notfound@test.com", "Password123", null);
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(accountRepository.findByEmail("notfound@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === Refresh Token Tests ===
    @Test
    @DisplayName("RefreshToken — success with valid token")
    void refreshToken_success() {
        Token storedToken = Token.builder().id(1L).account(testAccount).tokenType("REFRESH")
                .tokenValue("valid_refresh").expiresAt(LocalDateTime.now().plusDays(10)).build();
        when(jwtTokenProvider.validateToken("valid_refresh")).thenReturn(true);
        when(tokenRepository.findByTokenValueAndTokenType("valid_refresh", "REFRESH"))
                .thenReturn(Optional.of(storedToken));
        when(jwtTokenProvider.generateAccessToken("test@test.com")).thenReturn("new_access");
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));

        AuthResponse response = authService.refreshToken("valid_refresh");

        assertThat(response.getAccessToken()).isEqualTo("new_access");
        assertThat(response.getRefreshToken()).isEqualTo("valid_refresh");
    }

    @Test
    @DisplayName("RefreshToken — invalid JWT throws unauthorized")
    void refreshToken_invalidJwt() {
        when(jwtTokenProvider.validateToken("invalid")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshToken("invalid"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không hợp lệ");
    }

    @Test
    @DisplayName("RefreshToken — token not in DB throws unauthorized")
    void refreshToken_notInDb() {
        when(jwtTokenProvider.validateToken("orphan")).thenReturn(true);
        when(tokenRepository.findByTokenValueAndTokenType("orphan", "REFRESH")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refreshToken("orphan"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không tồn tại");
    }

    @Test
    @DisplayName("RefreshToken — expired token in DB throws unauthorized")
    void refreshToken_expiredInDb() {
        Token expired = Token.builder().id(1L).account(testAccount).tokenType("REFRESH")
                .tokenValue("expired").expiresAt(LocalDateTime.now().minusDays(1)).build();
        when(jwtTokenProvider.validateToken("expired")).thenReturn(true);
        when(tokenRepository.findByTokenValueAndTokenType("expired", "REFRESH")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> authService.refreshToken("expired"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("hết hạn");
    }

    // === Logout Tests ===
    @Test
    @DisplayName("Logout — success deletes all tokens")
    void logout_success() {
        when(accountRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testAccount));

        authService.logout("test@test.com");

        verify(tokenRepository).deleteByAccountId(1L);
    }

    @Test
    @DisplayName("Logout — account not found throws")
    void logout_accountNotFound() {
        when(accountRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.logout("ghost@test.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
