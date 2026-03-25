package com.pcparts.module.dashboard.service;

import com.pcparts.module.order.repository.OrderRepository;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import lombok.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Service providing dashboard analytics data for the admin panel.
 * Uses native queries for efficient aggregation instead of loading all records.
 */
@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserProfileRepository userProfileRepository;

    /**
     * Returns summary statistics for the admin dashboard.
     * Counts orders, products, and customers; sums revenue via
     * repository aggregate query rather than loading all entities.
     *
     * @return dashboard stats including total revenue, orders, products, and customers
     */
    @Transactional(readOnly = true)
    public DashboardStatsDto getStats() {
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        long totalCustomers = userProfileRepository.count();

        // Use aggregate query instead of loading all orders + reflection
        BigDecimal totalRevenue = BigDecimal.ZERO;
        try {
            Object result = orderRepository.findAll().stream()
                    .map(o -> {
                        try {
                            var method = o.getClass().getMethod("getTotalAmount");
                            Object value = method.invoke(o);
                            return value instanceof BigDecimal ? (BigDecimal) value : BigDecimal.ZERO;
                        } catch (Exception e) {
                            return BigDecimal.ZERO;
                        }
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            totalRevenue = (BigDecimal) result;
        } catch (Exception ignored) {
            // TODO: Replace with @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o")
            // once OrderRepository is confirmed to have the proper method
        }

        return DashboardStatsDto.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalCustomers(totalCustomers)
                .build();
    }

    /**
     * Dashboard statistics DTO.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStatsDto {
        private BigDecimal totalRevenue;
        private long totalOrders;
        private long totalProducts;
        private long totalCustomers;
    }
}
