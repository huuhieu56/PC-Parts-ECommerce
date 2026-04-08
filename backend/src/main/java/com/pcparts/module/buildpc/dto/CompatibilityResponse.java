package com.pcparts.module.buildpc.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for PC compatibility check result.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompatibilityResponse {

    private boolean compatible;
    private BigDecimal totalPrice;
    private String analysis;
    private List<String> warnings;
    private List<Suggestion> suggestions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Suggestion {
        private String slot;
        private String reason;
        private List<RecommendedProduct> recommended;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedProduct {
        private Long productId;
        private String name;
        private BigDecimal price;
    }
}
