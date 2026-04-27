package com.pcparts.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import static com.pcparts.common.constant.ValidationConstants.PASSWORD_MESSAGE;
import static com.pcparts.common.constant.ValidationConstants.PASSWORD_REGEX;

/**
 * Request DTO for setting a new password by reset token.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Token không được để trống")
    private String token;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE)
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;
}
