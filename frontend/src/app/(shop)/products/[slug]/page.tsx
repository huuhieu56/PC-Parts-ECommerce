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
  categoryId: number;
  categoryName: string;
  brandName: string;
  images: string[];
  warranty: string;
  attributes: Record<string, string>;
  discountPercent: number;
}

interface ReviewDto {
  id: number;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: string;
}

interface RelatedProduct {
  id: number;
  name: string;
  slug: string;
  sellingPrice: number;
  originalPrice: number;
  images: { id: number; imageUrl: string; isPrimary: boolean; sortOrder: number }[];
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
  const warrantyAttr = attrs["Bảo hành"] || attrs["Warranty"] || attrs["bảo hành"];
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    sku: dto.sku,
    description: dto.description || '',
    price: dto.sellingPrice,
    originalPrice: dto.originalPrice > dto.sellingPrice ? dto.originalPrice : null,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    brandName: dto.brandName,
    images: (dto.images || []).sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.imageUrl),
    warranty: warrantyAttr || "12 tháng",
    attributes: attrs,
    discountPercent: discount,
  };
}

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + " đ";
}

function ReviewForm({ productId, onSubmitted }: { productId: number; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { setMsg("Vui lòng chọn số sao"); setMsgError(true); return; }
    if (!comment.trim()) { setMsg("Vui lòng nhập nội dung đánh giá"); setMsgError(true); return; }
    setSubmitting(true);
    setMsg("");
    try {
      await api.post("/reviews", { productId, rating, comment: comment.trim() });
      setMsg("Đánh giá đã được gửi thành công!");
      setMsgError(false);
      setRating(0);
      setComment("");
      onSubmitted();
    } catch {
      setMsg("Bạn cần đăng nhập để đánh giá, hoặc đã đánh giá sản phẩm này rồi.");
      setMsgError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Viết đánh giá</h3>
      <div className="flex items-center gap-1 mb-3">
        <span className="text-sm text-gray-500 mr-2">Đánh giá:</span>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(s)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star className={`w-6 h-6 cursor-pointer transition-colors ${s <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-200"}`} />
          </button>
        ))}
        {rating > 0 && <span className="text-sm text-amber-600 ml-2 font-medium">{rating}/5</span>}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      {msg && <p className={`text-xs mt-1 ${msgError ? "text-red-500" : "text-green-600"}`}>{msg}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {submitting ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </div>
  );
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"specs" | "desc" | "reviews">("specs");
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

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

  // Fetch product
  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products/${resolvedParams.slug}`);
        if (res.ok) {
          const json = await res.json();
          const dto: ProductDto = json.data || json;
          const mapped = mapProductDto(dto);
          setProduct(mapped);

          // Fetch reviews for this product
          fetchReviews(dto.id);
          // Fetch related products (same category)
          fetchRelatedProducts(dto.categoryId, dto.id);
        }
      } catch {
        console.error("Failed to fetch product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [resolvedParams.slug]);

  async function fetchReviews(productId: number) {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_URL}/reviews/product/${productId}?page=0&size=10`);
      if (res.ok) {
        const json = await res.json();
        const page = json.data || json;
        const items: ReviewDto[] = page.content || [];
        setReviews(items);
        setReviewCount(page.totalElements || items.length);
        if (items.length > 0) {
          const avg = items.reduce((sum, r) => sum + r.rating, 0) / items.length;
          setAvgRating(Math.round(avg * 10) / 10);
        }
      }
    } catch { /* reviews may not exist yet */ } finally {
      setReviewsLoading(false);
    }
  }

  async function fetchRelatedProducts(categoryId: number, excludeId: number) {
    try {
      const res = await fetch(`${API_URL}/products?categoryId=${categoryId}&size=5`);
      if (res.ok) {
        const json = await res.json();
        const page = json.data || json;
        const items: RelatedProduct[] = (page.content || []).filter((p: RelatedProduct) => p.id !== excludeId);
        setRelatedProducts(items.slice(0, 5));
      }
    } catch { /* empty */ }
  }

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
  const hasImages = product.images.length > 0;

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
              <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden">
                {hasImages ? (
                  <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <Cpu className="w-24 h-24 text-gray-300" />
                )}
              </div>
              {/* Thumbnails */}
              {hasImages && product.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-16 h-16 rounded-md border-2 overflow-hidden shrink-0 transition-colors ${selectedImage === idx ? "border-blue-500" : "border-gray-200 hover:border-gray-400"}`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
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
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{avgRating > 0 ? avgRating.toFixed(1) : "Chưa có"} ({reviewCount} đánh giá)</span>
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
                      <li className="text-sm text-blue-600 cursor-pointer hover:text-blue-700" onClick={() => setActiveTab("specs")}>Xem thêm &gt;</li>
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
                  BH: {product.warranty}
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  ✓ Còn hàng
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
                  <button disabled className="border border-gray-300 text-gray-400 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed relative group">
                    MUA TRẢ GÓP
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Sắp ra mắt</span>
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
                  <span className="text-sm text-gray-900 font-semibold">1900.6868</span>
                </div>
                <hr className="border-gray-100 mb-3" />
                <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Hỗ trợ khách hàng:</p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" />Giao hàng toàn quốc</p>
                    <p className="flex items-center gap-1 ml-4"><Phone className="w-3 h-3 text-green-500" />Hotline: 1900.6868</p>
                  </div>
                </div>
              </div>

              {/* Policies sidebar */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-3 uppercase">Trợ giúp</h3>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  <li>
                    <Link href="/products" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                      <Truck className="w-4 h-4 text-blue-500" /> Hướng dẫn mua hàng
                    </Link>
                  </li>
                  <li>
                    <Link href="/warranty" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                      <Shield className="w-4 h-4 text-green-500" /> Chính sách bảo hành
                    </Link>
                  </li>
                  <li>
                    <Link href="/warranty" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                      <RotateCcw className="w-4 h-4 text-amber-500" /> Chính sách đổi trả
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Specs & Reviews Tabs */}
        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("specs")}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === "specs" ? "text-[#1A4B9C] border-[#1A4B9C]" : "text-gray-500 hover:text-gray-700 border-transparent"}`}
            >
              Thông số kỹ thuật
            </button>
            <button
              onClick={() => setActiveTab("desc")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "desc" ? "text-[#1A4B9C] border-[#1A4B9C]" : "text-gray-500 hover:text-gray-700 border-transparent"}`}
            >
              Mô tả
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "reviews" ? "text-[#1A4B9C] border-[#1A4B9C]" : "text-gray-500 hover:text-gray-700 border-transparent"}`}
            >
              Đánh giá ({reviewCount})
            </button>
          </div>
          <div className="p-6">
            {activeTab === "specs" && (
              attrEntries.length > 0 ? (
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
              )
            )}

            {activeTab === "desc" && (
              product.description ? (
                <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p className="text-gray-500 text-sm">Chưa có mô tả sản phẩm.</p>
              )
            )}

            {activeTab === "reviews" && (
              reviewsLoading ? (
                <div className="text-gray-400 text-sm">Đang tải đánh giá...</div>
              ) : (
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-6">
                      <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Chưa có đánh giá cho sản phẩm này.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{r.customerName || "Khách hàng"}</span>
                            <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                          <p className="text-sm text-gray-600">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Review Form */}
                  <ReviewForm productId={product.id} onSubmitted={() => fetchReviews(product.id)} />
                </div>
              )
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sản phẩm liên quan</h2>
          {relatedProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">Không có sản phẩm liên quan.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.map((p) => {
                const img = p.images?.find((i) => i.isPrimary) || p.images?.[0];
                const discount = p.originalPrice > p.sellingPrice
                  ? Math.round((1 - p.sellingPrice / p.originalPrice) * 100)
                  : 0;
                return (
                  <Link key={p.id} href={`/products/${p.slug}`} className="group h-full">
                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                      <div className="aspect-square p-3 relative">
                        {img ? (
                          <img src={img.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Cpu className="w-8 h-8 text-gray-300" /></div>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">-{discount}%</span>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 min-h-[2.5rem] leading-snug">{p.name}</p>
                        <div className="mt-auto">
                          {p.originalPrice > p.sellingPrice && (
                            <p className="text-xs text-gray-400 line-through">{formatPrice(p.originalPrice)}</p>
                          )}
                          <p className="text-[#E31837] font-bold">{formatPrice(p.sellingPrice)}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
