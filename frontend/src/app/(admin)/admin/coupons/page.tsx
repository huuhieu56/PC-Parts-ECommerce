"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Tag } from "lucide-react";
import api from "@/lib/api";

function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

interface Coupon { id: number; code: string; discountType: string; discountValue: number; minOrderAmount: number; maxUses: number; currentUses: number; isActive: boolean; expiryDate: string; }

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const res = await api.get("/coupons");
        const data = res.data.data || res.data;
        setCoupons(Array.isArray(data) ? data : (data.content || []));
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetchCoupons();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mã giảm giá</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Tạo mã</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input placeholder="Tìm mã giảm giá..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div></div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : coupons.length === 0 ? (
          <div className="p-8 text-center"><Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">Chưa có mã giảm giá.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Mã</th><th className="px-4 py-3 font-medium">Giảm giá</th><th className="px-4 py-3 font-medium">Đơn tối thiểu</th><th className="px-4 py-3 font-medium">Đã dùng</th><th className="px-4 py-3 font-medium">Hết hạn</th><th className="px-4 py-3 font-medium">Trạng thái</th></tr></thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                  <td className="px-4 py-3 text-[#E31837] font-medium">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : formatPrice(c.discountValue)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatPrice(c.minOrderAmount)}</td>
                  <td className="px-4 py-3 text-gray-500">{c.currentUses}/{c.maxUses}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.expiryDate).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.isActive ? "Hoạt động" : "Vô hiệu"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
