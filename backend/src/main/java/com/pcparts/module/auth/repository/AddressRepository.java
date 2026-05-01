package com.pcparts.module.auth.repository;

import com.pcparts.module.auth.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Address entity.
 */
@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    /**
     * Finds all addresses for a user.
     */
    List<Address> findByUserIdOrderByIsDefaultDesc(Long userId);

    /**
     * Finds all addresses for a user, putting the default and most recently
     * updated addresses first.
     */
    List<Address> findByUserIdOrderByIsDefaultDescUpdatedAtDesc(Long userId);

    /**
     * Finds an address only when it belongs to the given user.
     */
    Optional<Address> findByIdAndUserId(Long id, Long userId);

    /**
     * Counts addresses owned by a user.
     */
    long countByUserId(Long userId);
}
