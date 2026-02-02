package com.computershop.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeDefinitionRequest {

    @NotBlank(message = "Mã thuộc tính không được để trống")
    @Size(max = 100, message = "Mã thuộc tính không được vượt quá 100 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Mã thuộc tính chỉ được chứa chữ, số, gạch ngang hoặc gạch dưới")
    private String code;

    @NotBlank(message = "Tên hiển thị không được để trống")
    @Size(max = 200, message = "Tên hiển thị không được vượt quá 200 ký tự")
    @JsonProperty("display_name")
    private String displayName;

    @NotBlank(message = "Loại dữ liệu không được để trống")
    @Size(max = 20, message = "Loại dữ liệu không được vượt quá 20 ký tự")
    @JsonProperty("data_type")
    private String dataType;

    @NotBlank(message = "Kiểu nhập liệu không được để trống")
    @Size(max = 30, message = "Kiểu nhập liệu không được vượt quá 30 ký tự")
    @JsonProperty("input_type")
    private String inputType;

    @Size(max = 50, message = "Đơn vị không được vượt quá 50 ký tự")
    private String unit;

    @JsonProperty("sort_order")
    private Integer sortOrder;

    private JsonNode options;

    @JsonProperty("is_active")
    private Boolean isActive;
}
