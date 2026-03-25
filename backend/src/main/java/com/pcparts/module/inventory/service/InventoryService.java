package com.pcparts.module.inventory.service;

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
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final ProductRepository productRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public InventoryDto getByProductId(Long productId) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
        return toDto(inv);
    }

    @Transactional
    public InventoryDto importStock(Long productId, int quantity, String note, String performedByStr) {
        Inventory inv = getOrCreateInventory(productId);
        inv.setQuantity(inv.getQuantity() + quantity);
        inventoryRepository.save(inv);
        logChange(inv.getProduct(), "IMPORT", quantity, note, resolveAccount(performedByStr));
        return toDto(inv);
    }

    @Transactional
    public InventoryDto exportStock(Long productId, int quantity, String note, String performedByStr) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
        if (quantity > inv.getQuantity())
            throw new BusinessException("Số lượng xuất vượt quá tồn kho (" + inv.getQuantity() + ")", HttpStatus.BAD_REQUEST);
        inv.setQuantity(inv.getQuantity() - quantity);
        inventoryRepository.save(inv);
        logChange(inv.getProduct(), "EXPORT", -quantity, note, resolveAccount(performedByStr));
        return toDto(inv);
    }

    @Transactional
    public InventoryDto adjustStock(Long productId, int newQuantity, String note, String performedByStr) {
        Inventory inv = getOrCreateInventory(productId);
        int diff = newQuantity - inv.getQuantity();
        inv.setQuantity(newQuantity);
        inventoryRepository.save(inv);
        logChange(inv.getProduct(), "ADJUSTMENT", diff, note, resolveAccount(performedByStr));
        return toDto(inv);
    }

    /**
     * Reserves stock by deducting from inventory when an order is created.
     * Logs the change as a SALE type entry.
     */
    @Transactional
    public void reserveStock(Long productId, int quantity) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
        if (quantity > inv.getQuantity())
            throw new BusinessException("Không đủ tồn kho cho sản phẩm " + inv.getProduct().getName()
                    + " (còn " + inv.getQuantity() + ", yêu cầu " + quantity + ")", HttpStatus.BAD_REQUEST);
        inv.setQuantity(inv.getQuantity() - quantity);
        inventoryRepository.save(inv);
        logChange(inv.getProduct(), "SALE", -quantity, "Đặt hàng - trừ kho", null);
    }

    /**
     * Releases reserved stock back to inventory when an order is cancelled.
     * Logs the change as a RETURN type entry.
     */
    @Transactional
    public void releaseStock(Long productId, int quantity) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
        inv.setQuantity(inv.getQuantity() + quantity);
        inventoryRepository.save(inv);
        logChange(inv.getProduct(), "RETURN", quantity, "Hủy đơn - hoàn kho", null);
    }

    @Transactional(readOnly = true)
    public Page<InventoryLog> getAuditLog(Long productId, int page, int size) {
        return inventoryLogRepository.findByProductIdOrderByCreatedAtDesc(productId, PageRequest.of(page, size));
    }

    private Inventory getOrCreateInventory(Long productId) {
        return inventoryRepository.findByProductId(productId).orElseGet(() -> {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
            return inventoryRepository.save(Inventory.builder().product(product).quantity(0).build());
        });
    }

    private Account resolveAccount(String str) {
        try { return accountRepository.findById(Long.parseLong(str)).orElse(null); } catch (Exception e) { return null; }
    }

    private void logChange(Product product, String type, int qty, String note, Account performedBy) {
        inventoryLogRepository.save(InventoryLog.builder().product(product).type(type)
                .quantityChange(qty).note(note).performedBy(performedBy).build());
    }

    private InventoryDto toDto(Inventory inv) {
        return InventoryDto.builder().productId(inv.getProduct().getId()).productName(inv.getProduct().getName())
                .quantity(inv.getQuantity()).lowStockThreshold(inv.getLowStockThreshold()).build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class InventoryDto {
        private Long productId;
        private String productName;
        private Integer quantity;
        private Integer lowStockThreshold;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class StockRequest {
        private int quantity;
        private String reason;
    }
}
