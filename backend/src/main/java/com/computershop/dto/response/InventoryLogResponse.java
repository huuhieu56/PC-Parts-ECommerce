package com.computershop.dto.response;

import com.computershop.entity.InventoryLog;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryLogResponse {

    private Long id;

    @JsonProperty("product_id")
    private Long productId;

    @JsonProperty("product_name")
    private String productName;

    @JsonProperty("change_type")
    private String changeType;

    @JsonProperty("quantity_change")
    private Integer quantityChange;

    private String reason;

    @JsonProperty("performed_by_id")
    private Long performedById;

    @JsonProperty("performed_by_username")
    private String performedByUsername;

    @JsonProperty("created_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime createdAt;

    public static InventoryLogResponse fromEntity(InventoryLog log) {
        if (log == null) return null;

        return InventoryLogResponse.builder()
                .id(log.getId())
                .productId(log.getProduct() != null ? log.getProduct().getId() : null)
                .productName(log.getProduct() != null ? log.getProduct().getName() : null)
                .changeType(log.getChangeType() != null ? log.getChangeType().name() : null)
                .quantityChange(log.getQuantityChange())
                .reason(log.getReason())
                .performedById(log.getPerformedBy() != null ? log.getPerformedBy().getId() : null)
                .performedByUsername(log.getPerformedBy() != null ? log.getPerformedBy().getUsername() : null)
                .createdAt(log.getCreatedAt())
                .build();
    }
}
