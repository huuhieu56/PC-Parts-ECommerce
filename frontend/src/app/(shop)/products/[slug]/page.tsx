"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Heart, ChevronRight, Star, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, Product } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const res = await api.get<ApiResponse<Product>>(`/products/slug/${params.slug}`);
      setProduct(res.data.data);
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/products" className="hover:text-white transition-colors">Sản phẩm</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-slate-900/50 rounded-2xl border border-slate-800/50 flex items-center justify-center overflow-hidden mb-4">
            {product.images?.[selectedImage] ? (
              <img
                src={product.images[selectedImage].imageUrl}
                alt={product.name}
                className="object-contain w-full h-full p-8"
              />
            ) : (
              <div className="w-32 h-32 bg-slate-800/50 rounded-xl" />
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                    i === selectedImage ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="object-contain w-full h-full p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <Badge variant="outline" className="mb-3 text-blue-400 border-blue-500/30">
            {product.brandName}
          </Badge>
          <h1 className="text-2xl lg:text-3xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-slate-500">SKU: {product.sku}</span>
            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
              {product.condition === "NEW" ? "Mới 100%" : product.condition}
            </Badge>
            <Badge className={product.status === "ACTIVE" ? "bg-green-600" : "bg-red-600"}>
              {product.status === "ACTIVE" ? "Còn hàng" : "Hết hàng"}
            </Badge>
          </div>

          <Separator className="my-6 bg-slate-800" />

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">{formatPrice(product.sellingPrice)}</span>
              {product.originalPrice > product.sellingPrice && (
                <>
                  <span className="text-lg text-slate-500 line-through">{formatPrice(product.originalPrice)}</span>
                  <Badge className="bg-red-500">
                    -{Math.round((1 - product.sellingPrice / product.originalPrice) * 100)}%
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-slate-400">Số lượng:</span>
            <div className="flex items-center border border-slate-700 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-slate-400 hover:text-white h-10 w-10"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="text-slate-400 hover:text-white h-10 w-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <Button
              onClick={addToCart}
              disabled={addingToCart || product.status !== "ACTIVE"}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/20"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={addToWishlist}
              className="h-12 w-12 border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>

          {/* Attributes */}
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

          {/* Description */}
          {product.description && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-sm text-slate-300">Mô tả sản phẩm</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
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
