package com.pcparts.module.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import static com.pcparts.common.constant.ValidationConstants.EMAIL_MESSAGE;
import static com.pcparts.common.constant.ValidationConstants.EMAIL_REGEX;

/**
 * Request DTO for requesting a password reset link.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Pattern(regexp = EMAIL_REGEX, message = EMAIL_MESSAGE)
    private String email;
}
