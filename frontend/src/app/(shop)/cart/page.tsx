"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, CartDto } from "@/types";
import { toast } from "sonner";

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    fetchCart();
  }, []);

  const getHeaders = () => {
    if (!isAuthenticated) {
      const sid = getSessionId();
      return { "X-Session-Id": sid };
    }
    return {};
  };

  const fetchCart = async () => {
    try {
      const res = await api.get<ApiResponse<CartDto>>("/cart", { headers: getHeaders() });
      setCart(res.data.data);
    } catch {
      setCart({ items: [], totalPrice: 0, totalItems: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    try {
      const res = await api.put<ApiResponse<CartDto>>(
        `/cart/items/${productId}?quantity=${quantity}`,
        null,
        { headers: getHeaders() }
      );
      setCart(res.data.data);
    } catch {
      toast.error("Không thể cập nhật số lượng");
    }
  };

  const removeItem = async (productId: number) => {
    try {
      const res = await api.delete<ApiResponse<CartDto>>(
        `/cart/items/${productId}`,
        { headers: getHeaders() }
      );
      setCart(res.data.data);
      toast.success("Đã xóa sản phẩm");
    } catch {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-blue-400" />
        Giỏ hàng
        {items.length > 0 && (
          <span className="text-lg font-normal text-slate-400">({items.length} sản phẩm)</span>
        )}
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Giỏ hàng trống</h2>
          <p className="text-slate-400 mb-6">Hãy thêm sản phẩm vào giỏ hàng</p>
          <Link href="/products">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
              Khám phá sản phẩm
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="bg-slate-900/50 border-slate-800/50 p-4 flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 bg-slate-800/50 rounded-lg flex-shrink-0 flex items-center justify-center">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="object-contain w-full h-full p-2" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-700/50 rounded" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{item.productName}</h3>
                  <p className="text-lg font-bold text-blue-400 mt-1">{formatPrice(item.sellingPrice)}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border border-slate-700 rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.productId)}
                      className="h-8 w-8 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {formatPrice(item.sellingPrice * item.quantity)}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 sticky top-24">
              <h3 className="font-semibold text-lg mb-4">Tóm tắt đơn hàng</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tạm tính</span>
                  <span className="text-white font-medium">{formatPrice(cart?.totalPrice ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phí vận chuyển</span>
                  <span className="text-green-400">Miễn phí</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Mã giảm giá"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white text-sm"
                  />
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 whitespace-nowrap">
                    <Tag className="w-3 h-3 mr-1" />Áp dụng
                  </Button>
                </div>
              </div>

              <Separator className="my-4 bg-slate-700" />
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-blue-400">{formatPrice(cart?.totalPrice ?? 0)}</span>
              </div>

              <Link href={isAuthenticated ? "/checkout" : "/login"}>
                <Button className="w-full mt-6 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold shadow-lg shadow-blue-500/20">
                  {isAuthenticated ? "Thanh toán" : "Đăng nhập để thanh toán"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      )}
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
