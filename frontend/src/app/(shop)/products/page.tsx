"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Cpu, Filter, X, ChevronRight, SlidersHorizontal, Loader2, ChevronDown } from "lucide-react";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import type { DisplayProduct } from "@/components/ProductCard";
import { mapToDisplayProduct } from "@/lib/mappers";
import type { Product } from "@/types";

interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  children?: CategoryDto[];
}

interface AttributeValueOption {
  valueId: number;
  value: string;
  count: number;
}

interface AttributeFilterGroup {
  attributeId: number;
  attributeName: string;
  values: AttributeValueOption[];
}

interface BrandFilterOption {
  brandId: number;
  brandName: string;
  count: number;
}

interface ProductFilterData {
  attributes: AttributeFilterGroup[];
  brands: BrandFilterOption[];
  priceRange: { minPrice: number; maxPrice: number };
}



const priceRanges = [
  { label: "Dưới 2 triệu", min: 0, max: 2000000 },
  { label: "2 - 5 triệu", min: 2000000, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: Infinity },
];





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

  // Dynamic filter data from API
  const [filterData, setFilterData] = useState<ProductFilterData | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Selected attribute value IDs (across all attribute groups)
  const [selectedAttrValues, setSelectedAttrValues] = useState<Set<number>>(new Set());
  // Expanded accordion state for attribute groups
  const [expandedAttrs, setExpandedAttrs] = useState<Set<number>>(new Set());

  // Filter values from URL
  const selectedCategoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : null;
  const selectedBrandId = searchParams.get("brandId") ? Number(searchParams.get("brandId")) : null;
  const keyword = searchParams.get("keyword") || "";
  const categorySlug = searchParams.get("category") || "";
  const isSale = searchParams.get("sale") === "true";

  // Client-side price filter
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState(isSale ? "discount" : "default");

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

  // Fetch dynamic filters when category changes
  useEffect(() => {
    const effectiveCategoryId = selectedCategoryId || (categorySlug ? findCategoryBySlug(categories, categorySlug)?.id : null);
    if (!effectiveCategoryId) {
      setFilterData(null);
      return;
    }
    async function fetchFilters() {
      setLoadingFilters(true);
      try {
        const res = await api.get("/products/filters", { params: { categoryId: effectiveCategoryId } });
        const data: ProductFilterData = res.data.data || res.data;
        setFilterData(data);
        // Auto-expand all attribute groups
        setExpandedAttrs(new Set(data.attributes.map((a: AttributeFilterGroup) => a.attributeId)));
      } catch (err) {
        console.error("Failed to fetch filters", err);
      }
      setLoadingFilters(false);
    }
    fetchFilters();
    // Reset selected attribute values when category changes
    setSelectedAttrValues(new Set());
  }, [selectedCategoryId, categorySlug, categories]);

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

        // Dynamic attribute value IDs (server-side filter)
        if (selectedAttrValues.size > 0) {
          const ids = Array.from(selectedAttrValues);
          ids.forEach(id => params.append("attributeValueIds", String(id)));
        }

        // Price range (server-side filter)
        if (selectedPriceRanges.length > 0) {
          const selectedRanges = selectedPriceRanges.map(idx => priceRanges[idx]);
          const minPrice = Math.min(...selectedRanges.map(r => r.min));
          const maxPrice = Math.max(...selectedRanges.map(r => r.max));
          params.set("minPrice", String(minPrice));
          if (maxPrice !== Infinity) params.set("maxPrice", String(maxPrice));
        }

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

  function toggleAttrValue(valueId: number) {
    setSelectedAttrValues(prev => {
      const next = new Set(prev);
      if (next.has(valueId)) next.delete(valueId);
      else next.add(valueId);
      return next;
    });
    setCurrentPage(0);
  }

  function toggleExpandAttr(attrId: number) {
    setExpandedAttrs(prev => {
      const next = new Set(prev);
      if (next.has(attrId)) next.delete(attrId);
      else next.add(attrId);
      return next;
    });
  }

  function togglePriceRange(idx: number) {
    setSelectedPriceRanges(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
    setCurrentPage(0);
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
    setSelectedPriceRanges([]);
    setSelectedAttrValues(new Set());
    setSortBy("default");
    router.push("/products");
  }

  const hasActiveFilters = selectedCategoryId || selectedBrandId || keyword || categorySlug || selectedPriceRanges.length > 0 || selectedAttrValues.size > 0;

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

  // Get selected attribute value labels for active filter tags
  function getAttrValueLabel(valueId: number): string {
    if (!filterData) return String(valueId);
    for (const group of filterData.attributes) {
      const val = group.values.find(v => v.valueId === valueId);
      if (val) return `${group.attributeName}: ${val.value}`;
    }
    return String(valueId);
  }

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
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
                </h3>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-600 cursor-pointer">
                      Xóa lọc
                    </button>
                  )}
                  <button className="lg:hidden cursor-pointer" onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Category filter */}
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

              {/* Brand filter (from filter API or all brands) */}
              {(filterData?.brands || []).length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Thương hiệu</h4>
                  <div className="space-y-1">
                    {filterData!.brands.map((brand) => (
                      <label key={brand.brandId} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedBrandId === brand.brandId}
                          onChange={() => navigateFilter({ brandId: selectedBrandId === brand.brandId ? null : String(brand.brandId) })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        {brand.brandName}
                        <span className="text-xs text-gray-400 ml-auto">({brand.count})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Attribute Filters */}
              {loadingFilters && selectedCategoryId && (
                <div className="mb-5 text-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">Đang tải bộ lọc...</p>
                </div>
              )}
              {filterData && filterData.attributes.map((attrGroup) => (
                <div key={attrGroup.attributeId} className="mb-4">
                  <button
                    onClick={() => toggleExpandAttr(attrGroup.attributeId)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-1.5 cursor-pointer hover:text-gray-900 transition-colors"
                  >
                    <span>{attrGroup.attributeName}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedAttrs.has(attrGroup.attributeId) ? "rotate-180" : ""}`} />
                  </button>
                  {expandedAttrs.has(attrGroup.attributeId) && (
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {attrGroup.values.map((val) => (
                        <label key={val.valueId} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedAttrValues.has(val.valueId)}
                            onChange={() => toggleAttrValue(val.valueId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="truncate">{val.value}</span>
                          <span className="text-xs text-gray-400 ml-auto shrink-0">({val.count})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Price filter */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Khoảng giá</h4>
                <div className="space-y-1.5">
                  {priceRanges.map((range, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedPriceRanges.includes(idx)}
                        onChange={() => togglePriceRange(idx)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      {range.label}
                    </label>
                  ))}
                </div>
              </div>
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
