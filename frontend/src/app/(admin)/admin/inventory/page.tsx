"use client";

import { useEffect, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface InventoryItem { id: number; productName: string; productSku: string; quantity: number; reservedQuantity: number; }

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_URL}/inventory?page=0&size=50`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const data = await res.json(); setItems(data.content || data || []); }
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetch_();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý kho hàng</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input placeholder="Tìm sản phẩm trong kho..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Sản phẩm</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Tồn kho</th><th className="px-4 py-3 font-medium">Đã đặt</th><th className="px-4 py-3 font-medium">Khả dụng</th><th className="px-4 py-3 font-medium">Trạng thái</th></tr></thead>
            <tbody>
              {items.map(i => {
                const available = i.quantity - (i.reservedQuantity || 0);
                const low = available < 10;
                return (
                  <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{i.productName}</td>
                    <td className="px-4 py-3 text-gray-500">{i.productSku}</td>
                    <td className="px-4 py-3 text-gray-900">{i.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{i.reservedQuantity || 0}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{available}</td>
                    <td className="px-4 py-3">
                      {low ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5 w-fit"><AlertTriangle className="w-3 h-3" /> Sắp hết</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Còn hàng</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
