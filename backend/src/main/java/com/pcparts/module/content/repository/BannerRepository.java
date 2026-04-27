package com.pcparts.module.content.repository;

import com.pcparts.module.content.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Banner entity.
 */
@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {

    List<Banner> findAllByOrderBySortOrderAscCreatedAtDesc();

    @Query("""
            SELECT b FROM Banner b
            WHERE b.status = 'ACTIVE'
              AND (b.startDate IS NULL OR b.startDate <= :now)
              AND (b.endDate IS NULL OR b.endDate >= :now)
            ORDER BY b.sortOrder ASC, b.createdAt DESC
            """)
    List<Banner> findActiveBanners(@Param("now") LocalDateTime now);
}
