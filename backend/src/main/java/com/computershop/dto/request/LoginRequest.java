package com.computershop.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO yêu cầu đăng nhập người dùng
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Tên đăng nhập/email/số điện thoại là bắt buộc")
    private String identifier;

    @NotBlank(message = "Mật khẩu là bắt buộc")
    private String password;
}
