"use client";

import Link from "next/link";
import { Cpu, Monitor, MemoryStick, HardDrive, Zap, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight, Truck, Shield, Headphones, Check, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useCartStore } from "@/stores/cart-store";
import api, { getBanners } from "@/lib/api";
import type { Banner } from "@/types";
import {
  HOME_BRAND_ROTATION_INTERVAL_MS,
  HOME_BRAND_VISIBLE_ITEM_COUNT,
  HOME_FULL_BLEED_SECTION_CLASSES,
  HOME_FULL_BLEED_SECTION_SPACED_CLASSES,
  HOME_HERO_GRID_COLUMNS_CLASS,
  HOME_HERO_VIEWPORT_CLASSES,
  getEventBannerDismissStorageKey,
  getHomepageBannerLayout,
  getPopupDismissStorageKey,
} from "./homeBannerLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";

interface ProductDto {
  id: number;
  name: string;
  sku: string;
  slug: string;
  originalPrice: number;
  sellingPrice: number;
  categoryName: string;
  brandName: string;
  images: { id: number; imageUrl: string; isPrimary: boolean; sortOrder: number }[];
}

interface DisplayProduct {
  id: number;
  name: string;
  sku: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  discount: number;
  inStock: boolean;
  image: string | null;
  brandName: string;
}

const categoryColors = [
  "bg-blue-50 text-blue-600 border-blue-200",
  "bg-emerald-50 text-emerald-600 border-emerald-200",
  "bg-purple-50 text-purple-600 border-purple-200",
  "bg-amber-50 text-amber-600 border-amber-200",
  "bg-red-50 text-red-600 border-red-200",
  "bg-cyan-50 text-cyan-600 border-cyan-200",
  "bg-orange-50 text-orange-600 border-orange-200",
  "bg-indigo-50 text-indigo-600 border-indigo-200",
];
const categoryIcons = [Cpu, Monitor, MemoryStick, HardDrive, Zap, Zap, Monitor, Zap];

const defaultCategories = [
  { name: "CPU", icon: Cpu, href: "/products?category=cpu", color: categoryColors[0] },
  { name: "Mainboard", icon: Monitor, href: "/products?category=mainboard", color: categoryColors[1] },
  { name: "RAM", icon: MemoryStick, href: "/products?category=ram", color: categoryColors[2] },
  { name: "SSD/HDD", icon: HardDrive, href: "/products?category=ssd", color: categoryColors[3] },
  { name: "VGA", icon: Zap, href: "/products?category=vga", color: categoryColors[4] },
  { name: "Nguồn", icon: Zap, href: "/products?category=psu", color: categoryColors[5] },
  { name: "Case", icon: Monitor, href: "/products?category=case", color: categoryColors[6] },
  { name: "Tản nhiệt", icon: Zap, href: "/products?category=cooling", color: categoryColors[7] },
];

interface CategoryDisplay {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  href: string;
  color: string;
}

const promoBanners = [
  { title: "TBVP", sub: "Giảm tới 32%", gradient: "from-red-500 to-orange-400" },
  { title: "MÀN HÌNH", sub: "Giảm 1 Triệu", gradient: "from-blue-500 to-cyan-400" },
  { title: "GEAR", sub: "Giảm 50%", gradient: "from-fuchsia-500 to-purple-500" },
];

const defaultBrands = ["Intel", "AMD", "ASUS", "GIGABYTE", "MSI", "CORSAIR", "Kingston", "Samsung", "Western Digital", "NZXT"];

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + " đ";
}

