import type { Banner } from "@/types";

export interface BannerDropResult {
  draggedId: number | null;
  reorderedBanners: Banner[] | null;
}

export const applyBannerDrop = (
  banners: Banner[],
  draggedId: number | null,
  targetId: number,
): BannerDropResult => {
  if (draggedId === null || draggedId === targetId) {
    return { draggedId: null, reorderedBanners: null };
  }

  const current = [...banners];
  const fromIndex = current.findIndex((banner) => banner.id === draggedId);
  const toIndex = current.findIndex((banner) => banner.id === targetId);

  if (fromIndex < 0 || toIndex < 0) {
    return { draggedId: null, reorderedBanners: null };
  }

  const [moved] = current.splice(fromIndex, 1);
  current.splice(toIndex, 0, moved);

  return {
    draggedId: null,
    reorderedBanners: current.map((banner, index) => ({ ...banner, sortOrder: index + 1 })),
  };
};
