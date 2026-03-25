"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Heart, ChevronRight, Star, Minus, Plus, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, Product, PageResponse } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

interface ReviewDto {
  id: number;
  productId: number;
  rating: number;
  content: string;
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  // Review state
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewOrderId, setReviewOrderId] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const res = await api.get<ApiResponse<Product>>(`/products/slug/${params.slug}`);
      setProduct(res.data.data);
      try {
        const reviewRes = await api.get<ApiResponse<PageResponse<ReviewDto>>>(`/reviews/product/${res.data.data.id}?page=0&size=20`);
        setReviews(reviewRes.data.data.content);
      } catch {
        setReviews([]);
      }
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      const sessionId = !isAuthenticated ? getSessionId() : undefined;
      await api.post("/cart/items", { productId: product.id, quantity }, {
        headers: sessionId ? { "X-Session-Id": sessionId } : {},
      });
      toast.success("Đã thêm vào giỏ hàng");
    } catch {
      toast.error("Không thể thêm vào giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  const addToWishlist = async () => {
    if (!product || !isAuthenticated) {
      toast.info("Vui lòng đăng nhập để thêm vào wishlist");
      router.push("/login");
      return;
    }
    try {
      await api.post(`/wishlist/${product.id}`);
      toast.success("Đã thêm vào danh sách yêu thích");
    } catch {
      toast.error("Không thể thêm vào wishlist");
    }
  };

  const submitReview = async () => {
    if (!product || !isAuthenticated) return;
    if (!reviewOrderId) { toast.error("Vui lòng nhập mã đơn hàng"); return; }
    setSubmittingReview(true);
    try {
      await api.post("/reviews", {
        productId: product.id,
        orderId: Number(reviewOrderId),
        rating: reviewRating,
        content: reviewContent,
      });
      toast.success("Đánh giá thành công!");
      setShowReviewForm(false);
      setReviewContent("");
      setReviewOrderId("");
      const reviewRes = await api.get<ApiResponse<PageResponse<ReviewDto>>>(`/reviews/product/${product.id}?page=0&size=20`);
      setReviews(reviewRes.data.data.content);
    } catch {
      toast.error("Không thể gửi đánh giá. Bạn có thể đã đánh giá sản phẩm này.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-slate-900/50 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-900/50 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-slate-900/50 rounded animate-pulse w-1/2" />
            <div className="h-12 bg-slate-900/50 rounded animate-pulse w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h2>
        <Link href="/products">
          <Button className="bg-blue-600 hover:bg-blue-700">Quay lại sản phẩm</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/products" className="hover:text-white transition-colors">Sản phẩm</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square bg-slate-900/50 rounded-2xl border border-slate-800/50 flex items-center justify-center overflow-hidden mb-4">
            {product.images?.[selectedImage] ? (
              <img src={product.images[selectedImage].imageUrl} alt={product.name} className="object-contain w-full h-full p-8" />
            ) : (
              <div className="w-32 h-32 bg-slate-800/50 rounded-xl" />
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button key={img.id} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${i === selectedImage ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-slate-700 hover:border-slate-500"}`}>
                  <img src={img.imageUrl} alt="" className="object-contain w-full h-full p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Badge variant="outline" className="mb-3 text-blue-400 border-blue-500/30">{product.brandName}</Badge>
          <h1 className="text-2xl lg:text-3xl font-bold mb-4">{product.name}</h1>

          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                ))}
              </div>
              <span className="text-sm text-slate-400">({reviews.length} đánh giá)</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-slate-500">SKU: {product.sku}</span>
            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">{product.condition === "NEW" ? "Mới 100%" : product.condition}</Badge>
            <Badge className={product.status === "ACTIVE" ? "bg-green-600" : "bg-red-600"}>{product.status === "ACTIVE" ? "Còn hàng" : "Hết hàng"}</Badge>
          </div>

          <Separator className="my-6 bg-slate-800" />

          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">{formatPrice(product.sellingPrice)}</span>
              {product.originalPrice > product.sellingPrice && (
                <>
                  <span className="text-lg text-slate-500 line-through">{formatPrice(product.originalPrice)}</span>
                  <Badge className="bg-red-500">-{Math.round((1 - product.sellingPrice / product.originalPrice) * 100)}%</Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-slate-400">Số lượng:</span>
            <div className="flex items-center border border-slate-700 rounded-lg">
              <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-slate-400 hover:text-white h-10 w-10"><Minus className="w-4 h-4" /></Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="text-slate-400 hover:text-white h-10 w-10"><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <Button onClick={addToCart} disabled={addingToCart || product.status !== "ACTIVE"}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/20">
              <ShoppingCart className="w-5 h-5 mr-2" />{addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </Button>
            <Button variant="outline" size="icon" onClick={addToWishlist}
              className="h-12 w-12 border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30">
              <Heart className="w-5 h-5" />
            </Button>
          </div>

          {product.attributes && product.attributes.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800/50 p-6">
              <h3 className="font-semibold mb-4 text-sm text-slate-300">Thông số kỹ thuật</h3>
              <div className="space-y-3">
                {product.attributes.map((attr) => (
                  <div key={attr.attributeId} className="flex justify-between text-sm">
                    <span className="text-slate-400">{attr.attributeName}</span>
                    <span className="text-white font-medium">{attr.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {product.description && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-sm text-slate-300">Mô tả sản phẩm</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <Separator className="mb-8 bg-slate-800" />
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-blue-400" />Đánh giá sản phẩm
            {reviews.length > 0 && <span className="text-lg font-normal text-slate-400">({reviews.length})</span>}
          </h2>
          {isAuthenticated && (
            <Button onClick={() => setShowReviewForm(!showReviewForm)} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Star className="w-4 h-4 mr-2" />Viết đánh giá
            </Button>
          )}
        </div>

        {showReviewForm && (
          <Card className="bg-slate-900/50 border-slate-800/50 p-6 mb-8 animate-in slide-in-from-top-2">
            <h3 className="font-semibold mb-4">Viết đánh giá</h3>
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Đánh giá</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)} className="p-1">
                    <Star className={`w-7 h-7 transition-colors ${s <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-slate-600 hover:text-yellow-400/50"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Mã đơn hàng (bắt buộc)</label>
              <input type="number" placeholder="Nhập mã đơn hàng đã mua sản phẩm này" value={reviewOrderId}
                onChange={(e) => setReviewOrderId(e.target.value)}
                className="w-full md:w-1/3 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Nội dung</label>
              <textarea placeholder="Chia sẻ trải nghiệm..." value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
                className="w-full h-24 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3">
              <Button onClick={submitReview} disabled={submittingReview} className="bg-blue-600">
                <Send className="w-4 h-4 mr-2" />{submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)} className="border-slate-700 text-slate-300">Hủy</Button>
            </div>
          </Card>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Chưa có đánh giá nào cho sản phẩm này</p>
            {!isAuthenticated && (
              <p className="text-sm text-slate-500 mt-2"><Link href="/login" className="text-blue-400 hover:underline">Đăng nhập</Link> để viết đánh giá</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="bg-slate-900/50 border-slate-800/50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString("vi-VN") : ""}</span>
                </div>
                {review.content && <p className="text-sm text-slate-300 leading-relaxed">{review.content}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("sessionId");
  if (!sid) {
    sid = "session_" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("sessionId", sid);
  }
  return sid;
}
