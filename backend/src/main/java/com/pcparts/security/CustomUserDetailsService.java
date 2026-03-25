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
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AccountRepository accountRepository;

    /**
     * Loads user by email for Spring Security authentication.
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

        return new User(
                account.getEmail(),
                account.getPasswordHash(),
                account.getIsActive(),
                true, true, true,
                authorities
        );
    }
}
