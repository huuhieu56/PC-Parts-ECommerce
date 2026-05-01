/**
 * Shared validation constants — single source of truth for frontend.
 * Mirrors backend's ValidationConstants.java.
 */

/**
 * Vietnamese phone number regex.
 * Supports: 0xxxxxxxxx, 84xxxxxxxxx, +84xxxxxxxxx
 * Valid prefixes: 03, 05, 07, 08, 09
 */
export const VIETNAM_PHONE_REGEX = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;

export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const SUPPORTED_PROVINCE = "Hà Nội";

/**
 * Hanoi districts — 12 quận, 17 huyện, 1 thị xã.
 * Uses bare names (without "Quận"/"Huyện" prefix) for display.
 */
export const HANOI_DISTRICTS = [
  // 12 Quận
  "Ba Đình",
  "Cầu Giấy",
  "Đống Đa",
  "Hai Bà Trưng",
  "Hoàn Kiếm",
  "Thanh Xuân",
  "Hoàng Mai",
  "Long Biên",
  "Hà Đông",
  "Tây Hồ",
  "Nam Từ Liêm",
  "Bắc Từ Liêm",
  // 17 Huyện
  "Thanh Trì",
  "Ba Vì",
  "Đan Phượng",
  "Gia Lâm",
  "Đông Anh",
  "Thường Tín",
  "Thanh Oai",
  "Chương Mỹ",
  "Hoài Đức",
  "Mỹ Đức",
  "Phúc Thọ",
  "Thạch Thất",
  "Quốc Oai",
  "Phú Xuyên",
  "Ứng Hòa",
  "Mê Linh",
  "Sóc Sơn",
  // 1 Thị xã
  "Sơn Tây",
] as const;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_REVIEW_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Normalizes a district name by stripping "Quận", "Huyện", "Thị xã" prefix.
 */
export const normalizeDistrict = (value: string) =>
  value.toLowerCase().replace("quận ", "").replace("huyện ", "").replace("thị xã ", "").trim();
