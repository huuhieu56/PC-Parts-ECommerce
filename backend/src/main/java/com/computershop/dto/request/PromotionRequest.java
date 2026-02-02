package com.computershop.dto.request;

import com.computershop.entity.Promotion;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRequest {

    @NotBlank(message = "Tên khuyến mãi là bắt buộc")
    @Size(max = 200, message = "Tên khuyến mãi không được vượt quá 200 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    @NotNull(message = "Loại giảm giá là bắt buộc")
    @JsonProperty("discount_type")
    private Promotion.DiscountType discountType;

    @JsonProperty("discount_value")
    @NotNull(message = "Giá trị giảm giá là bắt buộc")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị giảm giá phải lớn hơn 0")
    private BigDecimal discountValue;

    @JsonProperty("minimum_order_amount")
    @DecimalMin(value = "0.0", message = "Giá trị đơn tối thiểu phải lớn hơn hoặc bằng 0")
    private BigDecimal minimumOrderAmount;

    @JsonProperty("start_date")
    @NotNull(message = "Ngày bắt đầu là bắt buộc")
    private LocalDateTime startDate;

    @JsonProperty("end_date")
    @NotNull(message = "Ngày kết thúc là bắt buộc")
    private LocalDateTime endDate;

    private Boolean isActive = true;

    public boolean isValidDateRange() {
        if (startDate != null && endDate != null) {
            return endDate.isAfter(startDate);
        }
        return false;
    }

    public boolean isValidPercentage() {
        if (discountType == Promotion.DiscountType.PERCENTAGE) {
            return discountValue != null &&
                    discountValue.compareTo(BigDecimal.ZERO) > 0 &&
                    discountValue.compareTo(new BigDecimal("100")) <= 0;
        }
        return true;
    }
}
