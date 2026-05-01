package com.pcparts.module.order.service;

import com.pcparts.module.auth.entity.Address;
import com.pcparts.module.order.dto.OrderDto;
import com.pcparts.module.order.entity.Order;
import com.pcparts.module.order.repository.OrderDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Maps Order entities to OrderDto.
 * Extracted from OrderService to separate DTO mapping from business logic.
 */
@Component
@RequiredArgsConstructor
public class OrderMapper {

    private final OrderDetailRepository orderDetailRepository;

    public OrderDto toDto(Order order) {
        List<OrderDto.OrderDetailDto> detailDtos = orderDetailRepository.findByOrderId(order.getId()).stream()
                .map(d -> OrderDto.OrderDetailDto.builder()
                        .id(d.getId())
                        .productId(d.getProduct().getId())
                        .productName(d.getProduct().getName())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .lineTotal(d.getLineTotal())
                        .build())
                .collect(Collectors.toList());
        // Build shipping address from Address entity
        Address addr = order.getAddress();
        String recipientName = null;
        String recipientPhone = null;
        String shippingAddress = null;
        if (addr != null) {
            recipientName = addr.getReceiverName();
            recipientPhone = addr.getReceiverPhone();
            shippingAddress = String.join(", ",
                    addr.getStreet() != null ? addr.getStreet() : "",
                    addr.getWard() != null ? addr.getWard() : "",
                    addr.getDistrict() != null ? addr.getDistrict() : "",
                    addr.getProvince() != null ? addr.getProvince() : ""
            ).replaceAll("^,\\s*|,\\s*$", "").replaceAll(",\\s*,", ",");
        }

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(String.format("ORD-%06d", order.getId()))
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .note(order.getNote())
                .recipientName(recipientName)
                .recipientPhone(recipientPhone)
                .shippingAddress(shippingAddress)
                .paymentMethod("COD")
                .paymentStatus("PENDING")
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null)
                .itemCount(detailDtos.size())
                .items(detailDtos)
                .build();
    }
}
