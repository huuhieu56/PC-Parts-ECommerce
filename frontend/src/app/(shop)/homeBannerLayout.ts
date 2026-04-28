import type { Banner } from "@/types";

const sidePlacements = ["SIDE_1", "SIDE_2", "SIDE_3"] as const;

export interface HomepageBannerLayout {
  mainBanner: Banner | null;
  sideBanners: Banner[];
  popupBanner: Banner | null;
  customBanners: Banner[];
}

export const HOME_HERO_VIEWPORT_CLASSES =
  "xl:h-[calc(100svh-166px)] xl:min-h-[560px] xl:max-h-[780px]";

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
