package com.pcparts.module.product.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for dynamic product filter options per category.
 * Returns available attribute groups, brands, and price range.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterDto {

    private List<AttributeFilterGroup> attributes;
    private List<BrandFilterOption> brands;
    private PriceRangeDto priceRange;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttributeFilterGroup {
        private Long attributeId;
        private String attributeName;
        private List<AttributeValueOption> values;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttributeValueOption {
        private Long valueId;
        private String value;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BrandFilterOption {
        private Long brandId;
        private String brandName;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceRangeDto {
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
    }
}
