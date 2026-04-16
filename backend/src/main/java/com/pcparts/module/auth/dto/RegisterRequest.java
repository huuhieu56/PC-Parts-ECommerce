package com.pcparts.module.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import static com.pcparts.common.constant.ValidationConstants.EMAIL_MESSAGE;
import static com.pcparts.common.constant.ValidationConstants.EMAIL_REGEX;
import static com.pcparts.common.constant.ValidationConstants.PASSWORD_MESSAGE;
import static com.pcparts.common.constant.ValidationConstants.PASSWORD_REGEX;
import static com.pcparts.common.constant.ValidationConstants.VIETNAM_PHONE_MESSAGE;
import static com.pcparts.common.constant.ValidationConstants.VIETNAM_PHONE_REGEX;

/**
 * Request DTO for user registration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Pattern(regexp = EMAIL_REGEX, message = EMAIL_MESSAGE)
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = VIETNAM_PHONE_REGEX, message = VIETNAM_PHONE_MESSAGE)
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE)
    private String password;
}
