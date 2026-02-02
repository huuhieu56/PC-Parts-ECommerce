package com.computershop.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 200, message = "Tên sản phẩm không được vượt quá 200 ký tự")
    private String name;

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    private String description;

    @NotNull(message = "Giá sản phẩm không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá sản phẩm phải không âm")
    private BigDecimal price;

    @Min(value = 0, message = "Số lượng không được âm")
    private Integer quantity;

    @JsonProperty("low_stock_threshold")
    @Min(value = 0, message = "Ngưỡng cảnh báo không được âm")
    private Integer lowStockThreshold;


    @JsonProperty("category_id")
    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    private JsonNode specifications;

    // Thuộc tính động theo category, lưu ở cột JSONB products.attributes
    private JsonNode attributes;
}
