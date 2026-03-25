"use client";

import Link from "next/link";
import { ChevronRight, Heart, ShoppingCart, Trash2, Cpu } from "lucide-react";
import { useState, useEffect } from "react";

interface WishlistItem { id: number; productId: number; productName: string; productSlug: string; productPrice: number; productImage: string | null; }
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlist() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_URL}/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setItems(await res.json());
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetchWishlist();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link><ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Sản phẩm yêu thích</span>
          </nav>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Sản phẩm yêu thích</h1>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-lg h-48 animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Chưa có sản phẩm yêu thích</h2>
            <Link href="/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Khám phá sản phẩm →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="aspect-square bg-gray-50 flex items-center justify-center"><Cpu className="w-10 h-10 text-gray-400" /></div>
                <div className="p-3">
                  <Link href={`/products/${item.productSlug}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2">{item.productName}</Link>
                  <p className="text-[#E31837] font-bold mt-1">{formatPrice(item.productPrice)}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded font-medium hover:bg-blue-700 flex items-center justify-center gap-1"><ShoppingCart className="w-3 h-3" /> Mua</button>
                    <button className="px-2 py-1.5 border border-gray-200 rounded text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
