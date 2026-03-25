package com.pcparts.module.buildpc.entity;

import com.pcparts.module.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A single component in a PC build configuration (one per slot type).
 */
@Entity
@Table(name = "pc_build_component")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PcBuildComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "build_id", nullable = false)
    private PcBuild build;

    @Column(name = "slot_type", nullable = false, length = 50)
    private String slotType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "unit_price", precision = 15, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
