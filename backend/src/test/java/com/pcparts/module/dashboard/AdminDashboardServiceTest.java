package com.pcparts.module.dashboard;

import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.dashboard.service.AdminDashboardService;
import com.pcparts.module.dashboard.service.AdminDashboardService.DashboardStatsDto;
import com.pcparts.module.order.repository.OrderRepository;
import com.pcparts.module.product.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @InjectMocks private AdminDashboardService dashboardService;

    @Test
    @DisplayName("getStats - should return correct counts and revenue")
    void getStats_success() {
        when(orderRepository.count()).thenReturn(50L);
        when(productRepository.count()).thenReturn(100L);
        when(userProfileRepository.count()).thenReturn(200L);
        when(orderRepository.sumTotalRevenue()).thenReturn(new BigDecimal("500000000"));

        DashboardStatsDto result = dashboardService.getStats();

        assertThat(result.getTotalOrders()).isEqualTo(50);
        assertThat(result.getTotalProducts()).isEqualTo(100);
        assertThat(result.getTotalCustomers()).isEqualTo(200);
        assertThat(result.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("500000000"));
    }

    @Test
    @DisplayName("getStats - should handle zero data")
    void getStats_empty() {
        when(orderRepository.count()).thenReturn(0L);
        when(productRepository.count()).thenReturn(0L);
        when(userProfileRepository.count()).thenReturn(0L);
        when(orderRepository.sumTotalRevenue()).thenReturn(BigDecimal.ZERO);

        DashboardStatsDto result = dashboardService.getStats();

        assertThat(result.getTotalOrders()).isZero();
        assertThat(result.getTotalProducts()).isZero();
        assertThat(result.getTotalCustomers()).isZero();
        assertThat(result.getTotalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
