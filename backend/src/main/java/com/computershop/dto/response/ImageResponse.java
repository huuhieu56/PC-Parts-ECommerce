package com.computershop.dto.response;

import com.computershop.entity.ProductImage;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageResponse {
    private Long id;

    @JsonProperty("file_path")
    private String filePath;

    @JsonProperty("is_primary")
    private Boolean isPrimary;

    public static ImageResponse fromEntity(ProductImage img) {
        return ImageResponse.builder()
                .id(img.getId())
                .filePath(img.getFilePath())
                .isPrimary(img.getIsPrimary())
                .build();
    }
}
