"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Star, ShoppingCart, Heart, Phone, MapPin, ChevronRight, Shield, Truck, RotateCcw, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import api from "@/lib/api";

interface ProductDto {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
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

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  originalPrice: number | null;
  categoryName: string;
  brandName: string;
  averageRating: number;
  reviewCount: number;
  images: string[];
  quantity: number;
  warranty: number;
  attributes: Record<string, string>;
  discountPercent: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";

function mapProductDto(dto: ProductDto): ProductDetail {
  const discount = dto.originalPrice > dto.sellingPrice
    ? Math.round((1 - dto.sellingPrice / dto.originalPrice) * 100)
    : 0;
  const attrs: Record<string, string> = {};
  (dto.attributes || []).forEach((a) => {
    attrs[a.attributeName] = a.value;
  });
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    sku: dto.sku,
    description: dto.description || '',
    price: dto.sellingPrice,
    originalPrice: dto.originalPrice > dto.sellingPrice ? dto.originalPrice : null,
    categoryName: dto.categoryName,
    brandName: dto.brandName,
    averageRating: 0,
    reviewCount: 0,
    images: (dto.images || []).map((img) => img.imageUrl),
    quantity: 1,
    warranty: 12,
    attributes: attrs,
    discountPercent: discount,
  };
}

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + " đ";
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMsg, setCartMsg] = useState("");

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addItem(product.id, qty);
      setCartMsg("Đã thêm vào giỏ hàng!");
      setTimeout(() => setCartMsg(""), 3000);
    } catch {
      setCartMsg("Lỗi khi thêm vào giỏ hàng");
      setTimeout(() => setCartMsg(""), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addItem(product.id, qty);
      router.push("/checkout");
    } catch {
      setCartMsg("Lỗi khi thêm vào giỏ hàng");
      setTimeout(() => setCartMsg(""), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    try {
      await api.post(`/wishlist/${product.id}`);
      setCartMsg("Đã thêm vào yêu thích!");
      setTimeout(() => setCartMsg(""), 3000);
    } catch {
      setCartMsg("Cần đăng nhập để thêm yêu thích");
      setTimeout(() => setCartMsg(""), 3000);
    }
  };

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products/${resolvedParams.slug}`);
        if (res.ok) {
          const json = await res.json();
          // API returns ApiResponse<ProductDto>
          const dto: ProductDto = json.data || json;
          setProduct(mapProductDto(dto));
        }
      } catch {
        console.error("Failed to fetch product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm p-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5"><div className="aspect-square bg-gray-200 rounded-lg" /></div>
              <div className="lg:col-span-4 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded w-1/3" />
              </div>
              <div className="lg:col-span-3"><div className="h-64 bg-gray-200 rounded-lg" /></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h1>
          <Link href="/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium">← Quay lại</Link>
        </div>
      </div>
    );
  }

  const attrs = product.attributes || {};
  const attrEntries = Object.entries(attrs);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/products?category=${product.categoryName?.toLowerCase()}`} className="hover:text-blue-600">{product.categoryName}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main Layout: 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column 1: Product Image */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-32">
              <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                <Cpu className="w-24 h-24 text-gray-300" />
              </div>
              {/* Thumbnails */}
              <div className="flex gap-2 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-16 h-16 bg-gray-50 rounded-md border-2 border-gray-200 hover:border-blue-500 cursor-pointer flex items-center justify-center transition-colors">
                    <Cpu className="w-6 h-6 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Product Info & Price */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-xl font-bold text-gray-900 leading-snug mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 mb-3 text-sm">
                <span className="text-gray-400">Mã SP: <span className="text-gray-600 font-medium">{product.sku}</span></span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">Brand: <span className="text-gray-600 font-medium">{product.brandName}</span></span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.averageRating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{product.reviewCount || 0} đánh giá</span>
              </div>

              {/* Key Specs */}
              {attrEntries.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <ul className="space-y-1.5">
                    {attrEntries.slice(0, 5).map(([key, value]) => (
                      <li key={key} className="flex text-sm">
                        <span className="text-gray-500 w-32 shrink-0">• {key}</span>
                        <span className="text-gray-900 font-medium">{value}</span>
                      </li>
                    ))}
                    {attrEntries.length > 5 && (
                      <li className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">Xem thêm &gt;</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Price */}
              <div className="border-t border-gray-100 pt-4 mb-4">
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-400">Giá niêm yết:</span>
                    <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                    {product.discountPercent > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">-{product.discountPercent}%</span>
                    )}
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-500">Giá khuyến mãi:</span>
                </div>
                <p className="text-[#E31837] font-bold text-2xl mt-1">{formatPrice(product.price)}</p>
                <p className="text-xs text-gray-400 mt-0.5">(Đã bao gồm VAT)</p>
              </div>

              {/* Warranty & Stock */}
              <div className="flex items-center gap-4 mb-5 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <Shield className="w-4 h-4 text-blue-600" />
                  BH: {product.warranty || 12} tháng
                </span>
                <span className={`flex items-center gap-1 ${product.quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                  {product.quantity > 0 ? "✓ Còn hàng" : "✗ Hết hàng"}
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm text-gray-600">Số lượng:</span>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-gray-900 border-x border-gray-300">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              {cartMsg && (
                <div className={`text-sm text-center py-2 px-3 rounded-lg mb-2 ${cartMsg.includes("Lỗi") || cartMsg.includes("Cần") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {cartMsg}
                </div>
              )}
              <div className="space-y-2">
                <button onClick={handleBuyNow} disabled={addingToCart} className="w-full bg-[#E31837] hover:bg-red-700 text-white py-3.5 rounded-lg font-bold text-base transition-colors shadow-md disabled:opacity-50">
                  {addingToCart ? "Đang xử lý..." : "ĐẶT MUA NGAY"}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors">
                    MUA TRẢ GÓP
                  </button>
                  <button onClick={handleAddToCart} disabled={addingToCart} className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                    <ShoppingCart className="w-4 h-4" /> {addingToCart ? "Đang thêm..." : "CHO VÀO GIỎ"}
                  </button>
                </div>
                <button onClick={handleWishlist} className="w-full border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                  <Heart className="w-4 h-4" /> Thêm vào yêu thích
                </button>
              </div>
            </div>
          </div>

          {/* Column 3: Sidebar */}
          <div className="lg:col-span-3">
            <div className="space-y-4 sticky top-32">
              {/* Store Info */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-3 uppercase">Mua hàng Online toàn quốc</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-gray-900 font-semibold">1900.XXXX</span>
                </div>
                <hr className="border-gray-100 mb-3" />
                <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Hiện đang có tại Showroom:</p>
                <div className="space-y-2">
                  {[
                    { address: "49 Thái Hà, Hà Nội", phone: "0918.557.006" },
                    { address: "63 Trần Thái Tông, HN", phone: "0862.136.488" },
                  ].map((store) => (
                    <div key={store.address} className="text-xs text-gray-500 space-y-0.5">
                      <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" />{store.address}</p>
                      <p className="flex items-center gap-1 ml-4"><Phone className="w-3 h-3 text-green-500" />{store.phone}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies sidebar */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-3 uppercase">Trợ giúp</h3>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  <li className="flex items-center gap-2 hover:text-blue-600 cursor-pointer transition-colors">
                    <Truck className="w-4 h-4 text-blue-500" /> Hướng dẫn mua hàng
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-600 cursor-pointer transition-colors">
                    <Shield className="w-4 h-4 text-green-500" /> Chính sách bảo hành
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-600 cursor-pointer transition-colors">
                    <RotateCcw className="w-4 h-4 text-amber-500" /> Chính sách đổi trả
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Specs & Reviews Tabs */}
        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button className="px-6 py-4 text-sm font-semibold text-[#1A4B9C] border-b-2 border-[#1A4B9C]">Thông số kỹ thuật</button>
            <button className="px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">Mô tả</button>
            <button className="px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">Đánh giá ({product.reviewCount || 0})</button>
          </div>
          <div className="p-6">
            {attrEntries.length > 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  {attrEntries.map(([key, value], i) => (
                    <tr key={key} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="py-2.5 px-4 text-gray-500 w-1/3 font-medium">{key}</td>
                      <td className="py-2.5 px-4 text-gray-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-sm">Chưa có thông số kỹ thuật.</p>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-md mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
