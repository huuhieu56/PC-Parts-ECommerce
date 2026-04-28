import type { BannerPlacement } from "@/types";

export const HOME_SIDEBAR_COLUMN_WIDTH_PX = 280;
export const HOME_SIDE_BANNER_COLUMN_WIDTH_PX = 420;

export const HOME_HERO_GRID_COLUMNS_CLASS =
  "xl:grid-cols-[280px_minmax(0,1fr)_420px]";

export const HOME_HERO_VIEWPORT_CLASSES =
  "xl:h-[calc(100svh-166px)] xl:min-h-[560px] xl:max-h-[780px]";

export const HOME_FULL_BLEED_SECTION_CLASSES = "w-full px-3 py-4 sm:px-4 xl:px-3 2xl:px-16";

export const HOME_FULL_BLEED_SECTION_SPACED_CLASSES = "w-full px-3 py-6 sm:px-4 xl:px-3 2xl:px-16";

export const HOME_BRAND_ROTATION_INTERVAL_MS = 5000;
export const HOME_BRAND_VISIBLE_ITEM_COUNT = 8;

export interface BannerImageGuideline {
  recommendedSize: string;
  note: string;
}

const sideBannerGuideline: BannerImageGuideline = {
  recommendedSize: "840 x 480 px",
  note: "Dùng cho 3 banner phụ bên phải trang chủ.",
};

export const BANNER_IMAGE_GUIDELINES: Record<BannerPlacement, BannerImageGuideline> = {
  MAIN: {
    recommendedSize: "1600 x 900 px",
    note: "Dùng cho banner chính trang chủ.",
  },
  SIDE_1: sideBannerGuideline,
  SIDE_2: sideBannerGuideline,
  SIDE_3: sideBannerGuideline,
  POPUP: {
    recommendedSize: "1200 x 675 px",
    note: "Dùng cho popup khuyến mãi.",
  },
  EVENT: {
    recommendedSize: "1200 x 675 px",
    note: "Dùng cho event banner hiện giữa màn hình khi khách truy cập lần đầu.",
  },
  CUSTOM: {
    recommendedSize: "900 x 300 px",
    note: "Dùng cho banner custom ở section khuyến mãi bên dưới.",
  },
};
