package com.pcparts.module.warranty.service;

import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.order.entity.Order;
import com.pcparts.module.order.repository.OrderRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.warranty.entity.WarrantyRequest;
import com.pcparts.module.warranty.repository.WarrantyRequestRepository;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WarrantyService {

    private final WarrantyRequestRepository warrantyRepo;
    private final UserProfileRepository userProfileRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Transactional
    public WarrantyDto createRequest(Long userId, WarrantyRequestDto req) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "id", userId));
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", req.getProductId()));

        WarrantyRequest wr = WarrantyRequest.builder().user(user).order(order).product(product)
                .issueDescription(req.getIssueDescription()).status("RECEIVED").build();
        wr = warrantyRepo.save(wr);
        return toDto(wr);
    }

    @Transactional(readOnly = true)
    public Page<WarrantyDto> getMyRequests(Long userId, int page, int size) {
        return warrantyRepo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size)).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<WarrantyDto> getAllRequests(String status, int page, int size) {
        if (status != null) return warrantyRepo.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size)).map(this::toDto);
        return warrantyRepo.findAll(PageRequest.of(page, size)).map(this::toDto);
    }

    @Transactional
    public WarrantyDto updateStatus(Long id, String status, String resolution) {
        WarrantyRequest wr = warrantyRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("WarrantyRequest", "id", id));
        wr.setStatus(status);
        wr.setResolution(resolution);
        wr = warrantyRepo.save(wr);
        return toDto(wr);
    }

    private WarrantyDto toDto(WarrantyRequest wr) {
        return WarrantyDto.builder().id(wr.getId()).orderId(wr.getOrder().getId())
                .productId(wr.getProduct().getId()).productName(wr.getProduct().getName())
                .issueDescription(wr.getIssueDescription()).status(wr.getStatus()).resolution(wr.getResolution())
                .createdAt(wr.getCreatedAt() != null ? wr.getCreatedAt().toString() : null).build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WarrantyDto { private Long id; private Long orderId; private Long productId; private String productName; private String issueDescription; private String status; private String resolution; private String createdAt; }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class WarrantyRequestDto { private Long orderId; private Long productId; private String issueDescription; }
}
