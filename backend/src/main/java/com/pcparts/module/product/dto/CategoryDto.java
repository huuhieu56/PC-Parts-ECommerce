package com.pcparts.module.product.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

/**
 * DTO for category operations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private Long id;

    @NotBlank(message = "Tên danh mục không được để trống")
    private String name;

    private String description;
    private Long parentId;
    private Integer level;
    private List<CategoryDto> children;
}
