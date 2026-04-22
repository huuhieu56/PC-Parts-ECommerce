package com.pcparts.module.auth;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.dto.UserProfileDto;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Role;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.TokenRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.auth.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private TokenRepository tokenRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private Account testAccount;
    private UserProfile testProfile;

    @BeforeEach
    void setUp() {
        testAccount = Account.builder().id(1L).email("test@test.com").passwordHash("hashed_pwd")
                .role(Role.builder().id(4L).name("CUSTOMER").build()).isActive(true).build();
        testProfile = UserProfile.builder().id(1L).account(testAccount).fullName("Nguyễn Văn A")
                .phone("0901234567").gender("MALE").build();
    }

    // === GET PROFILE ===
    @Test
    @DisplayName("Get profile — success")
    void getProfile_success() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));

        UserProfileDto result = userService.getProfile("1");

        assertThat(result.getFullName()).isEqualTo("Nguyễn Văn A");
        assertThat(result.getEmail()).isEqualTo("test@test.com");
        assertThat(result.getRole()).isEqualTo("CUSTOMER");
    }

    @Test
    @DisplayName("Get profile — account not found throws")
    void getProfile_accountNotFound() {
        when(accountRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getProfile("999"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === UPDATE PROFILE ===
    @Test
    @DisplayName("Update profile — success with all fields")
    void updateProfile_success() {
        UserProfileDto dto = UserProfileDto.builder().fullName("Nguyễn Văn B")
                .dateOfBirth(LocalDate.of(1995, 5, 15)).gender("FEMALE").avatarUrl("https://cdn/new.jpg").build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(testProfile);

        userService.updateProfile("1", dto);

        assertThat(testProfile.getFullName()).isEqualTo("Nguyễn Văn B");
        assertThat(testProfile.getGender()).isEqualTo("FEMALE");
        verify(userProfileRepository).save(testProfile);
    }

    @Test
    @DisplayName("Update profile — partial update (null fields unchanged)")
    void updateProfile_partial() {
        UserProfileDto dto = UserProfileDto.builder().fullName("Partial Update").build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(testProfile);

        userService.updateProfile("1", dto);

        assertThat(testProfile.getFullName()).isEqualTo("Partial Update");
        assertThat(testProfile.getGender()).isEqualTo("MALE"); // unchanged
    }

    // === CHANGE PASSWORD ===
    @Test
    @DisplayName("Change password — success")
    void changePassword_success() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(passwordEncoder.matches("OldPass123", "hashed_pwd")).thenReturn(true);
        when(passwordEncoder.matches("NewPass456", "hashed_pwd")).thenReturn(false);
        when(passwordEncoder.encode("NewPass456")).thenReturn("new_hashed");
        when(accountRepository.save(any(Account.class))).thenReturn(testAccount);

        userService.changePassword("1", "OldPass123", "NewPass456", "NewPass456");

        assertThat(testAccount.getPasswordHash()).isEqualTo("new_hashed");
        verify(accountRepository).save(testAccount);
        verify(tokenRepository).deleteByAccountIdAndTokenType(1L, "REFRESH");
    }

    @Test
    @DisplayName("Change password — wrong current password throws")
    void changePassword_wrongCurrent() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(passwordEncoder.matches("Wrong", "hashed_pwd")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword("1", "Wrong", "NewPass456", "NewPass456"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không chính xác");

        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("Change password — confirm password mismatch throws")
    void changePassword_confirmMismatch() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(passwordEncoder.matches("OldPass123", "hashed_pwd")).thenReturn(true);

        assertThatThrownBy(() -> userService.changePassword("1", "OldPass123", "NewPass456", "AnotherPass456"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("xác nhận không khớp");

        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("Change password — new password same as current throws")
    void changePassword_sameAsCurrent() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(passwordEncoder.matches("OldPass123", "hashed_pwd")).thenReturn(true);

        assertThatThrownBy(() -> userService.changePassword("1", "OldPass123", "OldPass123", "OldPass123"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("phải khác mật khẩu cũ");

        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("Change password — weak new password throws")
    void changePassword_weakNewPassword() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(passwordEncoder.matches("OldPass123", "hashed_pwd")).thenReturn(true);
        when(passwordEncoder.matches("weakpass", "hashed_pwd")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword("1", "OldPass123", "weakpass", "weakpass"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ít nhất 8 ký tự");

        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    @DisplayName("Change password — account not found throws")
    void changePassword_accountNotFound() {
        when(accountRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.changePassword("999", "Any", "Any", "Any"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
