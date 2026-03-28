package com.pcparts.security;

import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.entity.Permission;
import com.pcparts.module.auth.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Custom UserDetailsService that loads user from database.
 * Uses account ID (as String) as the principal name so controllers
 * can parse it with Long.parseLong(auth.getName()).
 *
 * Loads BOTH:
 * - Role authority: ROLE_ADMIN, ROLE_SALES, etc.
 * - Permission authorities: product.create, order.update, etc.
 * This enables granular permission-based RBAC via @PreAuthorize.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AccountRepository accountRepository;

    /**
     * Loads user by email for Spring Security authentication.
     * Returns account ID as the username so that auth.getName()
     * returns a numeric ID compatible with controller parsing.
     *
     * @param email the email to look up
     * @return UserDetails with account ID as username
     * @throws UsernameNotFoundException if account not found
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() ->
                    new UsernameNotFoundException("Không tìm thấy tài khoản với email: " + email));

        return buildUserDetails(account);
    }

    /**
     * Loads user by account ID (used by JWT filter after token validation).
     *
     * @param accountId the account ID as string
     * @return UserDetails with account ID as username
     * @throws UsernameNotFoundException if account not found
     */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(String accountId) throws UsernameNotFoundException {
        Account account = accountRepository.findById(Long.parseLong(accountId))
                .orElseThrow(() ->
                    new UsernameNotFoundException("Không tìm thấy tài khoản với ID: " + accountId));

        return buildUserDetails(account);
    }

    /**
     * Builds UserDetails with role + permission authorities.
     *
     * @param account the account entity
     * @return UserDetails with all authorities
     */
    private UserDetails buildUserDetails(Account account) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        // Add role authority (e.g. ROLE_ADMIN)
        authorities.add(new SimpleGrantedAuthority("ROLE_" + account.getRole().getName().toUpperCase()));

        // Add permission authorities from role_permission join table
        for (Permission perm : account.getRole().getPermissions()) {
            authorities.add(new SimpleGrantedAuthority(perm.getCode()));
        }

        return new User(
                account.getId().toString(),
                account.getPasswordHash(),
                account.getIsActive(),
                true, true, true,
                authorities
        );
    }
}
