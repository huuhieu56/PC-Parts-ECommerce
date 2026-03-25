package com.pcparts.module.product.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO for brand operations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandDto {
    private Long id;

    @NotBlank(message = "Tên thương hiệu không được để trống")
    private String name;

    private String logoUrl;
    private String description;
}
