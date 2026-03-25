package com.pcparts.module.warranty.repository;

import com.pcparts.module.warranty.entity.WarrantyRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WarrantyRequestRepository extends JpaRepository<WarrantyRequest, Long> {
    Page<WarrantyRequest> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<WarrantyRequest> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
