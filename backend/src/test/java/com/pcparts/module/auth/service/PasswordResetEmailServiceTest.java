package com.pcparts.module.auth.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for PasswordResetEmailService.
 */
@ExtendWith({MockitoExtension.class, OutputCaptureExtension.class})
class PasswordResetEmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    @DisplayName("sendResetPasswordEmail should not log raw reset token when mail is disabled")
    void sendResetPasswordEmail_mailDisabled_doesNotLogRawToken(CapturedOutput output) {
        PasswordResetEmailService service = new PasswordResetEmailService(mailSender);
        ReflectionTestUtils.setField(service, "fromAddress", "");
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:3000");
        String token = "9c73c8dc-2ab1-4ca8-bd7d-8d31d6c4f9ba";

        service.sendResetPasswordEmail("user@example.com", token);

        assertThat(output.getOut()).contains("Password reset email skipped because MAIL_USERNAME is empty");
        assertThat(output.getOut()).doesNotContain(token);
        assertThat(output.getOut()).doesNotContain("/auth/reset-password?token=");
        verify(mailSender, never()).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("sendResetPasswordEmail should log sanitized SMTP auth root cause")
    void sendResetPasswordEmail_authFailure_logsRootCauseWithoutToken(CapturedOutput output) {
        PasswordResetEmailService service = new PasswordResetEmailService(mailSender);
        ReflectionTestUtils.setField(service, "fromAddress", "pcpartsadmin@gmail.com");
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:3000");
        String token = "9c73c8dc-2ab1-4ca8-bd7d-8d31d6c4f9ba";
        doThrow(new MailAuthenticationException("Authentication failed",
                new RuntimeException("535 5.7.8 Username and Password not accepted")))
                .when(mailSender).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));

        service.sendResetPasswordEmail("user@example.com", token);

        assertThat(output.getOut()).contains("535 5.7.8 Username and Password not accepted");
        assertThat(output.getOut()).doesNotContain(token);
        assertThat(output.getOut()).doesNotContain("/auth/reset-password?token=");
    }
}
