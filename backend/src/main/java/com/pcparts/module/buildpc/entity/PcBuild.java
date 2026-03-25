package com.pcparts.module.buildpc.entity;

import com.pcparts.module.auth.entity.UserProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * PC Build configuration — allows guests and customers to assemble components.
 */
@Entity
@Table(name = "pc_build")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PcBuild {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserProfile user;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(length = 200)
    @Builder.Default
    private String name = "Cấu hình mới";

    @Column(name = "total_price", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(length = 20)
    @Builder.Default
    private String status = "DRAFT";

    @OneToMany(mappedBy = "build", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PcBuildComponent> components = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
