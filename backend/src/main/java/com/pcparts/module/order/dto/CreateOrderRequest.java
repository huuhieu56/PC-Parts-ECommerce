package com.pcparts.module.order.dto;

import jakarta.validation.Valid;
import lombok.*;

import static com.pcparts.common.constant.ValidationConstants.VIETNAM_PHONE_REGEX;
import static com.pcparts.common.constant.ValidationConstants.VIETNAM_PHONE_MESSAGE;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request payload for creating a new order from the user's cart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    private Long addressId;
    @Valid
    private ShippingAddressRequest shippingAddress;
    private String note;
    private String couponCode;
    private String paymentMethod;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingAddressRequest {
        @NotBlank(message = "Tên người nhận không được để trống")
        private String receiverName;

        @NotBlank(message = "SĐT người nhận không được để trống")
        @Pattern(regexp = VIETNAM_PHONE_REGEX, message = VIETNAM_PHONE_MESSAGE)
        private String receiverPhone;

        @NotBlank(message = "Tỉnh/Thành phố không được để trống")
        private String province;

        @NotBlank(message = "Quận/Huyện không được để trống")
        private String district;

        private String ward;

        @NotBlank(message = "Địa chỉ không được để trống")
        private String street;
    }
}
