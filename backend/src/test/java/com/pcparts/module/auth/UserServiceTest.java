package com.pcparts.module.auth;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.dto.UpdateUserProfileRequest;
import com.pcparts.module.auth.dto.UserProfileDto;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Role;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.TokenRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.auth.service.UserService;
import com.pcparts.module.product.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
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
    @Mock private FileService fileService;

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
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .fullName(" Nguyễn Văn B ")
                .phone("0907654321")
                .dateOfBirth(LocalDate.of(1995, 5, 15))
                .gender("female")
                .build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));
        when(userProfileRepository.existsByPhoneAndIdNot("0907654321", 1L)).thenReturn(false);
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(testProfile);

        UserProfileDto result = userService.updateProfile("1", request);

        assertThat(testProfile.getFullName()).isEqualTo("Nguyễn Văn B");
        assertThat(testProfile.getGender()).isEqualTo("FEMALE");
        assertThat(testProfile.getPhone()).isEqualTo("0907654321");
        assertThat(result.getPhone()).isEqualTo("0907654321");
        verify(userProfileRepository).save(testProfile);
    }

    @Test
    @DisplayName("Update profile — invalid phone throws")
    void updateProfile_invalidPhone() {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .fullName("Nguyễn Văn B")
                .phone("123")
                .gender("MALE")
                .build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));

        assertThatThrownBy(() -> userService.updateProfile("1", request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("SĐT không hợp lệ");

        verify(userProfileRepository, never()).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Update profile — duplicate phone throws conflict")
    void updateProfile_duplicatePhone() {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .fullName("Nguyễn Văn B")
                .phone("0907654321")
                .gender("MALE")
                .build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));
        when(userProfileRepository.existsByPhoneAndIdNot("0907654321", 1L)).thenReturn(true);

        assertThatThrownBy(() -> userService.updateProfile("1", request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("SĐT đã được sử dụng")
                .extracting("httpStatus")
                .isEqualTo(HttpStatus.CONFLICT);

        verify(userProfileRepository, never()).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Update profile — future date of birth throws")
    void updateProfile_futureDateOfBirth() {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .fullName("Nguyễn Văn B")
                .phone("0907654321")
                .dateOfBirth(LocalDate.now().plusDays(1))
                .gender("MALE")
                .build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));
        when(userProfileRepository.existsByPhoneAndIdNot("0907654321", 1L)).thenReturn(false);

        assertThatThrownBy(() -> userService.updateProfile("1", request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ngày sinh không được là ngày tương lai");

        verify(userProfileRepository, never()).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Update profile — invalid gender throws")
    void updateProfile_invalidGender() {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .fullName("Nguyễn Văn B")
                .phone("0907654321")
                .gender("UNKNOWN")
                .build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));
        when(userProfileRepository.existsByPhoneAndIdNot("0907654321", 1L)).thenReturn(false);

        assertThatThrownBy(() -> userService.updateProfile("1", request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Giới tính không hợp lệ");

        verify(userProfileRepository, never()).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Update profile — invalid full name throws")
    void updateProfile_invalidFullName() {
        UpdateUserProfileRequest request = UpdateUserProfileRequest.builder()
                .fullName("A")
                .phone("0907654321")
                .gender("MALE")
                .build();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));

        assertThatThrownBy(() -> userService.updateProfile("1", request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Họ tên phải có độ dài 2-100 ký tự");

        verify(userProfileRepository, never()).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("Update avatar — success")
    void updateAvatar_success() {
        MockMultipartFile avatar = new MockMultipartFile("avatar", "avatar.webp", "image/webp", "image".getBytes());
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));
        when(fileService.uploadFile(avatar, "avatars")).thenReturn("http://localhost:9000/pcparts/avatars/avatar.webp");
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(testProfile);

        UserProfileDto result = userService.updateAvatar("1", avatar);

        assertThat(result.getAvatarUrl()).isEqualTo("http://localhost:9000/pcparts/avatars/avatar.webp");
        verify(fileService).uploadFile(avatar, "avatars");
        verify(userProfileRepository).save(testProfile);
    }

    @Test
    @DisplayName("Update avatar — uploaded file is deleted when profile save fails")
    void updateAvatar_saveFailsDeletesUploadedFile() {
        MockMultipartFile avatar = new MockMultipartFile("avatar", "avatar.webp", "image/webp", "image".getBytes());
        String uploadedUrl = "http://localhost:9000/pcparts/avatars/avatar.webp";
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));
        when(fileService.uploadFile(avatar, "avatars")).thenReturn(uploadedUrl);
        when(userProfileRepository.save(testProfile)).thenThrow(new RuntimeException("DB unavailable"));

        assertThatThrownBy(() -> userService.updateAvatar("1", avatar))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("DB unavailable");

        verify(fileService).deleteFile(uploadedUrl);
    }

    @Test
    @DisplayName("Update avatar — invalid content type throws")
    void updateAvatar_invalidType() {
        MockMultipartFile avatar = new MockMultipartFile("avatar", "avatar.pdf", "application/pdf", "pdf".getBytes());
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));

        assertThatThrownBy(() -> userService.updateAvatar("1", avatar))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Chỉ chấp nhận ảnh JPG, PNG, WEBP");

        verify(fileService, never()).uploadFile(any(), any());
    }

    @Test
    @DisplayName("Update avatar — file larger than 2MB throws")
    void updateAvatar_tooLarge() {
        MockMultipartFile avatar = new MockMultipartFile(
                "avatar",
                "avatar.png",
                "image/png",
                new byte[(2 * 1024 * 1024) + 1]
        );
        when(accountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(userProfileRepository.findByAccountId(1L)).thenReturn(Optional.of(testProfile));

        assertThatThrownBy(() -> userService.updateAvatar("1", avatar))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ảnh đại diện tối đa 2MB");

        verify(fileService, never()).uploadFile(any(), any());
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
