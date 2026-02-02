package com.computershop.dto.response;

import com.computershop.entity.Promotion;
import com.computershop.entity.Promotion.DiscountType;
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
public class PromotionResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("description")
    private String description;

    @JsonProperty("discount_type")
    private DiscountType discountType;

    @JsonProperty("discount_value")
    private BigDecimal discountValue;

    @JsonProperty("minimum_order_amount")
    private BigDecimal minimumOrderAmount;

    @JsonProperty("start_date")
    private LocalDateTime startDate;

    @JsonProperty("end_date")
    private LocalDateTime endDate;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    @JsonProperty("is_currently_active")
    private Boolean isCurrentlyActive;

    @JsonProperty("is_expired")
    private Boolean isExpired;

    @JsonProperty("is_not_started")
    private Boolean isNotStarted;

    @JsonProperty("status")
    private String status;

    @JsonProperty("days_until_start")
    private Long daysUntilStart;

    @JsonProperty("days_until_expiry")
    private Long daysUntilExpiry;

    // Thống kê sử dụng (nếu cần)
    @JsonProperty("total_usage")
    private Integer totalUsage;

    @JsonProperty("total_discount_given")
    private BigDecimal totalDiscountGiven;

    public String getDiscountDisplayText() {
        if (discountType == Promotion.DiscountType.PERCENTAGE) {
            return discountValue + "%";
        } else {
            return "$" + discountValue;
        }
    }

    public String getStatusDescription() {
        if (!isActive) {
            return "Inactive";
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startDate)) {
            return "Not Started";
        } else if (now.isAfter(endDate)) {
            return "Expired";
        } else {
            return "Active";
        }
    }
}
