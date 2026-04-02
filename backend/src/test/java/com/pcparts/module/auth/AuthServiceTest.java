package com.pcparts.module.auth;

import com.pcparts.module.auth.dto.RegisterRequest;
import com.pcparts.module.auth.dto.RegisterResponse;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Role;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.RoleRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private TokenRepository tokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private Role customerRole;

    @BeforeEach
    void setUp() {
        customerRole = Role.builder().id(4L).name("CUSTOMER").build();
    }

    @Test
    @DisplayName("Register — success with valid input")
    void register_success() {
        // Given
        RegisterRequest request = new RegisterRequest("Nguyễn Văn A", "test@test.com", "0901234567", "Password123");

        when(accountRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(userProfileRepository.existsByPhone("0901234567")).thenReturn(false);
        when(roleRepository.findByName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> {
            Account a = inv.getArgument(0);
            a.setId(1L);
            return a;
        });
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(inv -> {
            UserProfile p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        // When
        RegisterResponse response = authService.register(request);

        // Then - RegisterResponse only contains id, email, fullName (no tokens per UC-CUS-04)
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo("test@test.com");
        assertThat(response.getFullName()).isEqualTo("Nguyễn Văn A");

        verify(accountRepository).save(any(Account.class));
        verify(userProfileRepository).save(any(UserProfile.class));
        // No token should be saved (user must login separately)
        verify(tokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("Register — should throw when email already exists")
    void register_duplicateEmail() {
        RegisterRequest request = new RegisterRequest("Test", "dup@test.com", "0901111111", "Password123");
        when(accountRepository.existsByEmail("dup@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(com.pcparts.common.exception.BusinessException.class)
                .hasMessageContaining("Email đã được sử dụng");
    }

    @Test
    @DisplayName("Register — should throw when phone already exists")
    void register_duplicatePhone() {
        RegisterRequest request = new RegisterRequest("Test", "new@test.com", "0901234567", "Password123");
        when(accountRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userProfileRepository.existsByPhone("0901234567")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(com.pcparts.common.exception.BusinessException.class)
                .hasMessageContaining("Số điện thoại đã được sử dụng");
    }
}
