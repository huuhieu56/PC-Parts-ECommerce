package com.computershop.config;

import com.computershop.service.interfaces.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.stereotype.Service;

// Custom logout handler để thu hồi JWT token khi người dùng logout

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomLogoutHandler implements LogoutHandler {

    private final TokenService tokenService;

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        log.info("Đang xử lý yêu cầu đăng xuất");

        final String authHeader = request.getHeader("Authorization");
        final String jwt;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Không tìm thấy header Authorization hợp lệ trong quá trình đăng xuất");
            return;
        }

        jwt = authHeader.substring(7);

        try {
            // Thu hồi token khi người dùng đăng xuất
            tokenService.logout(jwt);
            log.info("Thu hồi token thành công trong quá trình đăng xuất");
        } catch (Exception e) {
            log.error("Lỗi khi thu hồi token: {}", e.getMessage());
        }
    }
}

