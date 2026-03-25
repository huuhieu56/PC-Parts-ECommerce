package com.pcparts.module.inventory;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.Account;
import com.pcparts.module.auth.repository.AccountRepository;
import com.pcparts.module.inventory.entity.Inventory;
import com.pcparts.module.inventory.entity.InventoryLog;
import com.pcparts.module.inventory.repository.InventoryLogRepository;
import com.pcparts.module.inventory.repository.InventoryRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.inventory.service.InventoryService;
import com.pcparts.module.inventory.service.InventoryService.InventoryDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock private InventoryRepository inventoryRepository;
    @Mock private InventoryLogRepository inventoryLogRepository;
    @Mock private ProductRepository productRepository;
    @Mock private AccountRepository accountRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Product testProduct;
    private Inventory testInventory;

    @BeforeEach
    void setUp() {
        testProduct = Product.builder().id(1L).name("Intel i7").sellingPrice(new BigDecimal("9990000")).build();
        testInventory = Inventory.builder().id(1L).product(testProduct).quantity(50).lowStockThreshold(10).build();
    }

    @Test
    @DisplayName("Get inventory — success")
    void getByProductId_success() {
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(testInventory));

        InventoryDto result = inventoryService.getByProductId(1L);

        assertThat(result.getProductId()).isEqualTo(1L);
        assertThat(result.getQuantity()).isEqualTo(50);
    }

    @Test
    @DisplayName("Get inventory — not found throws exception")
    void getByProductId_notFound() {
        when(inventoryRepository.findByProductId(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.getByProductId(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Import stock — increases quantity")
    void importStock_success() {
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(testInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(testInventory);
        when(inventoryLogRepository.save(any(InventoryLog.class))).thenReturn(null);

        InventoryDto result = inventoryService.importStock(1L, 20, "Nhập hàng mới", "1");

        assertThat(testInventory.getQuantity()).isEqualTo(70); // 50 + 20
        verify(inventoryLogRepository).save(any(InventoryLog.class));
    }

    @Test
    @DisplayName("Export stock — decreases quantity")
    void exportStock_success() {
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(testInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(testInventory);
        when(inventoryLogRepository.save(any(InventoryLog.class))).thenReturn(null);

        inventoryService.exportStock(1L, 10, "Xuất hàng", "1");

        assertThat(testInventory.getQuantity()).isEqualTo(40); // 50 - 10
    }

    @Test
    @DisplayName("Export stock — exceeds quantity throws exception")
    void exportStock_exceedsQuantity() {
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(testInventory));

        assertThatThrownBy(() -> inventoryService.exportStock(1L, 100, "Quá nhiều", "1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("vượt quá tồn kho");
    }

    @Test
    @DisplayName("Adjust stock — sets to new quantity")
    void adjustStock_success() {
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(testInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(testInventory);
        when(inventoryLogRepository.save(any(InventoryLog.class))).thenReturn(null);

        inventoryService.adjustStock(1L, 100, "Kiểm kê", "1");

        assertThat(testInventory.getQuantity()).isEqualTo(100);
    }

    @Test
    @DisplayName("Reserve stock — throws when insufficient")
    void reserveStock_insufficient() {
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(testInventory));

        assertThatThrownBy(() -> inventoryService.reserveStock(1L, 999))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không đủ tồn kho");
    }

    @Test
    @DisplayName("Reserve stock — passes when sufficient")
    void reserveStock_sufficient() {
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(testInventory));

        inventoryService.reserveStock(1L, 30); // 30 <= 50, should not throw
    }
}
