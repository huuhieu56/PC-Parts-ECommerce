package com.pcparts.module.notification;

import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.notification.entity.Notification;
import com.pcparts.module.notification.repository.NotificationRepository;
import com.pcparts.module.notification.service.NotificationService;
import com.pcparts.module.notification.service.NotificationService.NotificationDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @InjectMocks private NotificationService notificationService;

    private UserProfile testUser;

    @BeforeEach
    void setUp() {
        testUser = UserProfile.builder().id(1L).fullName("Test User").build();
    }

    @Test
    @DisplayName("createNotification - should create notification successfully")
    void createNotification_success() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        Notification saved = Notification.builder().id(1L).user(testUser)
                .title("Đơn hàng mới").message("Đơn hàng #123 đã được tạo").type("ORDER")
                .isRead(false).createdAt(LocalDateTime.now()).build();
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        NotificationDto result = notificationService.createNotification(1L, "Đơn hàng mới", "Đơn hàng #123 đã được tạo", "ORDER");

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Đơn hàng mới");
        assertThat(result.getType()).isEqualTo("ORDER");
        assertThat(result.getIsRead()).isFalse();
    }

    @Test
    @DisplayName("createNotification - should throw when user not found")
    void createNotification_userNotFound() {
        when(userProfileRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.createNotification(999L, "Title", "Message", "SYSTEM"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("createNotification - should default type to SYSTEM when null")
    void createNotification_nullType() {
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        Notification saved = Notification.builder().id(2L).user(testUser)
                .title("Test").message("Msg").type("SYSTEM").isRead(false).createdAt(LocalDateTime.now()).build();
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        NotificationDto result = notificationService.createNotification(1L, "Test", "Msg", null);

        assertThat(result.getType()).isEqualTo("SYSTEM");
    }

    @Test
    @DisplayName("getUserNotifications - should return paginated notifications")
    void getUserNotifications_success() {
        Notification n1 = Notification.builder().id(1L).user(testUser).title("N1").message("M1")
                .type("SYSTEM").isRead(false).createdAt(LocalDateTime.now()).build();
        Notification n2 = Notification.builder().id(2L).user(testUser).title("N2").message("M2")
                .type("ORDER").isRead(true).createdAt(LocalDateTime.now()).build();
        Page<Notification> page = new PageImpl<>(List.of(n1, n2), PageRequest.of(0, 20), 2);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class))).thenReturn(page);

        Page<NotificationDto> result = notificationService.getUserNotifications(1L, 0, 20);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("N1");
    }

    @Test
    @DisplayName("getUnreadCount - should return count of unread notifications")
    void getUnreadCount_success() {
        when(notificationRepository.countByUserIdAndIsRead(1L, false)).thenReturn(5L);

        long count = notificationService.getUnreadCount(1L);

        assertThat(count).isEqualTo(5);
    }

    @Test
    @DisplayName("markAsRead - should mark notification as read")
    void markAsRead_success() {
        Notification notification = Notification.builder().id(1L).user(testUser).title("N1").message("M1")
                .type("SYSTEM").isRead(false).createdAt(LocalDateTime.now()).build();
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        NotificationDto result = notificationService.markAsRead(1L);

        assertThat(result.getIsRead()).isTrue();
    }

    @Test
    @DisplayName("markAsRead - should throw when notification not found")
    void markAsRead_notFound() {
        when(notificationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("markAllAsRead - should call repository bulk update")
    void markAllAsRead_success() {
        when(notificationRepository.markAllAsRead(1L)).thenReturn(3);

        int count = notificationService.markAllAsRead(1L);

        assertThat(count).isEqualTo(3);
        verify(notificationRepository).markAllAsRead(1L);
    }
}
