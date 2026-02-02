package com.computershop.dto.response;

import com.computershop.entity.AttributeDefinition;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeDefinitionResponse {

    private Long id;

    @JsonProperty("category_id")
    private Long categoryId;

    private String code;

    @JsonProperty("display_name")
    private String displayName;

    @JsonProperty("data_type")
    private String dataType;

    @JsonProperty("input_type")
    private String inputType;

    private String unit;
    @JsonProperty("sort_order")

    private Integer sortOrder;

    private JsonNode options;

    @JsonProperty("is_active")
    private Boolean isActive;

    public static AttributeDefinitionResponse fromEntity(AttributeDefinition def) {
        return AttributeDefinitionResponse.builder()
                .id(def.getId())
                .categoryId(def.getCategory() != null ? def.getCategory().getId() : null)
                .code(def.getCode())
                .displayName(def.getDisplayName())
                .dataType(def.getDataType())
                .inputType(def.getInputType())
                .unit(def.getUnit())
                .sortOrder(def.getSortOrder())
                .options(def.getOptions())
                .isActive(def.getIsActive())
                .build();
    }
}
