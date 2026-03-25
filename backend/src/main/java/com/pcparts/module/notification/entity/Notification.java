package com.pcparts.module.notification.entity;

import com.pcparts.module.auth.entity.UserProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing a user notification.
 * Notifications can be of type SYSTEM, ORDER, PROMOTION.
 */
@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserProfile user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String type = "SYSTEM";

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
}
