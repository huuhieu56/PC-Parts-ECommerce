package com.pcparts.module.inventory.entity;

import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * InventoryLog entity — DB: type, quantity_change, performed_by BIGINT, note.
 */
@Entity
@Table(name = "inventory_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private Account performedBy;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
