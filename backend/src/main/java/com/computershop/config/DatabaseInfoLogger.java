package com.computershop.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

// Component ghi log thông tin kết nối cơ sở dữ liệu khi ứng dụng khởi động.
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInfoLogger {

    private final Environment env;
    private final DataSource dataSource;

    @Value("${spring.application.name:computer-shop}")
    private String appName;

    @Value("${spring.application.version:unknown}")
    private String appVersion;

    @PostConstruct
    public void logDatabaseInfo() {
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            String url = meta.getURL();
            String user = meta.getUserName();
            String dbProduct = meta.getDatabaseProductName();
            String dbVersion = meta.getDatabaseProductVersion();

            log.info("{} v{} - Đã kết nối tới cơ sở dữ liệu: {} (phiên bản: {}), jdbcUrl={}, user={}",
                    appName, appVersion, dbProduct, dbVersion, url, user);
        } catch (Exception e) {
            // Thử lấy thông tin từ Environment nếu không thể đọc metadata JDBC trực tiếp
            String url = env.getProperty("spring.datasource.url", "(không xác định)");
            String user = env.getProperty("spring.datasource.username", "(không xác định)");
            log.warn("{} v{} - Không thể đọc metadata JDBC trực tiếp, chuyển sang dùng cấu hình trong properties: jdbcUrl={}, user={}. Lỗi: {}",
                    appName, appVersion, url, user, e.getMessage());
        }
    }
}
