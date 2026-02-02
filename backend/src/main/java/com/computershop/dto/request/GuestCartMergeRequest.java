package com.computershop.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestCartMergeRequest {

    @NotEmpty(message = "Giỏ hàng guest không được rỗng")
    @Valid
    private List<GuestCartItem> guestCartItems;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GuestCartItem {

        @NotNull(message = "Product ID không được null")
        @Positive(message = "Product ID phải là số dương")
        @JsonProperty("product_id")
        private Long productId;

        @NotNull(message = "Số lượng không được null")
        @Positive(message = "Số lượng phải lớn hơn 0")
        private Integer quantity;
    }
}
