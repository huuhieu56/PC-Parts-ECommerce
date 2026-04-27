package com.pcparts.module.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Sends password reset emails for UC-CUS-15.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Sends a password reset link to the target email.
     *
     * @param email the recipient email address
     * @param resetToken the reset token stored in the database
     */
    public void sendResetPasswordEmail(String email, String resetToken) {
        String resetLink = frontendUrl + "/auth/reset-password?token=" + resetToken;

        if (!StringUtils.hasText(fromAddress)) {
            log.info("Password reset email skipped because MAIL_USERNAME is empty. email={}", email);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(email);
        message.setSubject("Đặt lại mật khẩu PC Parts");
        message.setText("""
                Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản PC Parts.

                Vui lòng mở liên kết sau để thiết lập mật khẩu mới:
                %s

                Liên kết sẽ hết hạn sau 30 phút. Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.
                """.formatted(resetLink));

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Could not send password reset email to {}: {}", email, ex.getMessage());
        }
    }
}
