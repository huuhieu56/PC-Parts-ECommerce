package com.pcparts.module.warranty.service;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.auth.entity.UserProfile;
import com.pcparts.module.auth.repository.UserProfileRepository;
import com.pcparts.module.order.entity.Order;
import com.pcparts.module.order.entity.OrderDetail;
import com.pcparts.module.order.repository.OrderDetailRepository;
import com.pcparts.module.order.repository.OrderRepository;
import com.pcparts.module.warranty.entity.ReturnRequest;
import com.pcparts.module.warranty.repository.ReturnRequestRepository;
import lombok.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Service for handling return/refund requests (UC-CUS-11).
 * Validates order ownership, completion status, and prevents duplicate requests.
 */
@Service
@RequiredArgsConstructor
public class ReturnService {

    private final ReturnRequestRepository returnRequestRepo;
    private final UserProfileRepository userProfileRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;

    /**
     * Creates a return/refund request for a specific order detail.
     *
     * @param accountId the account ID from JWT
     * @param req       return request details
     * @return created return request DTO
     */
    @Transactional
    public ReturnDto createRequest(Long accountId, ReturnRequestDto req) {
        UserProfile user = userProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", accountId));

        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));

        OrderDetail orderDetail = orderDetailRepository.findById(req.getOrderDetailId())
                .orElseThrow(() -> new ResourceNotFoundException("OrderDetail", "id", req.getOrderDetailId()));

        // Validate order belongs to user
        if (!order.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Đơn hàng không thuộc về bạn", HttpStatus.FORBIDDEN);
        }

        // Validate order is COMPLETED
        if (!"COMPLETED".equals(order.getStatus())) {
            throw new BusinessException("Chỉ có thể đổi trả cho đơn hàng đã hoàn thành", HttpStatus.BAD_REQUEST);
        }

        // Validate order detail belongs to this order
        if (!orderDetail.getOrder().getId().equals(order.getId())) {
            throw new BusinessException("Sản phẩm không thuộc đơn hàng này", HttpStatus.BAD_REQUEST);
        }

        // Prevent duplicate return request for same order detail
        if (returnRequestRepo.existsByOrderDetailId(req.getOrderDetailId())) {
            throw new BusinessException("Đã có yêu cầu đổi trả cho sản phẩm này", HttpStatus.CONFLICT);
        }

        // Validate type
        if (!"EXCHANGE".equals(req.getType()) && !"REFUND".equals(req.getType())) {
            throw new BusinessException("Loại đổi trả phải là EXCHANGE hoặc REFUND", HttpStatus.BAD_REQUEST);
        }

        ReturnRequest rr = ReturnRequest.builder()
                .user(user)
                .order(order)
                .orderDetail(orderDetail)
                .type(req.getType())
                .reason(req.getReason())
                .status("PENDING_APPROVAL")
                .build();
        rr = returnRequestRepo.save(rr);
        return toDto(rr);
    }

    /**
     * Gets return requests for current user.
     */
    @Transactional(readOnly = true)
    public Page<ReturnDto> getMyRequests(Long accountId, int page, int size) {
        UserProfile user = userProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "accountId", accountId));
        return returnRequestRepo.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size))
                .map(this::toDto);
    }

    /**
     * Gets all return requests for admin with optional status filter.
     */
    @Transactional(readOnly = true)
    public Page<ReturnDto> getAllRequests(String status, int page, int size) {
        if (status != null) {
            return returnRequestRepo.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size))
                    .map(this::toDto);
        }
        return returnRequestRepo.findAll(PageRequest.of(page, size)).map(this::toDto);
    }

    /**
     * Updates return request status (admin/sales).
     */
    @Transactional
    public ReturnDto updateStatus(Long id, String status, BigDecimal refundAmount) {
        ReturnRequest rr = returnRequestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ReturnRequest", "id", id));
        rr.setStatus(status);
        if (refundAmount != null) {
            rr.setRefundAmount(refundAmount);
        }
        rr = returnRequestRepo.save(rr);
        return toDto(rr);
    }

    private ReturnDto toDto(ReturnRequest rr) {
        return ReturnDto.builder()
                .id(rr.getId())
                .orderId(rr.getOrder().getId())
                .orderDetailId(rr.getOrderDetail().getId())
                .productName(rr.getOrderDetail().getProduct().getName())
                .type(rr.getType())
                .reason(rr.getReason())
                .status(rr.getStatus())
                .refundAmount(rr.getRefundAmount())
                .createdAt(rr.getCreatedAt() != null ? rr.getCreatedAt().toString() : null)
                .build();
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReturnDto {
        private Long id;
        private Long orderId;
        private Long orderDetailId;
        private String productName;
        private String type;
        private String reason;
        private String status;
        private BigDecimal refundAmount;
        private String createdAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ReturnRequestDto {
        private Long orderId;
        private Long orderDetailId;
        private String type;
        private String reason;
    }
}
