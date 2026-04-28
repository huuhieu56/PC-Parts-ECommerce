import type { Banner } from "@/types";
export {
  BANNER_IMAGE_GUIDELINES,
  HOME_BRAND_ROTATION_INTERVAL_MS,
  HOME_BRAND_VISIBLE_ITEM_COUNT,
  HOME_FULL_BLEED_SECTION_CLASSES,
  HOME_FULL_BLEED_SECTION_SPACED_CLASSES,
  HOME_HERO_GRID_COLUMNS_CLASS,
  HOME_HERO_VIEWPORT_CLASSES,
  HOME_SIDE_BANNER_COLUMN_WIDTH_PX,
  HOME_SIDEBAR_COLUMN_WIDTH_PX,
} from "@/lib/banner-layout-config";

const sidePlacements = ["SIDE_1", "SIDE_2", "SIDE_3"] as const;

export interface HomepageBannerLayout {
  mainBanner: Banner | null;
  sideBanners: Banner[];
  popupBanner: Banner | null;
  customBanners: Banner[];
}

export const getHomepageBannerLayout = (banners: Banner[]): HomepageBannerLayout => {
  const mainBanner = banners.find((banner) => banner.placement === "MAIN") ?? null;
  const popupBanner = banners.find((banner) => banner.placement === "POPUP") ?? null;
  const sideBanners = sidePlacements
    .map((placement) => banners.find((banner) => banner.placement === placement) ?? null)
    .filter((banner): banner is Banner => banner !== null);

  const customBanners = banners
    .filter((banner) => banner.placement === "CUSTOM")
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }
      return left.id - right.id;
    });

  return {
    mainBanner,
    sideBanners,
    popupBanner,
    customBanners,
  };
};

export const getPopupDismissStorageKey = (bannerId: number): string =>
  `homepage-popup-dismissed:${bannerId}`;
