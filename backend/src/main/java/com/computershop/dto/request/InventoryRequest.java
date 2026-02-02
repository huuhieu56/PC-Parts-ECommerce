package com.computershop.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryRequest {

    @NotBlank(message = "Bắt buộc phải có loại thay đổi")
    @JsonProperty("change_type")
    private String changeType; // "IN" | "OUT"

    @NotNull(message = "Bắt buộc phải có số lượng")
    @Min(value = 1, message = "Số lượng phải là số dương")
    private Integer quantity;

    @NotBlank(message = "Bắt buộc phải có lý do")
    private String reason;

    @NotNull(message = "Bắt buộc phải có người thực hiện")
    @JsonProperty("performed_by_id")
    private Long performedById;
}
