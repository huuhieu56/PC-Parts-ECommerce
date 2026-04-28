import { describe, expect, it } from "vitest";
import {
  HOME_FULL_BLEED_SECTION_CLASSES,
  HOME_HERO_VIEWPORT_CLASSES,
  getHomepageBannerLayout,
  getPopupDismissStorageKey,
} from "@/app/(shop)/homeBannerLayout";
import type { Banner, BannerPlacement } from "@/types";

const makeBanner = (id: number, placement: BannerPlacement, sortOrder: number): Banner => ({
  id,
  title: `Banner ${id}`,
  imageUrl: `https://cdn.example.com/${id}.webp`,
  linkUrl: `/banners/${id}`,
  placement,
  sortOrder,
  status: "ACTIVE",
  startDate: null,
  endDate: null,
  createdAt: null,
  updatedAt: null,
});

describe("homepage banner layout", () => {
  it("should split banners into main, side, popup, and sorted custom groups", () => {
    const layout = getHomepageBannerLayout([
      makeBanner(10, "CUSTOM", 3),
      makeBanner(2, "SIDE_2", 0),
      makeBanner(1, "MAIN", 0),
      makeBanner(11, "CUSTOM", 1),
      makeBanner(4, "POPUP", 0),
      makeBanner(3, "SIDE_3", 0),
      makeBanner(12, "CUSTOM", 1),
      makeBanner(5, "SIDE_1", 0),
    ]);

    expect(layout.mainBanner?.id).toBe(1);
    expect(layout.popupBanner?.id).toBe(4);
    expect(layout.sideBanners.map((banner) => banner.id)).toEqual([5, 2, 3]);
    expect(layout.customBanners.map((banner) => banner.id)).toEqual([11, 12, 10]);
  });

  it("should build a stable popup dismiss key per banner id", () => {
    expect(getPopupDismissStorageKey(77)).toBe("homepage-popup-dismissed:77");
  });

  it("should keep the desktop hero area pinned to the first viewport", () => {
    expect(HOME_HERO_VIEWPORT_CLASSES).toContain("xl:h-[calc(100svh-166px)]");
    expect(HOME_HERO_VIEWPORT_CLASSES).toContain("xl:min-h-[560px]");
  });

  it("should keep reduced desktop gutters without restoring max-width containers", () => {
    expect(HOME_FULL_BLEED_SECTION_CLASSES).toContain("w-full");
    expect(HOME_FULL_BLEED_SECTION_CLASSES).toContain("xl:px-3");
    expect(HOME_FULL_BLEED_SECTION_CLASSES).toContain("2xl:px-16");
    expect(HOME_FULL_BLEED_SECTION_CLASSES).not.toContain("max-w-7xl");
    expect(HOME_FULL_BLEED_SECTION_CLASSES).not.toContain("mx-auto");
  });
});
