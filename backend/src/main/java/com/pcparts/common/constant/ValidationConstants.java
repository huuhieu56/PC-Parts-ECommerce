package com.pcparts.common.constant;

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
}
