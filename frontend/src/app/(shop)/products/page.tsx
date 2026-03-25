"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Cpu, ShoppingCart, Star, Filter, X, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState, useEffect, Suspense } from "react";

interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number | null;
  categoryName: string;
  brandName: string;
  averageRating: number;
  reviewCount: number;
  thumbnailUrl: string | null;
  quantity: number;
  discountPercent: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + " đ";
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 p-4">
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center">
            <Cpu className="w-10 h-10 text-gray-400" />
          </div>
          {product.discountPercent > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              -{product.discountPercent}%
            </span>
          )}
        </div>
        {/* Info */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="text-xs text-gray-400 mb-1">Mã SP: {product.sku}</p>
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3 h-3 ${s <= Math.round(product.averageRating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              ))}
            </div>
            <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
          </div>
          <div className="mt-auto">
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
            )}
            <p className="text-[#E31837] font-bold text-base">{formatPrice(product.price)}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs flex items-center gap-0.5 ${product.quantity > 0 ? "text-green-600" : "text-red-500"}`}>
              {product.quantity > 0 ? "✓ Còn hàng" : "✗ Hết hàng"}
            </span>
            <button
              onClick={(e) => { e.preventDefault(); }}
              className="w-7 h-7 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const category = searchParams.get("category") || "";
  const keyword = searchParams.get("keyword") || "";

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (keyword) params.set("keyword", keyword);
        params.set("page", "0");
        params.set("size", "20");

        const res = await fetch(`${API_URL}/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.content || []);
        }
      } catch {
        console.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category, keyword]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">{category || "Tất cả sản phẩm"}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? 'block fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden'} lg:block lg:relative lg:w-60 lg:shrink-0`}>
            <div className="lg:bg-white lg:rounded-xl lg:shadow-sm lg:p-4 lg:sticky lg:top-32">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
                </h3>
                <button className="lg:hidden" onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Category filter */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Danh mục</h4>
                <div className="space-y-1.5">
                  {["CPU", "Mainboard", "RAM", "VGA", "SSD", "PSU", "Case", "Cooling"].map((c) => (
                    <Link
                      key={c}
                      href={`/products?category=${c.toLowerCase()}`}
                      className={`block text-sm px-2 py-1.5 rounded ${category === c.toLowerCase() ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Price filter */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Khoảng giá</h4>
                <div className="space-y-1.5">
                  {[
                    { label: "Dưới 5 triệu", value: "0-5000000" },
                    { label: "5 - 10 triệu", value: "5000000-10000000" },
                    { label: "10 - 20 triệu", value: "10000000-20000000" },
                    { label: "Trên 20 triệu", value: "20000000-" },
                  ].map((p) => (
                    <label key={p.value} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock filter */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tình trạng kho</h4>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Còn hàng
                </label>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                {keyword ? `Kết quả tìm kiếm: "${keyword}"` : (category || "Tất cả sản phẩm")}
              </h1>
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-1.5 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm"
              >
                <Filter className="w-4 h-4" /> Bộ lọc
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
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
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
                <p className="text-gray-500 text-sm mb-6">Hãy thử thay đổi bộ lọc hoặc tìm kiếm khác.</p>
                <Link href="/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Xem tất cả sản phẩm →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
