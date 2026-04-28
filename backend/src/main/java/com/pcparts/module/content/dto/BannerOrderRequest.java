package com.pcparts.module.content.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Request item for updating banner display order.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerOrderRequest {

    @NotNull(message = "Banner id không được để trống")
    private Long id;

    @NotNull(message = "Thứ tự hiển thị không được để trống")
    private Integer sortOrder;
}
