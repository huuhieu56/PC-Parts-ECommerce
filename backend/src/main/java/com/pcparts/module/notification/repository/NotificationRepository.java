package com.pcparts.module.notification.repository;

import com.pcparts.module.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository for Notification entity.
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Finds all notifications for a user, ordered by creation date descending.
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Counts unread notifications for a user.
     */
    long countByUserIdAndIsRead(Long userId, Boolean isRead);

    /**
     * Marks all notifications as read for a user.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") Long userId);
}
