package com.pcparts.module.content.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Response DTO for homepage banner/slider data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BannerDto {
    private Long id;
    private String title;
    private String imageUrl;
    private String linkUrl;
    private String placement;
    private Integer sortOrder;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