function ProductCard({ product, onAddToCart }: { product: DisplayProduct; onAddToCart: (productId: number) => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await onAddToCart(product.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch { /* empty */ } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 p-4">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-contain rounded-md transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center">
            <Cpu className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {product.discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
            -{product.discount}%
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-3 gap-2">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-md shadow-sm hover:bg-white transition-all cursor-pointer active:scale-95">
            Xem chi tiết
          </span>
          <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); try { await api.post(`/wishlist/${product.id}`); } catch { /* need login */ } }} className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-md shadow-sm hover:bg-white transition-all cursor-pointer active:scale-95">
            ❤️ Thích
          </button>
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 mb-1">Mã SP: {product.sku}</p>
        <p className="text-xs text-gray-500 mb-1.5">{product.brandName}</p>
        <div className="mt-2">
          {product.oldPrice && (
            <p className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</p>
          )}
          <p className="text-[#E31837] font-bold text-base">{formatPrice(product.price)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs text-green-600 flex items-center gap-0.5">✓ Còn hàng</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
              added
                ? "bg-green-500 text-white scale-110"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-md text-white"
            }`}
            title="Thêm vào giỏ hàng"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : added ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function mapApiProduct(dto: ProductDto): DisplayProduct {
  const discount = dto.originalPrice > dto.sellingPrice
    ? Math.round((1 - dto.sellingPrice / dto.originalPrice) * 100)
    : 0;
  const primaryImage = dto.images?.find((img) => img.isPrimary) || dto.images?.[0];
  return {
    id: dto.id,
    name: dto.name,
    sku: dto.sku,
    slug: dto.slug,
    price: dto.sellingPrice,
    oldPrice: dto.originalPrice > dto.sellingPrice ? dto.originalPrice : null,
    discount,
    inStock: true,
    image: primaryImage?.imageUrl || null,
    brandName: dto.brandName,
  };
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryDisplay[]>(defaultCategories);
  const [brands, setBrands] = useState<string[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showPopupBanner, setShowPopupBanner] = useState(false);
  const [showEventBanner, setShowEventBanner] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [brandStartIndex, setBrandStartIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = useCallback(async (productId: number) => {
    await addItem(productId, 1);
  }, [addItem]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`${API_URL}/products?page=0&size=10&sort=createdAt`);
        if (res.ok) {
          const json = await res.json();
          const pageData = json.data || json;
          const items: ProductDto[] = pageData.content || [];
          setFeaturedProducts(items.map(mapApiProduct));
        }
      } catch {
        console.error("Failed to fetch featured products");
      } finally {
        setLoading(false);
      }
    }

    async function fetchCategories() {
      try {
        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          const items = Array.isArray(data) ? data : (data.content || []);
          if (items.length > 0) {
            setCategories(items.map((c: { id: number; name: string; slug?: string }, idx: number) => ({
              name: c.name,
              icon: categoryIcons[idx % categoryIcons.length],
              href: `/products?categoryId=${c.id}`,
              color: categoryColors[idx % categoryColors.length],
            })));
          }
        }
      } catch { /* fallback to defaults */ }
    }

    async function fetchBrands() {
      try {
        const res = await fetch(`${API_URL}/brands`);
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          const items = Array.isArray(data) ? data : (data.content || []);
          if (items.length > 0) {
            setBrands(items.map((b: { name: string }) => b.name));
          }
        }
      } catch { /* fallback */ }
    }

    async function fetchBanners() {
      try {
        const data = await getBanners();
        setBanners(data);
      } catch { /* fallback to static hero */ }
    }

    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchBanners();
  }, []);

  useEffect(() => {
    const { eventBanner, popupBanner } = getHomepageBannerLayout(banners);
    if (typeof window === "undefined") {
      return;
    }

    if (eventBanner) {
      const dismissKey = getEventBannerDismissStorageKey(eventBanner.id);
      if (!window.localStorage.getItem(dismissKey)) {
        setShowEventBanner(true);
        return;
      }
    }

    if (!popupBanner) {
      return;
    }

    const dismissKey = getPopupDismissStorageKey(popupBanner.id);
    if (!window.localStorage.getItem(dismissKey)) {
      setShowPopupBanner(true);
    }
  }, [banners]);

  const { mainBanner, sideBanners, popupBanner, eventBanner, customBanners } = getHomepageBannerLayout(banners);
  const sideBannerSlots = Array.from({ length: 3 }, (_, index) => sideBanners[index] ?? null);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 8);
  const brandItems = useMemo(() => brands.length > 0 ? brands : defaultBrands, [brands]);
  const visibleBrandItems = useMemo(() => {
    const visibleCount = Math.min(HOME_BRAND_VISIBLE_ITEM_COUNT, brandItems.length);
    return Array.from({ length: visibleCount }, (_, index) => brandItems[(brandStartIndex + index) % brandItems.length]);
  }, [brandItems, brandStartIndex]);
  const canExpandCategories = categories.length > 8;

  useEffect(() => {
    if (brandItems.length <= HOME_BRAND_VISIBLE_ITEM_COUNT) {
      return;
    }

    const timer = window.setInterval(() => {
      setBrandStartIndex((current) => (current + 1) % brandItems.length);
    }, HOME_BRAND_ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [brandItems.length]);

  const rotateBrands = (direction: 1 | -1) => {
    setBrandStartIndex((current) => (current + direction + brandItems.length) % brandItems.length);
  };

  const dismissPopupBanner = () => {
    if (popupBanner && typeof window !== "undefined") {
      window.localStorage.setItem(getPopupDismissStorageKey(popupBanner.id), "1");
    }
    setShowPopupBanner(false);
  };

  const dismissEventBanner = () => {
    if (eventBanner && typeof window !== "undefined") {
      window.localStorage.setItem(getEventBannerDismissStorageKey(eventBanner.id), "1");
    }
    setShowEventBanner(false);
  };

  return (
    <div className="bg-gray-50">
      {showEventBanner && eventBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-4xl rounded-[1.75rem] bg-white/10 p-2 shadow-[0_0_40px_rgba(255,255,255,0.25)] ring-1 ring-white/35 backdrop-blur-sm">
            <button
              type="button"
              onClick={dismissEventBanner}
              className="absolute -right-3 -top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-red-600 text-white shadow-lg transition hover:bg-red-700"
              aria-label="Đóng event banner"
            >
              <span className="text-3xl font-bold leading-none">×</span>
            </button>
            <Link href={eventBanner.linkUrl || "/products"} onClick={dismissEventBanner} className="block overflow-hidden rounded-[1.35rem] bg-white">
              <img
                src={eventBanner.imageUrl}
                alt={eventBanner.title}
                className="h-auto max-h-[78vh] w-full object-contain"
              />
            </Link>
          </div>
        </div>
      )}

      {!showEventBanner && showPopupBanner && popupBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={dismissPopupBanner}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
              aria-label="Đóng banner popup"
            >
              <span className="text-lg leading-none">×</span>
            </button>
            <Link href={popupBanner.linkUrl || "/products"} onClick={dismissPopupBanner} className="block">
              <img
                src={popupBanner.imageUrl}
                alt={popupBanner.title}
                className="h-auto max-h-[80vh] w-full object-cover"
              />
            </Link>
          </div>
        </div>
      )}

      {/* Hero Banner + Sidebar */}
      <section className={HOME_FULL_BLEED_SECTION_CLASSES}>
        <div className={`grid grid-cols-1 gap-4 xl:items-stretch ${HOME_HERO_GRID_COLUMNS_CLASS} ${HOME_HERO_VIEWPORT_CLASSES}`}>
          <aside className="order-2 xl:order-1 xl:h-full xl:min-h-0">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:flex xl:h-full xl:min-h-0 xl:flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#1A4B9C]">Danh mục</h2>
                {canExpandCategories && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((value) => !value)}
                    aria-expanded={showAllCategories}
                    className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                  >
                    {showAllCategories ? "Thu gọn" : "Xem thêm"}
                  </button>
                )}
              </div>
              <div className="p-3 xl:min-h-0 xl:flex-1">
                <div className="grid grid-cols-2 gap-2 xl:h-full xl:grid-cols-1 xl:overflow-y-auto xl:pr-1">
                  {visibleCategories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-all hover:shadow-sm ${cat.color}`}
                    >
                      <cat.icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {mainBanner ? (
            <Link
              href={mainBanner.linkUrl || "/products"}
              className="order-1 xl:order-2 relative flex min-h-[320px] overflow-hidden rounded-2xl bg-[#1A4B9C] text-white group xl:h-full xl:min-h-0"
            >
              <img
                src={mainBanner.imageUrl}
                alt={mainBanner.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </Link>
          ) : (
            <div className="order-1 xl:order-2 relative flex min-h-[320px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A4B9C] to-[#2563EB] text-white xl:h-full xl:min-h-0">
              <div className="flex-1 p-8 flex flex-col justify-center">
                <span className="text-amber-400 text-sm font-semibold mb-2 uppercase tracking-wide">Sản phẩm HOT</span>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
                  Linh kiện chính hãng<br />
                  <span className="text-amber-400">Giá tốt nhất</span>
                </h1>
                <p className="text-white/80 mb-6 text-sm">
                  CPU, GPU, RAM, SSD từ Intel, AMD, NVIDIA — Bảo hành chính hãng
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/products"
                    className="bg-[#E31837] hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    MUA NGAY
                  </Link>
                  <Link
                    href="/build-pc"
                    className="bg-white/15 hover:bg-white/25 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all backdrop-blur-sm border border-white/20 active:scale-95 cursor-pointer"
                  >
                    BUILD PC
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center pr-8 opacity-30">
                <Cpu className="w-48 h-48" />
              </div>
            </div>
          )}

          <div className="order-3 flex flex-col gap-4 xl:h-full xl:min-h-0">
            {sideBannerSlots.map((banner, index) => banner ? (
              <Link key={banner.id} href={banner.linkUrl || "/products"} className="relative flex-1 min-h-[130px] overflow-hidden rounded-2xl bg-gray-900 text-white group xl:min-h-0">
                <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </Link>
            ) : (
              <div
                key={`side-placeholder-${index}`}
                className={`flex-1 rounded-2xl overflow-hidden text-white p-5 flex flex-col justify-center min-h-[130px] xl:min-h-0 ${
                  index === 0
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : index === 1
                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                      : "bg-gradient-to-r from-fuchsia-500 to-purple-500"
                }`}
              >
                <p className="text-sm font-semibold opacity-90 mb-1">
                  {index === 0 ? "BUILD PC" : index === 1 ? "LAPTOP" : "GEAR"}
                </p>
                <p className="text-2xl font-bold">
                  {index === 0 ? "Giảm lên đến 30tr" : index === 1 ? "Giảm thêm 1 Triệu" : "Quà tặng tới 50%"}
                </p>
                <Link href={index === 0 ? "/build-pc" : "/products"} className="text-sm mt-2 flex items-center gap-1 underline underline-offset-4 hover:opacity-80 transition-opacity">
                  {index === 0 ? "Xây dựng ngay" : "Xem ngay"} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand carousel */}
      <section className={HOME_FULL_BLEED_SECTION_CLASSES}>
        <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => rotateBrands(-1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            aria-label="Xem nhãn hàng trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {visibleBrandItems.map((brand, index) => (
              <Link
                key={`${brand}-${index}`}
                href={`/products?brand=${encodeURIComponent(brand)}`}
                className="flex h-10 min-w-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <span className="truncate">{brand}</span>
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => rotateBrands(1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            aria-label="Xem nhãn hàng tiếp theo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Promo Banners */}
      <section className={HOME_FULL_BLEED_SECTION_CLASSES}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {customBanners.length > 0 ? customBanners.slice(0, 3).map((banner) => (
            <Link
              key={banner.id}
              href={banner.linkUrl || "/products"}
              className="relative rounded-xl text-white min-h-[120px] overflow-hidden hover:shadow-lg transition-all cursor-pointer active:scale-[0.98] group"
            >
              <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </Link>
          )) : promoBanners.map((b) => (
            <div
              key={b.title}
              className={`bg-gradient-to-r ${b.gradient} rounded-xl text-white p-6 flex flex-col justify-center hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]`}
            >
              <p className="text-sm font-semibold opacity-90">{b.title}</p>
              <p className="text-2xl font-bold">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Products — fetched from API */}
      <section className={HOME_FULL_BLEED_SECTION_SPACED_CLASSES}>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6">
            <h2 className="text-lg font-bold text-[#1A4B9C] flex items-center gap-2 py-4 border-b-2 border-[#1A4B9C] whitespace-nowrap">
              TOP SẢN PHẨM BÁN CHẠY
            </h2>
            <Link href="/products" className="hidden md:flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có sản phẩm nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {featuredProducts.slice(0, 10).map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <ProductCard product={product} onAddToCart={handleAddToCart} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services Bar */}
      <section className={`${HOME_FULL_BLEED_SECTION_SPACED_CLASSES} pb-10`}>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Giao hàng</p>
                <p className="text-xs text-gray-500">Toàn quốc</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Bảo hành</p>
                <p className="text-xs text-gray-500">Chính hãng đến 36 tháng</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Giá tốt nhất</p>
                <p className="text-xs text-gray-500">Cam kết giá tốt</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Hỗ trợ 24/7</p>
                <p className="text-xs text-gray-500">Tư vấn miễn phí</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
