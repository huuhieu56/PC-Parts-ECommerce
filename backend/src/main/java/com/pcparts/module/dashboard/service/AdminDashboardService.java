package com.pcparts.module.dashboard.service;

import com.pcparts.module.order.repository.OrderRepository;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.auth.repository.UserProfileRepository;
import lombok.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service providing dashboard analytics data for the admin panel.
 */
@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserProfileRepository userProfileRepository;

    /**
     * Returns summary statistics for the admin dashboard.
     *
     * @return dashboard stats including total revenue, orders, products, and customers
     */
    @Transactional(readOnly = true)
    public DashboardStatsDto getStats() {
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        long totalCustomers = userProfileRepository.count();
        BigDecimal totalRevenue = BigDecimal.ZERO;

        try {
            List<?> results = orderRepository.findAll();
            totalRevenue = results.stream()
                    .map(o -> {
                        try {
                            var method = o.getClass().getMethod("getTotalAmount");
                            return (BigDecimal) method.invoke(o);
                        } catch (Exception e) {
                            return BigDecimal.ZERO;
                        }
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } catch (Exception ignored) {
            // Fallback to zero if revenue calculation fails
        }

        return DashboardStatsDto.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalCustomers(totalCustomers)
                .build();
    }

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
