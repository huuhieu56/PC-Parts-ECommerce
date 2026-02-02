package com.computershop.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

// Cấu hình Spring Security cho xác thực dựa trên JWT
// Thiết lập bảo mật cho các endpoint REST API với kiểm soát truy cập theo vai trò
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final LogoutHandler logoutHandler;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("Đang cấu hình Security Filter Chain");

        http
                // Vô hiệu CSRF cho REST API
                .csrf(AbstractHttpConfigurer::disable)

                // Cấu hình CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Quy tắc phân quyền
                .authorizeHttpRequests(auth -> auth
                        // Endpoint công khai - không yêu cầu xác thực
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/refresh-token").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/check/**").permitAll() // Kiểm tra username/email

                        // Sản phẩm - cho phép đọc công khai
                        .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
                        // Ảnh tĩnh (phục vụ từ file system) công khai
                        .requestMatchers("/images/**").permitAll()

                        // Khuyến mãi - cho phép đọc công khai khi đang active
                        .requestMatchers(HttpMethod.GET, "/api/v1/promotions/active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/promotions/applicable").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/promotions/best").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/promotions/*/calculate-discount").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/promotions/*/is-active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/promotions/*/is-applicable").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/promotions/*").permitAll() // Lấy khuyến mãi theo ID

                        // Bình luận - cho phép đọc công khai
                        .requestMatchers(HttpMethod.GET, "/api/v1/products/*/comments").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/comments/**").permitAll()
                        // Bình luận tổng hợp - chỉ staff/admin
                        .requestMatchers(HttpMethod.GET, "/api/v1/comments").hasAnyRole("STAFF", "ADMIN")

                        // Endpoint phục vụ phát triển
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/").permitAll()
                        .requestMatchers("/swagger-ui/**").permitAll()
                        .requestMatchers("/v3/api-docs/**").permitAll()

                        // Quản trị người dùng - chỉ ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/v1/users").hasRole("ADMIN") // Lấy tất cả người dùng
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/role/**").hasRole("ADMIN") // Lấy theo role
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/create").hasRole("ADMIN") // Tạo người dùng
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/users/*").hasRole("ADMIN") // Xóa người dùng
                        .requestMatchers("/api/v1/roles/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/promotions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/promotions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/promotions/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/inventory/products/*/adjust").hasRole("ADMIN")
                        .requestMatchers("/api/v1/inventory/products/*/threshold").hasRole("ADMIN")
                        .requestMatchers("/api/v1/inventory/products/*/reserve").hasRole("ADMIN")
                        .requestMatchers("/api/v1/inventory/products/*/release").hasRole("ADMIN")

                        // Nhân viên & Quản trị
                        .requestMatchers("/api/v1/inventory/**").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/comments/*/reply").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers("/api/v1/orders/*/status").hasAnyRole("STAFF", "ADMIN")

                        // Khách hàng / Nhân viên / Quản trị (đã xác thực)
                        .requestMatchers("/api/v1/cart/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/v1/orders/**").hasAnyRole("CUSTOMER", "STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/products/*/comments")
                        .hasAnyRole("CUSTOMER", "STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/comments/**")
                        .hasAnyRole("CUSTOMER", "STAFF", "ADMIN")

                        // Các request còn lại yêu cầu xác thực
                        .anyRequest().authenticated())

                // Quản lý session (stateless cho JWT)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Cấu hình authentication provider
                .authenticationProvider(authenticationProvider())

                // Thêm JWT filter trước UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                // Cấu hình logout
                .logout(logout -> logout
                        .logoutUrl("/api/v1/users/logout")
                        .addLogoutHandler(logoutHandler)
                        .logoutSuccessHandler(
                                (request, response, authentication) -> SecurityContextHolder.clearContext()));

        // Cho phép H2 console nhúng trong frame (môi trường dev)
        http.headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.sameOrigin()));

        log.info("Cấu hình Security Filter Chain thành công");
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        log.info("Đang cấu hình CORS với danh sách origin cho phép: {}", allowedOrigins);

        CorsConfiguration configuration = new CorsConfiguration();

        // Phân tích danh sách origin từ application.yml (phân tách bằng dấu phẩy)
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOriginPatterns(origins);

        log.info("Mẫu origin được phép cho CORS: {}", origins);

        // Cho phép tất cả phương thức HTTP
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Cho phép tất cả header
        configuration.setAllowedHeaders(List.of("*"));

        // Cho phép credentials (cookies, Authorization header)
        configuration.setAllowCredentials(true);

        // Expose header Authorization cho frontend
        configuration.setExposedHeaders(List.of("Authorization"));

        // Cache phản hồi preflight trong 1 giờ
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        log.info("Cấu hình CORS hoàn tất với {} origin được phép", origins.size());
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        log.info("Đang cấu hình BCrypt Password Encoder");
        return new BCryptPasswordEncoder(12); // Độ mạnh 12, mức an toàn tốt
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        log.info("Đang cấu hình DAO Authentication Provider");

        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        log.info("Đang cấu hình Authentication Manager");
        return config.getAuthenticationManager();
    }
}
