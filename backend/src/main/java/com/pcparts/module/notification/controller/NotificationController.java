package com.pcparts.module.notification.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.module.notification.service.NotificationService;
import com.pcparts.module.notification.service.NotificationService.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * REST controller for notification endpoints.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Gets paginated notifications for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getNotifications(
            Authentication auth,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Thông báo", notificationService.getUserNotifications(userId, page, size)));
    }

    /**
     * Gets the count of unread notifications.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Số thông báo chưa đọc", notificationService.getUnreadCount(userId)));
    }

    /**
     * Marks a specific notification as read.
     * Verifies ownership — users can only mark their own notifications.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(
            @PathVariable Long id, Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã đọc", notificationService.markAsRead(id, userId)));
    }

    /**
     * Marks all notifications as read for the authenticated user.
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả đã đọc", notificationService.markAllAsRead(userId)));
    }
}
