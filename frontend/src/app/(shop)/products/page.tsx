"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Cpu, ShoppingCart, Filter, X, ChevronRight, SlidersHorizontal, Check, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useCartStore } from "@/stores/cart-store";

interface ProductDto {
  id: number;
  name: string;
  slug: string;
  sku: string;
  sellingPrice: number;
  originalPrice: number;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  condition: string;
  status: string;
  images: { id: number; imageUrl: string; isPrimary: boolean; sortOrder: number }[];
  attributes: { attributeId: number; attributeName: string; value: string }[];
}

interface DisplayProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice: number | null;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  discountPercent: number;
  thumbnailUrl: string | null;
}

interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  children?: CategoryDto[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";

const priceRanges = [
  { label: "Dưới 2 triệu", min: 0, max: 2000000 },
  { label: "2 - 5 triệu", min: 2000000, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: Infinity },
];

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + " đ";
}

function mapProduct(dto: ProductDto): DisplayProduct {
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
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    brandId: dto.brandId,
    brandName: dto.brandName,
    discountPercent: discount,
    thumbnailUrl: primaryImage?.imageUrl || null,
  };
}

function ProductCard({ product, onAddToCart }: { product: DisplayProduct; onAddToCart: (id: number) => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
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
    <Link href={`/products/${product.slug}`} className="block group">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col">
        <div className="relative aspect-square bg-gray-50 p-4">
          {product.thumbnailUrl ? (
            <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-contain rounded-md transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center">
              <Cpu className="w-10 h-10 text-gray-400" />
            </div>
          )}
          {product.discountPercent > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
              -{product.discountPercent}%
            </span>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="text-xs text-gray-400 mb-1">Mã SP: {product.sku}</p>
          <p className="text-xs text-gray-500 mb-2">{product.brandName}</p>
          <div className="mt-auto">
            {product.originalPrice && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
            )}
            <p className="text-[#E31837] font-bold text-base">{formatPrice(product.price)}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs flex items-center gap-0.5 text-green-600">✓ Còn hàng</span>
            <button
              onClick={handleAdd}
              disabled={adding}
              className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
                added ? "bg-green-500 text-white scale-110" : "bg-blue-600 hover:bg-blue-700 hover:shadow-md text-white"
              }`}
              title="Thêm vào giỏ hàng"
            >
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  // Filters state
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [allProducts, setAllProducts] = useState<DisplayProduct[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter values from URL
  const selectedCategoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : null;
  const selectedBrandId = searchParams.get("brandId") ? Number(searchParams.get("brandId")) : null;
  const keyword = searchParams.get("keyword") || "";
  const categorySlug = searchParams.get("category") || "";

  // Client-side filters
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("default");

  const handleAddToCart = useCallback(async (productId: number) => {
    await addItem(productId, 1);
  }, [addItem]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
          const json = await res.json();
          const cats: CategoryDto[] = json.data || json || [];
          setCategories(cats);
        }
      } catch { /* empty */ }
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
        params.set("page", "0");
        params.set("size", "50");

        // If category slug is provided but no categoryId, try to find the ID
        if (categorySlug && !selectedCategoryId) {
          const matchedCat = findCategoryBySlug(categories, categorySlug);
          if (matchedCat) {
            params.set("categoryId", String(matchedCat.id));
          }
        }

        const res = await fetch(`${API_URL}/products?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          const pageData = json.data || json;
          const items: ProductDto[] = pageData.content || [];
          const mapped = items.map(mapProduct);
          setAllProducts(mapped);
          setProducts(mapped);

          // Extract unique brands from products
          const uniqueBrands = new Map<number, string>();
          mapped.forEach(p => {
            if (p.brandId && p.brandName) uniqueBrands.set(p.brandId, p.brandName);
          });
          setBrands(Array.from(uniqueBrands.entries()).map(([id, name]) => ({ id, name })));
        }
      } catch {
        console.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategoryId, selectedBrandId, keyword, categorySlug, categories]);

  // Apply client-side price filter
  useEffect(() => {
    if (selectedPriceRanges.length === 0) {
      setProducts(sortProducts(allProducts, sortBy));
      return;
    }
    const filtered = allProducts.filter(p => {
      return selectedPriceRanges.some(idx => {
        const range = priceRanges[idx];
        return p.price >= range.min && p.price < range.max;
      });
    });
    setProducts(sortProducts(filtered, sortBy));
  }, [selectedPriceRanges, allProducts, sortBy]);

  function sortProducts(items: DisplayProduct[], sort: string): DisplayProduct[] {
    const sorted = [...items];
    switch (sort) {
      case "price-asc": return sorted.sort((a, b) => a.price - b.price);
      case "price-desc": return sorted.sort((a, b) => b.price - a.price);
      case "name-asc": return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "discount": return sorted.sort((a, b) => b.discountPercent - a.discountPercent);
      default: return sorted;
    }
  }

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

  function togglePriceRange(idx: number) {
    setSelectedPriceRanges(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  }

  function navigateFilter(params: Record<string, string | null>) {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, val]) => {
      if (val === null) current.delete(key);
      else current.set(key, val);
    });
    router.push(`/products?${current.toString()}`);
  }

  function clearAllFilters() {
    setSelectedPriceRanges([]);
    setSortBy("default");
    router.push("/products");
  }

  const hasActiveFilters = selectedCategoryId || selectedBrandId || keyword || categorySlug || selectedPriceRanges.length > 0;

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

              {/* Brand filter */}
              {brands.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Thương hiệu</h4>
                  <div className="space-y-0.5">
                    {brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => navigateFilter({ brandId: selectedBrandId === brand.id ? null : String(brand.id) })}
                        className={`block w-full text-left text-sm px-2 py-1.5 rounded cursor-pointer transition-colors ${selectedBrandId === brand.id ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                {keyword ? `Tìm kiếm: "${keyword}"` : categorySlug || "Tất cả sản phẩm"}
                {!loading && <span className="text-sm font-normal text-gray-500 ml-2">({products.length} sản phẩm)</span>}
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
                    Thương hiệu: {brands.find(b => b.id === selectedBrandId)?.name}
                    <button onClick={() => navigateFilter({ brandId: null })} className="hover:text-blue-900 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedPriceRanges.map(idx => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                    {priceRanges[idx].label}
                    <button onClick={() => togglePriceRange(idx)} className="hover:text-blue-900 cursor-pointer"><X className="w-3 h-3" /></button>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
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
