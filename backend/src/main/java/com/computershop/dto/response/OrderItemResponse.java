package com.computershop.dto.response;

import com.computershop.entity.OrderItem;
import com.computershop.entity.Product;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemResponse {

    private Long id;

    @JsonProperty("product_id")
    private Long productId;

    @JsonProperty("product_name")
    private String productName;

    @JsonProperty("product_image_url")
    private String productImageUrl;

    @JsonProperty("product_thumbnail")
    private String productThumbnail;

    private Integer quantity;

    @JsonProperty("unit_price")
    private BigDecimal unitPrice;

    @JsonProperty("total_price")
    private BigDecimal totalPrice;

    public static OrderItemResponse fromEntity(OrderItem orderItem) {
        if (orderItem == null) {
            return null;
        }

        String imageUrl = null;
        String thumbnail = null;

        Product product = orderItem.getProduct();
        if (product != null) {
            imageUrl = product.getPrimaryImageUrl();
            thumbnail = product.getPrimaryImageUrl();
        }

        return OrderItemResponse.builder()
                .id(orderItem.getId())
                .productId(orderItem.getProductId())
                .productName(orderItem.getProductName())
                .productImageUrl(imageUrl)
                .productThumbnail(thumbnail)
                .quantity(orderItem.getQuantity())
                .unitPrice(orderItem.getUnitPrice())
                .totalPrice(orderItem.getTotalPrice())
                .build();
    }
}
