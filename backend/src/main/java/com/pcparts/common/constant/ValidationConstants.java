package com.pcparts.common.constant;

import java.util.Set;

/**
 * Validation constants for reuse across the application.
 */
public final class ValidationConstants {

    private ValidationConstants() {
        // Prevent instantiation
    }

    /**
     * Vietnamese phone number regex pattern.
     * Supports formats:
     * - 0xxxxxxxxx (10 digits starting with 03, 05, 07, 08, 09)
     * - 84xxxxxxxxx (country code without +)
     * - +84xxxxxxxxx (country code with +)
     */
    public static final String VIETNAM_PHONE_REGEX = "^(0|84|\\+84)(3|5|7|8|9)[0-9]{8}$";

    public static final String VIETNAM_PHONE_MESSAGE = "Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam (VD: 0987654321)";

    /**
     * Strict email regex requiring a top-level domain.
     * Example valid: user@example.com
     * Example invalid: user@gmail
     */
    public static final String EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

    public static final String EMAIL_MESSAGE = "Email không hợp lệ";

    /**
     * Currently supported shipping province.
     */
    public static final String SUPPORTED_PROVINCE = "Hà Nội";

    /**
     * Hanoi districts - 12 quận, 17 huyện, 1 thị xã.
     */
    public static final Set<String> HANOI_DISTRICTS = Set.of(
        // 12 Quận
        "Quận Ba Đình",
        "Quận Cầu Giấy",
        "Quận Đống Đa",
        "Quận Hai Bà Trưng",
        "Quận Hoàn Kiếm",
        "Quận Thanh Xuân",
        "Quận Hoàng Mai",
        "Quận Long Biên",
        "Quận Hà Đông",
        "Quận Tây Hồ",
        "Quận Nam Từ Liêm",
        "Quận Bắc Từ Liêm",
        // 17 Huyện
        "Huyện Thanh Trì",
        "Huyện Ba Vì",
        "Huyện Đan Phượng",
        "Huyện Gia Lâm",
        "Huyện Đông Anh",
        "Huyện Thường Tín",
        "Huyện Thanh Oai",
        "Huyện Chương Mỹ",
        "Huyện Hoài Đức",
        "Huyện Mỹ Đức",
        "Huyện Phúc Thọ",
        "Huyện Thạch Thất",
        "Huyện Quốc Oai",
        "Huyện Phú Xuyên",
        "Huyện Ứng Hòa",
        "Huyện Mê Linh",
        "Huyện Sóc Sơn",
        // 1 Thị xã
        "Thị xã Sơn Tây"
    );
}
