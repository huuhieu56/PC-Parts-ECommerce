package com.pcparts.module.warranty.repository;

import com.pcparts.module.warranty.entity.ReturnRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for ReturnRequest entity.
 */
@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    /**
     * Finds return requests for a specific user with pagination.
     *
     * @param userId   the user profile ID
     * @param pageable pagination info
     * @return page of return requests
     */
    Page<ReturnRequest> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Finds return requests by status with pagination.
     *
     * @param status   the request status
     * @param pageable pagination info
     * @return page of return requests
     */
    Page<ReturnRequest> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /**
     * Checks if a return request already exists for a specific order detail.
     *
     * @param orderDetailId the order detail ID
     * @return true if exists
     */
    boolean existsByOrderDetailId(Long orderDetailId);
}
