package com.pcparts.module.auth.repository;

import com.pcparts.module.auth.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for UserProfile entity.
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    /**
     * Finds a user profile by account ID.
     */
    Optional<UserProfile> findByAccountId(Long accountId);

    /**
     * Checks if a user profile exists with the given phone number.
     */
    boolean existsByPhone(String phone);

    /**
     * Checks whether another user profile already uses the given phone number.
     */
    boolean existsByPhoneAndIdNot(String phone, Long id);
}
