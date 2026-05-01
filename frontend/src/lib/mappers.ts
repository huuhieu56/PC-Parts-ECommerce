import type { Product } from "@/types";
import type { DisplayProduct } from "@/components/ProductCard";

/**
 * Maps a Product API DTO to the DisplayProduct format used by ProductCard.
 * Single source of truth — replaces duplicate mapProduct/mapApiProduct functions.
 */
export function mapToDisplayProduct(dto: Product): DisplayProduct {
  const discount = dto.originalPrice > dto.sellingPrice
    ? Math.round((1 - dto.sellingPrice / dto.originalPrice) * 100)
    : 0;
  const primaryImage = dto.images?.find((img) => img.isPrimary) || dto.images?.[0];
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    sku: dto.sku,
    price: dto.sellingPrice,
    originalPrice: dto.originalPrice > dto.sellingPrice ? dto.originalPrice : null,
    brandName: dto.brandName,
    discountPercent: discount,
    thumbnailUrl: primaryImage?.imageUrl || null,
  };
}
