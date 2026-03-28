package com.pcparts.module.auth.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.common.dto.PageResponse;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Role;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.auth.repository.RoleRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin controller for managing user accounts.
 */
@RestController
@RequestMapping("/api/v1/admin/accounts")
@RequiredArgsConstructor
public class AdminAccountController {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;

    /**
     * Lists all accounts with pagination.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('system.admin')")
    public ResponseEntity<ApiResponse<PageResponse<AccountDto>>> listAccounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<Account> accounts = accountRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.success("Danh sách tài khoản",
                PageResponse.from(accounts, this::toDto)));
    }

    /**
     * Toggles account active status.
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('system.admin')")
    public ResponseEntity<ApiResponse<AccountDto>> toggleStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        account.setIsActive(request.getIsActive());
        accountRepository.save(account);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", toDto(account)));
    }

    /**
     * Updates account role.
     */
    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority('system.admin')")
    public ResponseEntity<ApiResponse<AccountDto>> updateRole(
            @PathVariable Long id,
            @RequestBody RoleRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        Role role = roleRepository.findByName(request.getRoleName())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRoleName()));
        account.setRole(role);
        accountRepository.save(account);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật role thành công", toDto(account)));
    }

    private AccountDto toDto(Account account) {
        String fullName = null;
        String phone = null;
        if (account.getUserProfile() != null) {
            fullName = account.getUserProfile().getFullName();
            phone = account.getUserProfile().getPhone();
        }
        return AccountDto.builder()
                .id(account.getId())
                .email(account.getEmail())
                .fullName(fullName)
                .phone(phone)
                .roleName(account.getRole() != null ? account.getRole().getName() : "CUSTOMER")
                .isActive(account.getIsActive() != null ? account.getIsActive() : true)
                .lastLoginAt(account.getLastLoginAt() != null ? account.getLastLoginAt().toString() : null)
                .createdAt(account.getCreatedAt() != null ? account.getCreatedAt().toString() : null)
                .build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AccountDto {
        private Long id;
        private String email;
        private String fullName;
        private String phone;
        private String roleName;
        private boolean isActive;
        private String lastLoginAt;
        private String createdAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class StatusRequest {
        private Boolean isActive;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RoleRequest {
        private String roleName;
    }
}
