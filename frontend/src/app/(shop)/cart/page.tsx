"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Trash2, Minus, Plus, ChevronRight, Tag, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import api from "@/lib/api";


export default function CartPage() {
  const { items, totalPrice, totalItems, loading, fetchCart, updateItem, removeItem } = useCartStore();
  const [couponCode, setCouponCode] = useState("");
  const [mounted, setMounted] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponError, setCouponError] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCart();
  }, [fetchCart]);

  if (!mounted) return null;

  const shipping = 0;
  const total = totalPrice - discount + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponMsg("");
    setCouponError(false);
    try {
      const res = await api.get(`/coupons/validate?code=${couponCode.trim()}&orderAmount=${totalPrice}`);
      const coupon = res.data.data || res.data;
      let discountAmount = 0;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = Math.round(totalPrice * coupon.discountValue / 100);
      } else {
        discountAmount = coupon.discountValue;
      }
      setDiscount(discountAmount);
      setCouponMsg(`Giảm ${formatPrice(discountAmount)}`);
      setCouponError(false);
    } catch {
      setDiscount(0);
      setCouponMsg("Mã giảm giá không hợp lệ hoặc đã hết hạn");
      setCouponError(true);
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Giỏ hàng ({totalItems})</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-pulse text-gray-400">Đang tải giỏ hàng...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-500 text-sm mb-6">Hãy thêm sản phẩm vào giỏ hàng.</p>
            <Link href="/products" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <>
            {/* Product List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
              {items.map((item, idx) => (
                <div key={item.productId} className={`p-4 ${idx > 0 ? "border-t border-gray-200" : ""}`}>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <Cpu className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.productName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Đơn giá: {formatPrice(item.sellingPrice)}</p>
                      <button onClick={() => removeItem(item.productId)} className="text-xs text-red-500 hover:text-red-600 mt-2 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center border border-gray-300 rounded mt-2 w-fit ml-auto">
                        <button onClick={() => updateItem(item.productId, Math.max(1, item.quantity - 1))} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center text-sm font-medium border-x border-gray-300">{item.quantity}</span>
                        <button onClick={() => updateItem(item.productId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                      </div>
                      <p className="text-[#E31837] font-bold mt-2">{formatPrice(item.sellingPrice * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1"><Tag className="w-4 h-4 text-blue-600" /> Mã giảm giá</h3>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Nhập mã giảm giá" className="flex-1 h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleApplyCoupon} disabled={applyingCoupon} className="bg-blue-600 text-white px-4 h-10 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">{applyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}</button>
                </div>
                {couponMsg && <p className={`text-xs mt-2 ${couponError ? "text-red-500" : "text-green-600"}`}>{couponMsg}</p>}
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Tạm tính ({totalItems} sản phẩm):</span><span>{formatPrice(totalPrice)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Phí vận chuyển:</span><span>{formatPrice(shipping)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá:</span><span>-{formatPrice(discount)}</span></div>}
                  <hr className="border-gray-200" />
                  <div className="flex justify-between font-bold text-lg"><span className="text-gray-900">Thanh toán:</span><span className="text-[#E31837]">{formatPrice(total)}</span></div>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center justify-center gap-4 max-w-xl mx-auto">
              <Link href="/checkout" className="flex-1 bg-[#1A4B9C] hover:bg-blue-900 text-white py-3.5 rounded-lg font-bold text-center transition-colors text-base">
                ĐẶT HÀNG
              </Link>
              <Link href="/products" className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3.5 rounded-lg font-bold text-center transition-colors text-base">
                TIẾP TỤC MUA SẮM
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
