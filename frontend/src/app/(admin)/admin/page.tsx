"use client";

import { useEffect, useState } from "react";
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, BarChart3 } from "lucide-react";
import api from "@/lib/api";

function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Array<{ id: number; orderNumber: string; totalAmount: number; status: string }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0, recentOrders: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get("/admin/dashboard/stats");
        const data = res.data.data || res.data;
        setStats({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          totalProducts: data.totalProducts || 0,
          totalUsers: data.totalUsers || 0,
          recentOrders: data.recentOrders || [],
        });
      } catch {
        // If not authenticated or no dashboard API, show defaults
        // Try fetching product count as a fallback
        try {
          const prodRes = await api.get("/products?page=0&size=1");
          const totalProducts = prodRes.data.data?.totalElements || 0;
          setStats(prev => ({ ...prev, totalProducts }));
        } catch { /* empty */ }
      } finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  const cards = [
    { label: "Doanh thu", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "text-green-600 bg-green-50" },
    { label: "Đơn hàng", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
    { label: "Sản phẩm", value: stats.totalProducts.toString(), icon: Package, color: "text-purple-600 bg-purple-50" },
    { label: "Người dùng", value: stats.totalUsers.toString(), icon: Users, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>
      {loading ? (
        <div className="text-center text-gray-400 py-12">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map(c => (
              <div key={c.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{c.label}</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.color}`}><c.icon className="w-5 h-5" /></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +12% so với tháng trước</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-blue-600" /> Đơn hàng gần đây</h2>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có đơn hàng.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b border-gray-200"><th className="pb-2 font-medium">Mã đơn</th><th className="pb-2 font-medium">Tổng tiền</th><th className="pb-2 font-medium">Trạng thái</th></tr></thead>
                <tbody>
                  {stats.recentOrders.map(o => (
                    <tr key={o.id} className="border-b border-gray-50"><td className="py-2 text-gray-900 font-medium">#{o.orderNumber}</td><td className="py-2 text-[#E31837] font-medium">{formatPrice(o.totalAmount)}</td><td className="py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{o.status}</span></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
