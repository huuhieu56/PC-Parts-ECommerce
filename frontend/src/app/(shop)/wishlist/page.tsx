"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, WishlistItem } from "@/types";
import { toast } from "sonner";

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
    else setLoading(false);
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const res = await api.get<ApiResponse<WishlistItem[]>>("/wishlist");
      setItems(res.data.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems(items.filter((i) => i.productId !== productId));
      toast.success("Đã xóa khỏi danh sách yêu thích");
    } catch {
      toast.error("Không thể xóa");
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">Đăng nhập để xem danh sách yêu thích</h2>
        <Link href="/login"><Button className="bg-gradient-to-r from-blue-600 to-purple-600">Đăng nhập</Button></Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-slate-900/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Heart className="w-8 h-8 text-red-400" />Yêu thích
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Danh sách yêu thích trống</h2>
          <Link href="/products"><Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600">Khám phá sản phẩm</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.productId} className="bg-slate-900/50 border-slate-800/50 overflow-hidden group">
              <div className="aspect-square bg-slate-800/50 flex items-center justify-center">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="object-contain w-full h-full p-4" />
                ) : (
                  <div className="w-16 h-16 bg-slate-700/50 rounded-lg" />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-white mb-2 line-clamp-2">{item.productName}</h3>
                <p className="text-lg font-bold text-blue-400 mb-3">{formatPrice(item.sellingPrice)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-700 text-slate-300">
                    <ShoppingCart className="w-3 h-3 mr-1" />Thêm vào giỏ
                  </Button>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
