"use client";

import Link from "next/link";
import { ShoppingCart, Trash2, Minus, Plus, ChevronRight, Tag, FileText, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image: string | null;
  warranty: number;
}

const mockItems: CartItem[] = [
  { id: 1, name: "CPU Intel Core i5-13600K (3.5GHz up to 5.1GHz, 24MB Cache, 125W)", sku: "CPU0156", price: 6990000, quantity: 1, image: null, warranty: 36 },
  { id: 2, name: "Mainboard ASUS ROG STRIX Z790-A GAMING WIFI D5", sku: "MB00456", price: 8990000, quantity: 1, image: null, warranty: 36 },
  { id: 3, name: "RAM G.Skill Trident Z5 RGB DDR5 32GB (2x16GB) 6000MHz", sku: "RAM0234", price: 3490000, quantity: 2, image: null, warranty: 24 },
];

function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

export default function CartPage() {
  const [items, setItems] = useState(mockItems);
  const [couponCode, setCouponCode] = useState("");

  const updateQty = (id: number, delta: number) => {
    setItems(items.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };
  const removeItem = (id: number) => setItems(items.filter(i => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = 0;
  const discount = 0;
  const total = subtotal - discount + shipping;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Giỏ hàng</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {items.length === 0 ? (
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
                <div key={item.id} className={`p-4 ${idx > 0 ? "border-t border-gray-200" : ""}`}>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.sku.toLowerCase()}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2">{item.name}</Link>
                      <p className="text-xs text-gray-400 mt-0.5">Mã SP: {item.sku}</p>
                      <p className="text-xs text-gray-400">Bảo hành: {item.warranty} tháng</p>
                      <div className="mt-2 text-xs text-green-600">
                        <p>Khuyến mãi:</p>
                        <p className="text-gray-500">• Ưu đãi giảm tới 200.000 VNĐ khi mua phần mềm</p>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-xs text-red-500 hover:text-red-600 mt-2 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm text-gray-400">{formatPrice(item.price)}</p>
                      <div className="flex items-center border border-gray-300 rounded mt-2 w-fit ml-auto">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center text-sm font-medium border-x border-gray-300">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                      </div>
                      <p className="text-[#E31837] font-bold mt-2">Tổng: {formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1"><Tag className="w-4 h-4 text-blue-600" /> Mã giảm giá / Quà tặng</h3>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Nhập mã giảm giá" className="flex-1 h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button className="bg-blue-600 text-white px-4 h-10 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Áp dụng</button>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Phí vận chuyển:</span><span>{formatPrice(shipping)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Tổng cộng:</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Giảm giá:</span><span>{formatPrice(discount)}</span></div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between font-bold text-lg"><span className="text-gray-900">Thanh toán:</span><span className="text-[#E31837]">{formatPrice(total)}</span></div>
                  <p className="text-xs text-gray-400">(Giá chưa bao gồm phí vận chuyển ngoại tỉnh)</p>
                </div>
              </div>
            </div>

            {/* Action links + buttons */}
            <div className="flex items-center justify-center gap-4 mb-4 text-sm text-gray-500">
              <button className="flex items-center gap-1 hover:text-blue-600"><FileText className="w-4 h-4" /> In báo giá</button>
              <button className="flex items-center gap-1 hover:text-blue-600"><FileSpreadsheet className="w-4 h-4" /> Tải file excel</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
              <Link href="/checkout" className="bg-[#1A4B9C] hover:bg-blue-900 text-white py-3.5 rounded-lg font-bold text-center transition-colors text-base">
                ĐẶT HÀNG
              </Link>
              <button className="bg-[#E31837] hover:bg-red-700 text-white py-3.5 rounded-lg font-bold text-center transition-colors text-base">
                MUA TRẢ GÓP
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
