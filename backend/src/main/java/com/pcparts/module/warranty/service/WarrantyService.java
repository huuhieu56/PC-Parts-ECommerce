package com.pcparts.module.warranty.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.order.entity.Order;

import com.pcparts.module.order.repository.OrderDetailRepository;
import com.pcparts.module.order.repository.OrderRepository;
import com.pcparts.module.product.entity.Product;
import com.pcparts.module.product.repository.ProductRepository;
import com.pcparts.module.warranty.entity.WarrantyRequest;
import com.pcparts.module.warranty.repository.WarrantyRequestRepository;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service for warranty ticket operations.
 * BUG-10 fix: validates order is COMPLETED and warranty period is still valid.
 * BUG-11 fix: validates order belongs to the requesting user.
 * BUG-13 fix: resolves accountId → UserProfile.
 */
@Service
@RequiredArgsConstructor
public class WarrantyService {

    private final WarrantyRequestRepository warrantyRepo;
    private final UserProfileRepository userProfileRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;

    /** Default warranty period in months if no specific policy exists. */
    private static final int DEFAULT_WARRANTY_MONTHS = 12;

    /**
     * Creates a warranty request with full business validation.
     *
     * @param accountId the account ID from JWT
     * @param req       warranty request details
     * @return created warranty DTO
     */
    @Transactional
    public WarrantyDto createRequest(Long accountId, WarrantyRequestDto req) {
        // BUG-13 fix: resolve accountId → UserProfile
        UserProfile user = userProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", accountId));
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", req.getProductId()));

        // BUG-11 fix: validate order belongs to user
        if (!order.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Đơn hàng này không thuộc về bạn", HttpStatus.FORBIDDEN);
        }

        // BUG-10 fix: validate order is COMPLETED
        if (!"COMPLETED".equals(order.getStatus())) {
            throw new BusinessException("Chỉ có thể yêu cầu bảo hành cho đơn hàng đã hoàn thành", HttpStatus.BAD_REQUEST);
        }

        // BUG-10 fix: validate product is in this order
        boolean productInOrder = orderDetailRepository.findByOrderId(order.getId()).stream()
                .anyMatch(d -> d.getProduct().getId().equals(product.getId()));
        if (!productInOrder) {
            throw new BusinessException("Sản phẩm này không có trong đơn hàng", HttpStatus.BAD_REQUEST);
        }

        // BUG-10 fix: validate warranty period
        LocalDateTime orderDate = order.getCreatedAt();
        LocalDateTime warrantyExpiry = orderDate.plusMonths(DEFAULT_WARRANTY_MONTHS);
        if (LocalDateTime.now().isAfter(warrantyExpiry)) {
            throw new BusinessException("Sản phẩm đã hết hạn bảo hành (hạn bảo hành: "
                    + DEFAULT_WARRANTY_MONTHS + " tháng kể từ ngày mua)", HttpStatus.BAD_REQUEST);
        }

        WarrantyRequest wr = WarrantyRequest.builder()
                .user(user)
                .order(order)
                .product(product)
                .issueDescription(req.getIssueDescription())
                .status("RECEIVED")
                .build();
        wr = warrantyRepo.save(wr);
        return toDto(wr);
    }

    /**
     * Gets warranty requests for current user. BUG-13 fix.
     */
    @Transactional(readOnly = true)
    public Page<WarrantyDto> getMyRequests(Long accountId, int page, int size) {
        UserProfile user = userProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", accountId));
        return warrantyRepo.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size))
                .map(this::toDto);
    }

    /**
     * Gets all warranty requests for admin with optional status filter.
     */
    @Transactional(readOnly = true)
    public Page<WarrantyDto> getAllRequests(String status, int page, int size) {
        if (status != null) {
            return warrantyRepo.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size))
                    .map(this::toDto);
        }
        return warrantyRepo.findAll(PageRequest.of(page, size)).map(this::toDto);
    }

    /**
     * Updates warranty ticket status (admin/sales).
     */
    @Transactional
    public WarrantyDto updateStatus(Long id, String status, String resolution) {
        WarrantyRequest wr = warrantyRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WarrantyRequest", "id", id));
        wr.setStatus(status);
        wr.setResolution(resolution);
        wr = warrantyRepo.save(wr);
        return toDto(wr);
    }

    private WarrantyDto toDto(WarrantyRequest wr) {
        return WarrantyDto.builder()
                .id(wr.getId())
                .orderId(wr.getOrder().getId())
                .productId(wr.getProduct().getId())
                .productName(wr.getProduct().getName())
                .issueDescription(wr.getIssueDescription())
                .status(wr.getStatus())
                .resolution(wr.getResolution())
                .createdAt(wr.getCreatedAt() != null ? wr.getCreatedAt().toString() : null)
                .build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WarrantyDto {
        private Long id;
        private Long orderId;
        private Long productId;
        private String productName;
        private String issueDescription;
        private String status;
        private String resolution;
        private String createdAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class WarrantyRequestDto {
        private Long orderId;
        private Long productId;
        private String issueDescription;
    }
}
