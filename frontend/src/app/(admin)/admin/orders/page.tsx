"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }
const statusColors: Record<string, string> = { PENDING: "bg-amber-100 text-amber-700", CONFIRMED: "bg-blue-100 text-blue-700", PROCESSING: "bg-blue-100 text-blue-700", SHIPPED: "bg-purple-100 text-purple-700", DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" };

interface Order { id: number; orderNumber: string; totalAmount: number; status: string; createdAt: string; }

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_URL}/orders?page=0&size=50`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const data = await res.json(); setOrders(data.content || []); }
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetch_();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý đơn hàng</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input placeholder="Tìm đơn hàng..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Mã đơn</th><th className="px-4 py-3 font-medium">Ngày tạo</th><th className="px-4 py-3 font-medium">Tổng tiền</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium">Thao tác</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">#{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-[#E31837] font-medium">{formatPrice(o.totalAmount)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] || "bg-gray-100 text-gray-600"}`}>{o.status}</span></td>
                  <td className="px-4 py-3"><button className="text-blue-600 hover:text-blue-700 text-xs font-medium">Chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
