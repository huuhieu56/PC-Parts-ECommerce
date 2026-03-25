package com.pcparts.module.auth.service;

import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.dto.UserProfileDto;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for user profile and password management.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final AccountRepository accountRepository;
    private final UserProfileRepository userProfileRepository;
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
    public void changePassword(String email, String currentPassword, String newPassword) {
        Account account = getAccountByEmail(email);

        if (!passwordEncoder.matches(currentPassword, account.getPasswordHash())) {
            throw new com.pcparts.common.exception.BusinessException("Mật khẩu hiện tại không chính xác");
        }

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
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
        return UserProfileDto.builder()
                .id(profile.getId())
                .email(account.getEmail())
                .fullName(profile.getFullName())
                .phone(profile.getPhone())
                .avatarUrl(profile.getAvatarUrl())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .role(account.getRole().getName())
                .build();
    }
}
