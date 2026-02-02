package com.computershop.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequest {

    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    @Size(max = 500, message = "Địa chỉ giao hàng không được vượt quá 500 ký tự")
    @JsonProperty("shipping_address")
    private String shippingAddress;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String notes;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    @JsonProperty("shipping_phone")
    private String shippingPhone;

    @Size(max = 100, message = "Tên khách hàng không được vượt quá 100 ký tự")
    @JsonProperty("customer_name")
    private String customerName;

    @Size(max = 100, message = "Email khách hàng không được vượt quá 100 ký tự")
    @JsonProperty("customer_email")
    private String customerEmail;

    @JsonProperty("promotion_id")
    private Long promotionId;
}
