package com.pcparts.module.buildpc.repository;

import com.pcparts.module.buildpc.entity.PcBuild;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PcBuild entity.
 */
public interface PcBuildRepository extends JpaRepository<PcBuild, Long> {

    /**
     * Finds all builds for a registered user.
     */
    List<PcBuild> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Finds builds for a guest session.
     */
    List<PcBuild> findBySessionIdOrderByCreatedAtDesc(String sessionId);

    /**
     * Finds a specific build owned by a user.
     */
    Optional<PcBuild> findByIdAndUserId(Long id, Long userId);

    /**
     * Finds a specific build by session.
     */
    Optional<PcBuild> findByIdAndSessionId(Long id, String sessionId);
}
