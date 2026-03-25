package com.pcparts.module.buildpc.repository;

import com.pcparts.module.buildpc.entity.PcBuildComponent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PcBuildComponent entity.
 */
public interface PcBuildComponentRepository extends JpaRepository<PcBuildComponent, Long> {

    /**
     * Finds all components for a build.
     */
    List<PcBuildComponent> findByBuildId(Long buildId);

    /**
     * Finds a component in a specific slot of a build.
     */
    Optional<PcBuildComponent> findByBuildIdAndSlotType(Long buildId, String slotType);

    /**
     * Deletes all components for a build.
     */
    void deleteByBuildId(Long buildId);
}
