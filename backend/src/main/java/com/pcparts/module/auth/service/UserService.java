package com.pcparts.module.auth.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.dto.UpdateUserProfileRequest;
import com.pcparts.module.auth.dto.UserProfileDto;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Permission;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.TokenRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.product.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.pcparts.common.constant.ValidationConstants.PASSWORD_MESSAGE;
import static com.pcparts.common.constant.ValidationConstants.PASSWORD_REGEX;

/**
 * Service for user profile and password management.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private static final long MAX_AVATAR_BYTES = 2L * 1024L * 1024L;
    private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> ALLOWED_GENDERS = Set.of("MALE", "FEMALE", "OTHER");
    private static final Pattern VIETNAM_PHONE_PATTERN = Pattern.compile("^0\\d{9}$");
    private static final Pattern STRONG_PASSWORD_PATTERN =
            Pattern.compile(PASSWORD_REGEX);

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileService fileService;

    /**
     * Gets current user's profile.
     *
     * @param accountId the account ID from auth.getName()
     */
    @Transactional(readOnly = true)
    public UserProfileDto getProfile(String accountId) {
        Account account = getAccountById(accountId);
        UserProfile profile = getProfileByAccountId(account.getId());
        return toDto(account, profile);
    }

    /**
     * Updates current user's profile.
     *
     * @param accountId the account ID from auth.getName()
     */
    @Transactional
    public UserProfileDto updateProfile(String accountId, UpdateUserProfileRequest request) {
        Account account = getAccountById(accountId);
        UserProfile profile = getProfileByAccountId(account.getId());

        String fullName = validateFullName(request.getFullName());
        String phone = validatePhone(request.getPhone(), profile.getId());
        LocalDate dateOfBirth = validateDateOfBirth(request.getDateOfBirth());
        String gender = validateGender(request.getGender());

        profile.setFullName(fullName);
        profile.setPhone(phone);
        profile.setDateOfBirth(dateOfBirth);
        profile.setGender(gender);

        userProfileRepository.save(profile);
        return toDto(account, profile);
    }

    /**
     * Uploads and updates the current user's avatar.
     *
     * @param accountId the account ID from auth.getName()
     * @param avatar    the image file to upload
     * @return updated profile DTO
     */
    @Transactional
    public UserProfileDto updateAvatar(String accountId, MultipartFile avatar) {
        Account account = getAccountById(accountId);
        UserProfile profile = getProfileByAccountId(account.getId());

        validateAvatar(avatar);

        String avatarUrl = fileService.uploadFile(avatar, "avatars");
        registerAvatarRollbackCleanup(avatarUrl);
        try {
            profile.setAvatarUrl(avatarUrl);
            userProfileRepository.save(profile);
        } catch (RuntimeException ex) {
            if (!TransactionSynchronizationManager.isSynchronizationActive()) {
                fileService.deleteFileOrThrow(avatarUrl);
            }
            throw ex;
        }
        return toDto(account, profile);
    }

    /**
     * Changes user's password.
     *
     * @param accountId the account ID from auth.getName()
     */
    @Transactional
    public void changePassword(String accountId, String currentPassword, String newPassword, String confirmPassword) {
        Account account = getAccountById(accountId);

        if (!passwordEncoder.matches(currentPassword, account.getPasswordHash())) {
            throw new BusinessException("Mật khẩu hiện tại không chính xác");
        }

        if (newPassword == null || confirmPassword == null || !newPassword.equals(confirmPassword)) {
            throw new BusinessException("Mật khẩu xác nhận không khớp");
        }

        if (passwordEncoder.matches(newPassword, account.getPasswordHash())) {
            throw new BusinessException("Mật khẩu mới phải khác mật khẩu cũ");
        }

        if (!isStrongPassword(newPassword)) {
            throw new BusinessException(PASSWORD_MESSAGE);
        }

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
        tokenRepository.deleteByAccountIdAndTokenType(account.getId(), "REFRESH");
    }

    private boolean isStrongPassword(String password) {
        return password != null && STRONG_PASSWORD_PATTERN.matcher(password).matches();
    }

    private void registerAvatarRollbackCleanup(String avatarUrl) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    fileService.deleteFileOrThrow(avatarUrl);
                }
            }
        });
    }

    private String validateFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            throw new BusinessException("Họ tên là bắt buộc");
        }

        String normalized = fullName.trim();
        if (normalized.length() < 2 || normalized.length() > 100) {
            throw new BusinessException("Họ tên phải có độ dài 2-100 ký tự");
        }
        return normalized;
    }

    private String validatePhone(String phone, Long profileId) {
        if (phone == null || phone.isBlank()) {
            throw new BusinessException("SĐT là bắt buộc");
        }

        String normalized = phone.trim();
        if (!VIETNAM_PHONE_PATTERN.matcher(normalized).matches()) {
            throw new BusinessException("SĐT không hợp lệ");
        }

        if (userProfileRepository.existsByPhoneAndIdNot(normalized, profileId)) {
            throw new BusinessException("SĐT đã được sử dụng", HttpStatus.CONFLICT);
        }
        return normalized;
    }

    private LocalDate validateDateOfBirth(LocalDate dateOfBirth) {
        if (dateOfBirth != null && dateOfBirth.isAfter(LocalDate.now())) {
            throw new BusinessException("Ngày sinh không được là ngày tương lai");
        }
        return dateOfBirth;
    }

    private String validateGender(String gender) {
        if (gender == null || gender.isBlank()) {
            return null;
        }

        String normalized = gender.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_GENDERS.contains(normalized)) {
            throw new BusinessException("Giới tính không hợp lệ");
        }
        return normalized;
    }

    private void validateAvatar(MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            throw new BusinessException("Ảnh đại diện là bắt buộc");
        }
        if (!ALLOWED_AVATAR_TYPES.contains(avatar.getContentType())) {
            throw new BusinessException("Chỉ chấp nhận ảnh JPG, PNG, WEBP");
        }
        if (avatar.getSize() > MAX_AVATAR_BYTES) {
            throw new BusinessException("Ảnh đại diện tối đa 2MB");
        }
    }

    private Account getAccountById(String accountId) {
        Long id = Long.parseLong(accountId);
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
    }

    private UserProfile getProfileByAccountId(Long accountId) {
        return userProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", accountId));
    }

    private UserProfileDto toDto(Account account, UserProfile profile) {
        Set<String> permissionCodes = account.getRole().getPermissions()
                .stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        return UserProfileDto.builder()
                .id(profile.getId())
                .email(account.getEmail())
                .fullName(profile.getFullName())
                .phone(profile.getPhone())
                .avatarUrl(profile.getAvatarUrl())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .role(account.getRole().getName())
                .permissions(permissionCodes)
                .build();
    }
}
