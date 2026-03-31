"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Package, ShoppingCart, Users, BarChart3, ArrowUpRight, TrendingUp } from "lucide-react";
import api from "@/lib/api";

function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Array<{ id: number; orderNumber: string; totalAmount: number; status: string; createdAt?: string }>;
  revenueByDay?: Array<{ date: string; revenue: number }>;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPING: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function RevenueChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu doanh thu</p>;

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="flex items-end gap-2 h-48 px-2">
      {data.map((d, i) => {
        const height = Math.max((d.revenue / maxRevenue) * 100, 4);
        const day = new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
              {d.revenue > 0 ? (d.revenue >= 1000000 ? `${(d.revenue / 1000000).toFixed(1)}M` : `${(d.revenue / 1000).toFixed(0)}K`) : "0"}
            </span>
            <div
              className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500 hover:from-blue-700 hover:to-blue-500 cursor-pointer relative group"
              style={{ height: `${height}%`, minHeight: "4px" }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {formatPrice(d.revenue)}
              </div>
            </div>
            <span className="text-[10px] text-gray-400">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0, recentOrders: [], revenueByDay: [] });
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
          revenueByDay: data.revenueByDay || [],
        });
      } catch {
        // Fallback: try fetching counts from individual endpoints
        try {
          const [prodRes, orderRes] = await Promise.allSettled([
            api.get("/products?page=0&size=1"),
            api.get("/admin/orders?page=0&size=5"),
          ]);
          const totalProducts = prodRes.status === "fulfilled" ? (prodRes.value.data.data?.totalElements || 0) : 0;
          const orderData = orderRes.status === "fulfilled" ? (orderRes.value.data.data || orderRes.value.data) : null;
          const totalOrders = orderData?.totalElements || 0;
          const recentOrders = (orderData?.content || []).map((o: { id: number; orderNumber: string; totalAmount: number; status: string; createdAt?: string }) => ({
            id: o.id, orderNumber: o.orderNumber, totalAmount: o.totalAmount, status: o.status, createdAt: o.createdAt,
          }));
          // Generate mock 7-day revenue data from recent orders
          const days: Array<{ date: string; revenue: number }> = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            days.push({ date: d.toISOString().split("T")[0], revenue: 0 });
          }
          // Sum order amounts by day
          recentOrders.forEach((o: { createdAt?: string; totalAmount: number }) => {
            if (o.createdAt) {
              const day = o.createdAt.split("T")[0];
              const found = days.find(d => d.date === day);
              if (found) found.revenue += o.totalAmount;
            }
          });
          setStats(prev => ({ ...prev, totalProducts, totalOrders, recentOrders, revenueByDay: days }));
        } catch { /* empty */ }
      } finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  const cards = [
    { label: "Tổng doanh thu", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "text-green-600 bg-green-50 border-green-100", growth: "+12%" },
    { label: "Đơn hàng", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "text-blue-600 bg-blue-50 border-blue-100", growth: "+5%" },
    { label: "Sản phẩm", value: stats.totalProducts.toString(), icon: Package, color: "text-purple-600 bg-purple-50 border-purple-100", growth: "" },
    { label: "Người dùng", value: stats.totalUsers.toString(), icon: Users, color: "text-amber-600 bg-amber-50 border-amber-100", growth: "+8%" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-xs text-gray-400">{new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
      </div>
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
            <div className="h-48 bg-gray-100 rounded" />
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map(c => (
              <div key={c.label} className={`bg-white rounded-xl shadow-sm p-5 border ${c.color.split(" ").pop()}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{c.label}</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.color}`}><c.icon className="w-5 h-5" /></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                {c.growth && (
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">{c.growth} so với tháng trước</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Revenue Chart + Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Doanh thu 7 ngày gần nhất</h2>
              </div>
              <RevenueChart data={stats.revenueByDay || []} />
            </div>

            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Đơn hàng gần đây</h2>
                <Link href="/admin/orders" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                  Xem tất cả <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Chưa có đơn hàng.</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentOrders.slice(0, 5).map(o => (
                    <Link key={o.id} href={`/admin/orders`} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{o.orderNumber}</p>
                        {o.createdAt && <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#E31837]">{formatPrice(o.totalAmount)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[o.status] || "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
