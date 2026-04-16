package com.pcparts.module.auth.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.dto.UserProfileDto;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Permission;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.TokenRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private static final Pattern STRONG_PASSWORD_PATTERN =
            Pattern.compile(PASSWORD_REGEX);

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Gets current user's profile.
     */
    @Transactional(readOnly = true)
    public UserProfileDto getProfile(String email) {
        Account account = getAccountByEmail(email);
        UserProfile profile = getProfileByAccountId(account.getId());
        return toDto(account, profile);
    }

    /**
     * Updates current user's profile.
     */
    @Transactional
    public UserProfileDto updateProfile(String email, UserProfileDto dto) {
        Account account = getAccountByEmail(email);
        UserProfile profile = getProfileByAccountId(account.getId());

        if (dto.getFullName() != null) {
            profile.setFullName(dto.getFullName());
        }
        if (dto.getDateOfBirth() != null) {
            profile.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getGender() != null) {
            profile.setGender(dto.getGender());
        }
        if (dto.getAvatarUrl() != null) {
            profile.setAvatarUrl(dto.getAvatarUrl());
        }

        userProfileRepository.save(profile);
        return toDto(account, profile);
    }

    /**
     * Changes user's password.
     */
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword, String confirmPassword) {
        Account account = getAccountByEmail(email);

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

    private Account getAccountByEmail(String email) {
        return accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "email", email));
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
