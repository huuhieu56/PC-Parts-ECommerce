package com.pcparts.module.auth.repository;

import com.pcparts.module.auth.entity.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Token entity.
 */
@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {

    /**
     * Finds a token by value and type.
     */
    Optional<Token> findByTokenValueAndTokenType(String tokenValue, String tokenType);

    /**
     * Checks whether a token value is still valid for a given type.
     */
    boolean existsByTokenValueAndTokenType(String tokenValue, String tokenType);

    /**
     * Deletes all tokens for an account with a given type.
     */
    @Modifying
    @Query("DELETE FROM Token t WHERE t.account.id = :accountId AND t.tokenType = :tokenType")
    void deleteByAccountIdAndTokenType(Long accountId, String tokenType);

    /**
     * Deletes all refresh tokens for an account.
     */
    @Modifying
    void deleteByAccountId(Long accountId);
}
