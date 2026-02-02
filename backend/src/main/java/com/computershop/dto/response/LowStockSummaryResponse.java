package com.computershop.dto.response;

import com.computershop.entity.Product;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockSummaryResponse {

    @JsonProperty("low_stock_products")
    private List<InventoryResponse> lowStockProducts;

    @JsonProperty("out_of_stock_products")
    private List<InventoryResponse> outOfStockProducts;

    @JsonProperty("need_restock_products")
    private List<InventoryResponse> needRestockProducts;

    @JsonProperty("total_low_stock")
    private Integer totalLowStock;

    @JsonProperty("total_out_of_stock")
    private Integer totalOutOfStock;

    @JsonProperty("total_need_restock")
    private Integer totalNeedRestock;

    // Tạo tổng hợp từ danh sách sản phẩm
    public static LowStockSummaryResponse fromProducts(
            List<Product> lowStockProducts,
            List<Product> outOfStockProducts,
            List<Product> needRestockProducts) {

        return LowStockSummaryResponse.builder()
                .lowStockProducts(lowStockProducts.stream()
                        .map(InventoryResponse::fromEntity)
                        .collect(Collectors.toList()))
                .outOfStockProducts(outOfStockProducts.stream()
                        .map(InventoryResponse::fromEntity)
                        .collect(Collectors.toList()))
                .needRestockProducts(needRestockProducts.stream()
                        .map(InventoryResponse::fromEntity)
                        .collect(Collectors.toList()))
                .totalLowStock(lowStockProducts.size())
                .totalOutOfStock(outOfStockProducts.size())
                .totalNeedRestock(needRestockProducts.size())
                .build();
    }

    // Tạo tổng hợp từ danh sách InventoryResponse (DTO) — dùng khi service đã trả về DTO
    public static LowStockSummaryResponse fromResponses(
            List<InventoryResponse> lowStockProducts,
            List<InventoryResponse> outOfStockProducts,
            List<InventoryResponse> needRestockProducts) {

        return LowStockSummaryResponse.builder()
                .lowStockProducts(lowStockProducts)
                .outOfStockProducts(outOfStockProducts)
                .needRestockProducts(needRestockProducts)
                .totalLowStock(lowStockProducts.size())
                .totalOutOfStock(outOfStockProducts.size())
                .totalNeedRestock(needRestockProducts.size())
                .build();
    }
}
