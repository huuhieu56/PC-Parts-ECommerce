package com.pcparts.module.buildpc.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for PC compatibility check.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompatibilityRequest {

    @NotEmpty(message = "Danh sách linh kiện không được trống")
    @Valid
    private List<ComponentItem> components;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComponentItem {
        @NotNull(message = "slotId không được null")
        private Integer slotId;

        @NotNull(message = "productId không được null")
        private Long productId;
    }
}
