package com.computershop.repository;

import com.computershop.entity.InventoryLog;
import com.computershop.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {

    @Query("SELECT il FROM InventoryLog il WHERE il.product.id = :productId ORDER BY il.createdAt DESC")
    List<InventoryLog> findByProductIdOrderByCreatedAtDesc(@Param("productId") Long productId);

    @Query("SELECT il FROM InventoryLog il WHERE il.product.id = :productId ORDER BY il.createdAt DESC")
    Page<InventoryLog> findByProductIdOrderByCreatedAtDesc(@Param("productId") Long productId, Pageable pageable);

    Optional<InventoryLog> findTopByProductOrderByCreatedAtDesc(Product product);

    List<InventoryLog> findByProductAndChangeType(Product product, InventoryLog.ChangeType changeType);

    @Query("SELECT il FROM InventoryLog il ORDER BY il.createdAt DESC")
    Page<InventoryLog> findAllOrderByCreatedAtDesc(Pageable pageable);

    List<InventoryLog> findByPerformedByIdOrderByCreatedAtDesc(Long userId);

    List<InventoryLog> findByChangeTypeOrderByCreatedAtDesc(InventoryLog.ChangeType changeType);
}
