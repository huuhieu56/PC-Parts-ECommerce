import { describe, expect, it } from "vitest";
import { applyBannerDrop } from "@/app/(admin)/admin/banners/bannerReorder";
import type { Banner } from "@/types";

const makeBanner = (id: number, title: string, sortOrder: number): Banner => ({
  id,
  title,
  imageUrl: `https://cdn.example.com/banners/${id}.webp`,
  linkUrl: null,
  sortOrder,
  status: "ACTIVE",
  startDate: null,
  endDate: null,
  createdAt: null,
  updatedAt: null,
});

describe("applyBannerDrop", () => {
  it("should reorder banners and normalize sort order when drop is valid", () => {
    const banners = [
      makeBanner(1, "Banner 1", 1),
      makeBanner(2, "Banner 2", 2),
      makeBanner(3, "Banner 3", 3),
    ];

    const result = applyBannerDrop(banners, 3, 1);

    expect(result.draggedId).toBeNull();
    expect(result.reorderedBanners?.map((banner) => [banner.id, banner.sortOrder])).toEqual([
      [3, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  it("should clear dragged state when drop becomes invalid", () => {
    const banners = [
      makeBanner(1, "Banner 1", 1),
      makeBanner(2, "Banner 2", 2),
    ];

    const result = applyBannerDrop(banners, 99, 2);

    expect(result).toEqual({
      draggedId: null,
      reorderedBanners: null,
    });
  });
});
