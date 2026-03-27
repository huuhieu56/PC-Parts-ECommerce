"use client";

import Link from "next/link";
import { Cpu, Monitor, MemoryStick, HardDrive, Zap, ShoppingCart, ArrowRight, ChevronRight, Truck, Shield, Headphones, Check, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useCartStore } from "@/stores/cart-store";

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

const categories = [
  { name: "CPU", icon: Cpu, href: "/products?category=cpu", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { name: "Mainboard", icon: Monitor, href: "/products?category=mainboard", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { name: "RAM", icon: MemoryStick, href: "/products?category=ram", color: "bg-purple-50 text-purple-600 border-purple-200" },
  { name: "SSD/HDD", icon: HardDrive, href: "/products?category=ssd", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { name: "VGA", icon: Zap, href: "/products?category=vga", color: "bg-red-50 text-red-600 border-red-200" },
  { name: "Nguồn", icon: Zap, href: "/products?category=psu", color: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  { name: "Case", icon: Monitor, href: "/products?category=case", color: "bg-orange-50 text-orange-600 border-orange-200" },
  { name: "Tản nhiệt", icon: Zap, href: "/products?category=cooling", color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
];

const brands = ["Intel", "AMD", "ASUS", "GIGABYTE", "MSI", "CORSAIR", "Kingston", "Samsung", "WD", "NZXT", "Noctua", "Seasonic"];

const promoBanners = [
  { title: "TBVP", sub: "Giảm tới 32%", gradient: "from-red-500 to-orange-400" },
  { title: "MÀN HÌNH", sub: "Giảm 1 Triệu", gradient: "from-blue-500 to-cyan-400" },
  { title: "GEAR", sub: "Giảm 50%", gradient: "from-fuchsia-500 to-purple-500" },
];

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
          <button className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-md shadow-sm hover:bg-white transition-all cursor-pointer active:scale-95">
            So sánh
          </button>
          <button className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-md shadow-sm hover:bg-white transition-all cursor-pointer active:scale-95">
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
    fetchProducts();
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Hero Banner + Promo Cards */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Hero Banner */}
          <div className="lg:col-span-2 relative rounded-xl overflow-hidden bg-gradient-to-r from-[#1A4B9C] to-[#2563EB] text-white min-h-[300px] flex">
            <div className="flex-1 p-8 flex flex-col justify-center">
              <span className="text-amber-400 text-sm font-semibold mb-2 uppercase tracking-wide">🔥 Sản phẩm HOT</span>
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
          {/* Side Promo Cards */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-xl overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 flex flex-col justify-center">
              <p className="text-sm font-semibold opacity-90 mb-1">BUILD PC CẤP</p>
              <p className="text-2xl font-bold">Giảm lên đến 30tr</p>
              <Link href="/build-pc" className="text-sm mt-2 flex items-center gap-1 underline underline-offset-4 hover:opacity-80 transition-opacity">
                Xây dựng ngay <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 flex flex-col justify-center">
              <p className="text-sm font-semibold opacity-90 mb-1">LAPTOP</p>
              <p className="text-2xl font-bold">Giảm thêm 1 Triệu</p>
              <Link href="/products" className="text-sm mt-2 flex items-center gap-1 underline underline-offset-4 hover:opacity-80 transition-opacity">
                Xem ngay <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Danh mục nổi bật</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border hover:shadow-md transition-all cursor-pointer active:scale-95 ${cat.color}`}
              >
                <cat.icon className="w-7 h-7" />
                <span className="text-xs font-medium text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Logos */}
      <section className="max-w-7xl mx-auto px-4 pb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max">
            {brands.map((brand) => (
              <span key={brand} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer whitespace-nowrap">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promoBanners.map((b) => (
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
      <section className="max-w-7xl mx-auto px-4 py-6">
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
      <section className="max-w-7xl mx-auto px-4 py-6 pb-10">
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
