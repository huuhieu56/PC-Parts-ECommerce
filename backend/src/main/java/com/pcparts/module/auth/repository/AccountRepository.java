package com.pcparts.module.auth.repository;

import com.pcparts.module.auth.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Account entity.
 */
@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    /**
     * Finds an account by email.
     */
    Optional<Account> findByEmail(String email);

    /**
     * Checks if an account exists with the given email.
     */
    boolean existsByEmail(String email);
}
