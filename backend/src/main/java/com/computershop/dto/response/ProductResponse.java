package com.computershop.dto.response;

import com.computershop.entity.Product;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer quantity;

    @JsonProperty("low_stock_threshold")
    private Integer lowStockThreshold;

    @JsonProperty("image_url")
    private String imageUrl;
    private List<ImageResponse> images;

    private CategoryResponse category;
    private JsonNode specifications;
    private JsonNode attributes;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("is_low_stock")
    private Boolean isLowStock;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    public static ProductResponse fromEntity(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .quantity(product.getQuantity())
                .lowStockThreshold(product.getLowStockThreshold())
                .imageUrl(product.getPrimaryImageUrl())
                .images(product.getImages() != null ? product.getImages().stream().map(ImageResponse::fromEntity).toList() : null)
                .category(product.getCategory() != null ? CategoryResponse.fromEntity(product.getCategory()) : null)
                .specifications(product.getSpecifications())
                .attributes(product.getAttributes())
                .isActive(product.getIsActive())
                .isLowStock(product.isLowStock())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
