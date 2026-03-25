package com.pcparts.module.order.controller;

import com.pcparts.common.dto.ApiResponse;
import com.pcparts.common.dto.PageResponse;
import com.pcparts.module.order.service.OrderService;
import com.pcparts.module.order.service.OrderService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for order operations.
 */
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Create an order from cart.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            Authentication auth,
            @RequestBody CreateOrderRequest request) {
        Long accountId = Long.parseLong(auth.getName());
        OrderDto order = orderService.createOrder(accountId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt hàng thành công", order));
    }

    /**
     * Get order detail.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrder(
            Authentication auth, @PathVariable Long id) {
        Long accountId = Long.parseLong(auth.getName());
        OrderDto order = orderService.getOrderById(id, accountId);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết đơn hàng", order));
    }

    /**
     * List my orders.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OrderDto>>> getMyOrders(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long accountId = Long.parseLong(auth.getName());
        PageResponse<OrderDto> result = orderService.getMyOrders(accountId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Danh sách đơn hàng", result));
    }

    /**
     * Update order status (admin/sales).
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<ApiResponse<OrderDto>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication auth) {
        OrderDto order = orderService.updateStatus(id, status, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", order));
    }

    /**
     * List all orders (admin).
     */
    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<ApiResponse<PageResponse<OrderDto>>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<OrderDto> result = orderService.getAllOrders(status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Tất cả đơn hàng", result));
    }
}
