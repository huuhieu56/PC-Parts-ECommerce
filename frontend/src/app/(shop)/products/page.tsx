"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Grid3X3, LayoutList, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import type { ApiResponse, Product, Category, Brand, PageResponse } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, selectedCategory, selectedBrand, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("size", "12");
      if (search) params.append("keyword", search);
      if (selectedCategory) params.append("categoryId", String(selectedCategory));
      if (selectedBrand) params.append("brandId", String(selectedBrand));

      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        api.get<ApiResponse<PageResponse<Product>>>(`/products?${params}`),
        api.get<ApiResponse<Category[]>>("/categories"),
        api.get<ApiResponse<Brand[]>>("/brands"),
      ]);

      setProducts(productsRes.data.data.content);
      setTotalPages(productsRes.data.data.totalPages);
      setCategories(categoriesRes.data.data);
      setBrands(brandsRes.data.data);
    } catch {
      // API might not be ready yet, show empty state
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sản phẩm</h1>
        <p className="text-slate-400">Tìm kiếm linh kiện máy tính từ các thương hiệu hàng đầu</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 h-11"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />Lọc
            {(selectedCategory || selectedBrand) && (
              <Badge className="ml-2 bg-blue-600">
                {[selectedCategory, selectedBrand].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="text-slate-400 hover:text-white"
          >
            {viewMode === "grid" ? <LayoutList className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-8 p-6 rounded-xl bg-slate-900/50 border border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Danh mục</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectedCategory(null); setPage(0); }}
                className={selectedCategory === null ? "bg-blue-600 text-white" : "border-slate-700 text-slate-400"}
              >
                Tất cả
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedCategory(cat.id); setPage(0); }}
                  className={selectedCategory === cat.id ? "bg-blue-600 text-white" : "border-slate-700 text-slate-400"}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
          {/* Brands */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Thương hiệu</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedBrand === null ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectedBrand(null); setPage(0); }}
                className={selectedBrand === null ? "bg-blue-600 text-white" : "border-slate-700 text-slate-400"}
              >
                Tất cả
              </Button>
              {brands.map((b) => (
                <Button
                  key={b.id}
                  variant={selectedBrand === b.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedBrand(b.id); setPage(0); }}
                  className={selectedBrand === b.id ? "bg-blue-600 text-white" : "border-slate-700 text-slate-400"}
                >
                  {b.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-slate-900/50 border border-slate-800/50 h-80 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">Không tìm thấy sản phẩm nào</p>
          <Button
            variant="outline"
            className="mt-4 border-slate-700 text-slate-300"
            onClick={() => { setSearch(""); setSelectedCategory(null); setSelectedBrand(null); }}
          >
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "flex flex-col gap-4"
        }>
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className={`group overflow-hidden bg-slate-900/50 border-slate-800/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer ${
                viewMode === "list" ? "flex flex-row" : ""
              }`}>
                {/* Image */}
                <div className={`relative bg-slate-800/50 flex items-center justify-center ${
                  viewMode === "list" ? "w-48 h-36" : "aspect-square"
                }`}>
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].imageUrl}
                      alt={product.name}
                      className="object-contain w-full h-full p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-700/50 rounded-lg" />
                  )}
                  {product.originalPrice > product.sellingPrice && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
                      -{Math.round((1 - product.sellingPrice / product.originalPrice) * 100)}%
                    </Badge>
                  )}
                </div>
                {/* Info */}
                <div className="p-4 flex-1">
                  <p className="text-xs text-blue-400 mb-1">{product.brandName}</p>
                  <h3 className="font-medium text-sm text-slate-200 mb-2 line-clamp-2 group-hover:text-white transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white">{formatPrice(product.sellingPrice)}</span>
                    {product.originalPrice > product.sellingPrice && (
                      <span className="text-xs text-slate-500 line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs border-slate-700 text-slate-400">
                    {product.condition === "NEW" ? "Mới" : product.condition === "SECOND_HAND" ? "Đã sử dụng" : product.condition}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="border-slate-700 text-slate-300 disabled:opacity-50"
          >
            Trước
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const p = page < 3 ? i : page - 2 + i;
            if (p >= totalPages) return null;
            return (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                onClick={() => setPage(p)}
                className={p === page ? "bg-blue-600 text-white" : "border-slate-700 text-slate-400"}
              >
                {p + 1}
              </Button>
            );
          })}
          <Button
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="border-slate-700 text-slate-300 disabled:opacity-50"
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
