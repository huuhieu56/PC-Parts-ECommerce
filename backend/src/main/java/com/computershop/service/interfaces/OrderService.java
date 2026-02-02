package com.computershop.service.interfaces;

import com.computershop.dto.request.OrderRequest;
import com.computershop.dto.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {


    Page<OrderResponse> getAllOrders(Pageable pageable);


    Page<OrderResponse> getAllOrders(Pageable pageable, String search);


    Page<OrderResponse> getOrdersByUser(Long userId, Pageable pageable);


    OrderResponse getOrderById(Long id);


    OrderResponse getOrderByCode(String orderCode);


    Page<OrderResponse> getOrdersByStatus(String status, Pageable pageable);

    OrderResponse createOrderFromCart(Long userId, OrderRequest request);


    OrderResponse updateOrderStatus(Long id, String status);


    OrderResponse cancelOrder(Long id);


    Page<OrderResponse> getOrdersByDateRange(String startDate, String endDate, Pageable pageable);


    Double getTotalRevenue();


    Long countOrdersByStatus(String status);


    boolean isOrderOwner(Long orderId, Long userId);
}
