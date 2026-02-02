package com.computershop.service.impl;

import com.computershop.dto.request.InventoryRequest;
import com.computershop.dto.response.InventoryLogResponse;
import com.computershop.dto.response.InventoryResponse;
import com.computershop.dto.response.LowStockSummaryResponse;
import com.computershop.entity.InventoryLog;
import com.computershop.entity.Product;
import com.computershop.entity.User;
import com.computershop.exception.ResourceNotFoundException;
import com.computershop.repository.InventoryLogRepository;
import com.computershop.repository.ProductRepository;
import com.computershop.repository.UserRepository;
import com.computershop.service.interfaces.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final UserRepository userRepository;


    @Override
    public InventoryResponse adjustInventory(Long productId, InventoryRequest request) {
        log.info("Điều chỉnh tồn kho cho sản phẩm {} với thay đổi: {}", productId, request.getChangeType());

        Product product = findProductById(productId);
        User performer = findUserById(request.getPerformedById());

        InventoryLog.ChangeType changeType = resolveChangeType(request.getChangeType());

        int oldQuantity = product.getQuantity();
        int newQuantity;
        if (changeType == InventoryLog.ChangeType.IN) {
            newQuantity = oldQuantity + request.getQuantity();
        } else {
            newQuantity = oldQuantity - request.getQuantity();
            if (newQuantity < 0) {
                throw new IllegalArgumentException("Số lượng trong kho không đủ để điều chỉnh. Có: " + oldQuantity + ", Yêu cầu: " + request.getQuantity());
            }
        }

        product.setQuantity(newQuantity);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        InventoryLog inventoryLog = InventoryLog.builder()
                .product(product)
                .changeType(changeType)
                .quantityChange(request.getQuantity())
                .reason(request.getReason())
                .performedBy(performer)
                .createdAt(LocalDateTime.now())
                .build();

        inventoryLogRepository.save(inventoryLog);

        log.info("Tồn kho đã được điều chỉnh cho sản phẩm ID: {} từ {} đến {}", productId, oldQuantity, newQuantity);

        return InventoryResponse.fromEntity(product);
    }

    @Override
    @Transactional(readOnly = true)
    public LowStockSummaryResponse getLowStockSummary(int threshold) {
        List<Product> lowStockProducts = productRepository.findByQuantityLessThanEqual(threshold);
        List<Product> outOfStockProducts = productRepository.findByQuantity(0);
        List<Product> needRestockProducts = productRepository.findLowStockProducts();

        return LowStockSummaryResponse.fromProducts(lowStockProducts, outOfStockProducts, needRestockProducts);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryLogResponse> getAllInventoryHistory(Pageable pageable) {
        Page<InventoryLog> page = inventoryLogRepository.findAllOrderByCreatedAtDesc(pageable);
        var dtoList = page.getContent().stream().map(InventoryLogResponse::fromEntity).collect(Collectors.toList());
        return new PageImpl<>(dtoList, PageRequest.of(page.getNumber(), page.getSize(), page.getSort()), page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isStockAvailable(Long productId, int quantity) {
        Product product = findProductById(productId);
        return product.getQuantity() >= quantity;
    }

    private Product findProductById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + id));
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với id: " + userId));
    }

    private InventoryLog.ChangeType resolveChangeType(String rawChangeType) {
        if (rawChangeType == null) {
            throw new IllegalArgumentException("Loại thay đổi không được để trống");
        }
        try {
            return InventoryLog.ChangeType.valueOf(rawChangeType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Loại thay đổi không hợp lệ: " + rawChangeType);
        }
    }

}
