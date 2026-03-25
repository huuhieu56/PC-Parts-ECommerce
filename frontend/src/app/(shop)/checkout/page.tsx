"use client";

import Link from "next/link";
import { ChevronRight, ShoppingCart, CreditCard, Truck, MapPin } from "lucide-react";
import { useState } from "react";

function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("COD");

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/cart" className="hover:text-blue-600">Giỏ hàng</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Thanh toán</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Thanh toán đơn hàng</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Forms */}
          <div className="lg:col-span-2 space-y-5">
            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-blue-600" /> 1. Địa chỉ giao hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">Họ tên *</label><input className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Nguyễn Văn A" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Số điện thoại *</label><input className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0912 345 678" /></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Địa chỉ *</label><input className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="123 Đường ABC, Phường XYZ" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Tỉnh/Thành phố</label><select className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"><option>TP. Hồ Chí Minh</option><option>Hà Nội</option><option>Đà Nẵng</option></select></div>
                <div><label className="block text-sm text-gray-600 mb-1">Quận/Huyện</label><select className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"><option>Quận 1</option><option>Quận 7</option></select></div>
              </div>
              <div className="mt-4"><label className="block text-sm text-gray-600 mb-1">Ghi chú</label><textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} placeholder="Ghi chú cho đơn hàng (tùy chọn)" /></div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-blue-600" /> 2. Phương thức thanh toán</h2>
              <div className="space-y-3">
                {[
                  { value: "COD", label: "Thanh toán khi nhận hàng (COD)", icon: Truck },
                  { value: "VNPAY", label: "VNPay", icon: CreditCard },
                  { value: "MOMO", label: "MoMo", icon: CreditCard },
                  { value: "BANK", label: "Chuyển khoản ngân hàng", icon: CreditCard },
                ].map(m => (
                  <label key={m.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === m.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="payment" value={m.value} checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} className="text-blue-600 focus:ring-blue-500" />
                    <m.icon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-32">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><ShoppingCart className="w-5 h-5 text-blue-600" /> Tóm tắt đơn hàng</h2>
              <div className="space-y-3 text-sm">
                {[
                  { name: "Intel Core i5-13600K", qty: 1, price: 6990000 },
                  { name: "ASUS ROG STRIX Z790-A", qty: 1, price: 8990000 },
                  { name: "G.Skill DDR5 32GB", qty: 2, price: 3490000 },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600 truncate mr-2">{item.name} x{item.qty}</span>
                    <span className="text-gray-900 font-medium shrink-0">{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
                <hr className="border-gray-200" />
                <div className="flex justify-between text-gray-500"><span>Tạm tính:</span><span>{formatPrice(22960000)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Phí vận chuyển:</span><span>{formatPrice(30000)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Giảm giá:</span><span className="text-green-600">-{formatPrice(500000)}</span></div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-lg"><span className="text-gray-900">Tổng cộng:</span><span className="text-[#E31837]">{formatPrice(22490000)}</span></div>
              </div>
              <button className="w-full mt-6 bg-[#E31837] hover:bg-red-700 text-white py-3.5 rounded-lg font-bold text-base transition-colors">
                ĐẶT HÀNG
              </button>
              <p className="text-xs text-gray-400 mt-3 text-center">Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
