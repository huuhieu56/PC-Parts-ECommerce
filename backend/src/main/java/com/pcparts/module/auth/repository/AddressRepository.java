package com.pcparts.module.auth.repository;

import com.pcparts.module.auth.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Address entity.
 */
@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    /**
     * Finds all addresses for a user.
     */
    List<Address> findByUserIdOrderByIsDefaultDesc(Long userId);
}
