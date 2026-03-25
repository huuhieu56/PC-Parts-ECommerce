package com.pcparts.module.inventory.repository;

import com.pcparts.module.inventory.entity.InventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
    Page<InventoryLog> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);
}
