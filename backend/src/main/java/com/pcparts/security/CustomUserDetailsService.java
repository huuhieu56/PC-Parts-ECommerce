package com.pcparts.security;

import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Custom UserDetailsService that loads user from database.
 * Uses account ID (as String) as the principal name so controllers
 * can parse it with Long.parseLong(auth.getName()).
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

        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + account.getRole().getName().toUpperCase())
        );

        // Use account ID as username so auth.getName() returns numeric ID
        return new User(
                account.getId().toString(),
                account.getPasswordHash(),
                account.getIsActive(),
                true, true, true,
                authorities
        );
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

        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + account.getRole().getName().toUpperCase())
        );

        return new User(
                account.getId().toString(),
                account.getPasswordHash(),
                account.getIsActive(),
                true, true, true,
                authorities
        );
    }
}
