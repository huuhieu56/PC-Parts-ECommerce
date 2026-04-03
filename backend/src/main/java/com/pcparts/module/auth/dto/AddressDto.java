package com.pcparts.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import static com.pcparts.common.constant.ValidationConstants.VIETNAM_PHONE_MESSAGE;
import static com.pcparts.common.constant.ValidationConstants.VIETNAM_PHONE_REGEX;

/**
 * DTO for shipping address.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {

    private Long id;

    private String label;

    @NotBlank(message = "Tên người nhận không được để trống")
    private String receiverName;

    @NotBlank(message = "SĐT người nhận không được để trống")
    @Pattern(regexp = VIETNAM_PHONE_REGEX, message = VIETNAM_PHONE_MESSAGE)
    private String receiverPhone;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String ward;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String street;

    private Boolean isDefault;
}
