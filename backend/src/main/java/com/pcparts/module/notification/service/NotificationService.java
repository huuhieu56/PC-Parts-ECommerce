package com.pcparts.module.notification.service;

import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.notification.entity.Notification;
import com.pcparts.module.notification.repository.NotificationRepository;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing user notifications.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserProfileRepository userProfileRepository;

    /**
     * Creates a new notification for a user.
     *
     * @param userId  the target user ID
     * @param title   notification title
     * @param message notification message
     * @param type    notification type (SYSTEM, ORDER, PROMOTION)
     * @return the created notification DTO
     */
    @Transactional
    public NotificationDto createNotification(Long userId, String title, String message, String type) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "id", userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type != null ? type : "SYSTEM")
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        return toDto(notification);
    }

    /**
     * Gets paginated notifications for a user, ordered by newest first.
     *
     * @param userId the user ID
     * @param page   page number (0-based)
     * @param size   page size
     * @return page of notification DTOs
     */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(Long userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(this::toDto);
    }

    /**
     * Counts unread notifications for a user.
     *
     * @param userId the user ID
     * @return count of unread notifications
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    /**
     * Marks a single notification as read.
     *
     * @param notificationId the notification ID
     * @return the updated notification DTO
     */
    @Transactional
    public NotificationDto markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        notification.setIsRead(true);
        notification = notificationRepository.save(notification);
        return toDto(notification);
    }

    /**
     * Marks all notifications as read for a user.
     *
     * @param userId the user ID
     * @return number of notifications marked as read
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsRead(userId);
    }

    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationDto {
        private Long id;
        private String title;
        private String message;
        private String type;
        private Boolean isRead;
        private String createdAt;
    }
}
