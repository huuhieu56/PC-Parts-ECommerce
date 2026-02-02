package com.computershop.dto.response;

import com.computershop.entity.Product;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryResponse {

    @JsonProperty("product_id")
    private Long productId;

    @JsonProperty("product_name")
    private String productName;

    @JsonProperty("category_name")
    private String categoryName;
    private BigDecimal price;

    // Chỉ giữ thông tin sản phẩm cơ bản; tồn kho lưu trong log nên bỏ các trường chi tiết.
    @JsonProperty("low_stock_threshold")
    private Integer lowStockThreshold;

    @JsonProperty("last_updated")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastUpdated;

    public static InventoryResponse fromEntity(Product product) {
        if (product == null) {
            return null;
        }

        return InventoryResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .price(product.getPrice())
                .lowStockThreshold(product.getLowStockThreshold())
                .lastUpdated(product.getUpdatedAt())
                .build();
    }
}
