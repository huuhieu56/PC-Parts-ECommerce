package com.pcparts.module.warranty;

import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.order.entity.Order;
import com.pcparts.module.order.repository.OrderRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.warranty.entity.WarrantyRequest;
import com.pcparts.module.warranty.repository.WarrantyRequestRepository;
import com.pcparts.module.warranty.service.WarrantyService;
import com.pcparts.module.warranty.service.WarrantyService.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WarrantyServiceTest {

    @Mock private WarrantyRequestRepository warrantyRepo;
    @Mock private UserProfileRepository userProfileRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private ProductRepository productRepository;

    @InjectMocks
    private WarrantyService warrantyService;

    private UserProfile testUser;
    private Product testProduct;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        testUser = UserProfile.builder().id(1L).fullName("Test User").phone("0901111111").build();
        testProduct = Product.builder().id(10L).name("RAM 32GB").sellingPrice(new BigDecimal("3000000")).build();
        testOrder = Order.builder().id(100L).build();
    }

    @Test
    @DisplayName("Create warranty request — success")
    void createRequest_success() {
        WarrantyRequestDto req = new WarrantyRequestDto(100L, 10L, "RAM bị lỗi sau 2 tháng");

        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(orderRepository.findById(100L)).thenReturn(Optional.of(testOrder));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(warrantyRepo.save(any(WarrantyRequest.class))).thenAnswer(inv -> {
            WarrantyRequest wr = inv.getArgument(0);
            wr.setId(1L);
            wr.setCreatedAt(LocalDateTime.now());
            return wr;
        });

        WarrantyDto result = warrantyService.createRequest(1L, req);

        assertThat(result).isNotNull();
        assertThat(result.getProductName()).isEqualTo("RAM 32GB");
        assertThat(result.getIssueDescription()).isEqualTo("RAM bị lỗi sau 2 tháng");
        assertThat(result.getStatus()).isEqualTo("RECEIVED");
        verify(warrantyRepo).save(any(WarrantyRequest.class));
    }

    @Test
    @DisplayName("Create warranty request — order not found throws")
    void createRequest_orderNotFound() {
        WarrantyRequestDto req = new WarrantyRequestDto(999L, 10L, "Error");
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> warrantyService.createRequest(1L, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Update warranty status — success")
    void updateStatus_success() {
        WarrantyRequest wr = WarrantyRequest.builder().id(1L).user(testUser).order(testOrder)
                .product(testProduct).issueDescription("Test").status("RECEIVED").build();
        when(warrantyRepo.findById(1L)).thenReturn(Optional.of(wr));
        when(warrantyRepo.save(any(WarrantyRequest.class))).thenReturn(wr);

        WarrantyDto result = warrantyService.updateStatus(1L, "COMPLETED", "Đã thay RAM mới");

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(result.getResolution()).isEqualTo("Đã thay RAM mới");
    }

    @Test
    @DisplayName("Update warranty status — not found throws")
    void updateStatus_notFound() {
        when(warrantyRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> warrantyService.updateStatus(999L, "COMPLETED", "Note"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
