"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Cpu, Filter, X, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import type { DisplayProduct } from "@/components/ProductCard";
import ProductFilterSidebar from "@/components/ProductFilterSidebar";
import { useProductFilters, priceRanges } from "@/hooks/useProductFilters";
import { mapToDisplayProduct } from "@/lib/mappers";
import type { Product } from "@/types";

interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  children?: CategoryDto[];
}





function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  // Filters state
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const PAGE_SIZE = 20;

  // Filter values from URL
  const selectedCategoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : null;
  const selectedBrandId = searchParams.get("brandId") ? Number(searchParams.get("brandId")) : null;
  const keyword = searchParams.get("keyword") || "";
  const categorySlug = searchParams.get("category") || "";
  const isSale = searchParams.get("sale") === "true";

  const [sortBy, setSortBy] = useState(isSale ? "discount" : "default");

  // Reusable filter hook
  const {
    filterData,
    loadingFilters,
    selectedAttrValues,
    expandedAttrs,
    selectedPriceRanges,
    toggleAttrValue,
    toggleExpandAttr,
    togglePriceRange,
    clearFilters: clearHookFilters,
    getAttrValueLabel,
    buildFilterParams,
    hasActiveFilters: hasFilterChanges,
  } = useProductFilters(selectedCategoryId);

  const handleAddToCart = useCallback(async (productId: number) => {
    await addItem(productId, 1);
  }, [addItem]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get("/categories");
        const cats: CategoryDto[] = res.data.data || res.data || [];
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch products with server-side filters
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (keyword) params.set("keyword", keyword);
        if (selectedCategoryId) params.set("categoryId", String(selectedCategoryId));
        if (selectedBrandId) params.set("brandId", String(selectedBrandId));
        params.set("page", String(currentPage));
        params.set("size", String(PAGE_SIZE));

        // Sort
        if (sortBy === "price-asc") params.set("sort", "sellingPrice,asc");
        else if (sortBy === "price-desc") params.set("sort", "sellingPrice,desc");
        else if (sortBy === "name-asc") params.set("sort", "name,asc");
        else if (sortBy === "discount") params.set("sort", "discountPercent,desc");

        // Sale filter (server-side)
        if (isSale) params.set("isSale", "true");

        // If category slug is provided but no categoryId, try to find the ID
        if (categorySlug && !selectedCategoryId) {
          const matchedCat = findCategoryBySlug(categories, categorySlug);
          if (matchedCat) {
            params.set("categoryId", String(matchedCat.id));
          }
        }

        // Dynamic attribute and price filters from hook
        buildFilterParams(params);

        const res = await api.get("/products", { params: Object.fromEntries(params) });
        const pageData = res.data.data || res.data;
        const items: Product[] = pageData.content || [];
        const mapped = items.map(mapToDisplayProduct);
        setProducts(mapped);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || items.length);
        setHasNext(pageData.hasNext ?? false);
        setHasPrevious(pageData.hasPrevious ?? false);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategoryId, selectedBrandId, keyword, categorySlug, categories, currentPage, selectedAttrValues, selectedPriceRanges, sortBy, isSale]);

  function findCategoryBySlug(cats: CategoryDto[], slug: string): CategoryDto | null {
    for (const cat of cats) {
      if (cat.slug?.toLowerCase() === slug.toLowerCase() || cat.name?.toLowerCase() === slug.toLowerCase()) return cat;
      if (cat.children) {
        const found = findCategoryBySlug(cat.children, slug);
        if (found) return found;
      }
    }
    return null;
  }

  function navigateFilter(params: Record<string, string | null>) {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, val]) => {
      if (val === null) current.delete(key);
      else current.set(key, val);
    });
    setCurrentPage(0);
    router.push(`/products?${current.toString()}`);
  }

  function clearAllFilters() {
    clearHookFilters();
    setSortBy("default");
    router.push("/products");
  }

  const hasActiveFilters = !!(selectedCategoryId || selectedBrandId || keyword || categorySlug) || hasFilterChanges;

  // Flatten categories for sidebar display
  function flattenCategories(cats: CategoryDto[]): CategoryDto[] {
    const result: CategoryDto[] = [];
    for (const cat of cats) {
      result.push(cat);
      if (cat.children) result.push(...flattenCategories(cat.children));
    }
    return result;
  }
  const flatCats = flattenCategories(categories);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">
              {keyword ? `Tìm kiếm: "${keyword}"` : categorySlug || "Tất cả sản phẩm"}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? 'block fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden'} lg:block lg:relative lg:w-60 lg:shrink-0`}>
            <div className="lg:bg-white lg:rounded-xl lg:shadow-sm lg:p-4 lg:sticky lg:top-32">
              {/* Category filter (products page specific) */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Danh mục</h4>
                <div className="space-y-0.5">
                  <button
                    onClick={() => navigateFilter({ categoryId: null, category: null })}
                    className={`block w-full text-left text-sm px-2 py-1.5 rounded cursor-pointer transition-colors ${!selectedCategoryId && !categorySlug ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    Tất cả
                  </button>
                  {flatCats.map((cat) => {
                    const isActive = selectedCategoryId === cat.id || categorySlug.toLowerCase() === (cat.slug || cat.name).toLowerCase();
                    return (
                      <button
                        key={cat.id}
                        onClick={() => navigateFilter({ categoryId: String(cat.id), category: null })}
                        className={`block w-full text-left text-sm px-2 py-1.5 rounded cursor-pointer transition-colors ${isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <ProductFilterSidebar
                filterData={filterData}
                loadingFilters={loadingFilters}
                selectedAttrValues={selectedAttrValues}
                expandedAttrs={expandedAttrs}
                selectedPriceRanges={selectedPriceRanges}
                selectedBrandId={selectedBrandId}
                toggleAttrValue={toggleAttrValue}
                toggleExpandAttr={toggleExpandAttr}
                togglePriceRange={togglePriceRange}
                onBrandChange={(brandId) => navigateFilter({ brandId: brandId === null ? null : String(brandId) })}
                onClearAll={clearAllFilters}
                hasActiveFilters={hasActiveFilters}
              />

              <button className="lg:hidden cursor-pointer mt-2" onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {isSale ? "🔥 Khuyến mãi" : keyword ? `Tìm kiếm: "${keyword}"` : flatCats.find(c => c.id === selectedCategoryId)?.name || categorySlug || "Tất cả sản phẩm"}
              </h1>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="name-asc">Tên A-Z</option>
                  <option value="discount">Giảm giá nhiều</option>
                </select>
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  <Filter className="w-4 h-4" /> Lọc
                </button>
              </div>
            </div>

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {(selectedCategoryId || categorySlug) && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                    Danh mục: {flatCats.find(c => c.id === selectedCategoryId)?.name || categorySlug}
                    <button onClick={() => navigateFilter({ categoryId: null, category: null })} className="hover:text-blue-900 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedBrandId && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                    Thương hiệu: {filterData?.brands.find(b => b.brandId === selectedBrandId)?.brandName || selectedBrandId}
                    <button onClick={() => navigateFilter({ brandId: null })} className="hover:text-blue-900 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {Array.from(selectedAttrValues).map(valueId => (
                  <span key={valueId} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                    {getAttrValueLabel(valueId)}
                    <button onClick={() => toggleAttrValue(valueId)} className="hover:text-green-900 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {selectedPriceRanges.map(idx => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full">
                    {priceRanges[idx].label}
                    <button onClick={() => togglePriceRange(idx)} className="hover:text-amber-900 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

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
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                >
                  Xóa bộ lọc →
                </button>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 rounded-lg overflow-hidden shadow-sm">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    size={PAGE_SIZE}
                    onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  />
                </div>
              )}
              </>
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
