"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Package, Users, DollarSign, BarChart3, ShoppingCart } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

function formatCompactPrice(p: number): string { return p >= 1000000 ? (p / 1000000).toFixed(1) + "tr" : formatPrice(p); }

interface DashboardStats { totalRevenue: number; totalOrders: number; totalProducts: number; totalCustomers: number; recentOrders: Array<{ id: number; orderNumber: string; customerName: string; totalAmount: number; status: string; createdAt: string }>; revenueByDay: Array<{ date: string; revenue: number }>; topProducts: Array<{ name: string; soldCount: number; revenue: number }>; }

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get(`/admin/dashboard/stats?period=${period}`);
        setStats(res.data.data || res.data);
      } catch {
        // Fallback mock for missing backend endpoints
        setStats({
          totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0,
          recentOrders: [], revenueByDay: [], topProducts: [],
        });
      } finally { setLoading(false); }
    }
    fetch();
  }, [period]);

  const maxRevenue = stats?.revenueByDay?.length ? Math.max(...stats.revenueByDay.map(d => d.revenue), 1) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Thống kê & Báo cáo</h1>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="h-9 border border-gray-300 rounded-lg px-3 text-sm bg-white">
          <option value="7d">7 ngày</option>
          <option value="30d">30 ngày</option>
          <option value="90d">90 ngày</option>
          <option value="365d">1 năm</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-xl h-28 animate-pulse" />)}</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Tổng doanh thu", value: formatCompactPrice(stats?.totalRevenue || 0), icon: DollarSign, color: "text-green-600 bg-green-100" },
              { label: "Đơn hàng", value: String(stats?.totalOrders || 0), icon: ShoppingCart, color: "text-blue-600 bg-blue-100" },
              { label: "Sản phẩm", value: String(stats?.totalProducts || 0), icon: Package, color: "text-purple-600 bg-purple-100" },
              { label: "Khách hàng", value: String(stats?.totalCustomers || 0), icon: Users, color: "text-amber-600 bg-amber-100" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Doanh thu theo ngày</h3>
              </div>
              {stats?.revenueByDay?.length ? (
                <div className="flex items-end gap-1 h-48">
                  {stats.revenueByDay.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatCompactPrice(d.revenue)}</span>
                      <div className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600"
                        style={{ height: `${(d.revenue / maxRevenue) * 160}px`, minHeight: "4px" }} />
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">{new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu doanh thu</div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-900">Top sản phẩm bán chạy</h3>
              </div>
              {stats?.topProducts?.length ? (
                <div className="space-y-3">
                  {stats.topProducts.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-700" : "bg-gray-50 text-gray-500"}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">Đã bán: {p.soldCount}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{formatCompactPrice(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Đơn hàng gần đây</h3>
            {stats?.recentOrders?.length ? (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b border-gray-200"><th className="pb-3 font-medium">Mã đơn</th><th className="pb-3 font-medium">Khách hàng</th><th className="pb-3 font-medium">Tổng tiền</th><th className="pb-3 font-medium">Trạng thái</th><th className="pb-3 font-medium">Ngày</th></tr></thead>
                <tbody>
                  {stats.recentOrders.slice(0, 10).map(o => (
                    <tr key={o.id} className="border-b border-gray-50">
                      <td className="py-2.5 font-medium text-gray-900">#{o.orderNumber}</td>
                      <td className="py-2.5 text-gray-700">{o.customerName || "—"}</td>
                      <td className="py-2.5 font-medium text-[#E31837]">{formatPrice(o.totalAmount)}</td>
                      <td className="py-2.5"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{o.status}</span></td>
                      <td className="py-2.5 text-gray-500">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">Chưa có đơn hàng nào</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
