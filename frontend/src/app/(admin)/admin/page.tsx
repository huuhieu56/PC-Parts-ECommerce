"use client";

import { useEffect, useState } from "react";
import { BarChart3, Package, ShoppingCart, Users, TrendingUp, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import type { ApiResponse } from "@/types";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get<ApiResponse<DashboardStats>>("/admin/dashboard/stats");
      setStats(res.data.data);
    } catch {
      // Keep default zeros
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const statCards = [
    { label: "Doanh thu", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "from-green-500 to-emerald-500" },
    { label: "Đơn hàng", value: String(stats.totalOrders), icon: ShoppingCart, color: "from-blue-500 to-cyan-500" },
    { label: "Sản phẩm", value: String(stats.totalProducts), icon: Package, color: "from-purple-500 to-pink-500" },
    { label: "Khách hàng", value: String(stats.totalCustomers), icon: Users, color: "from-orange-500 to-red-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            {loading ? (
              <div className="h-8 bg-slate-800/50 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            )}
            <p className="text-sm text-slate-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800/50 p-6">
          <h3 className="font-semibold mb-4">Doanh thu theo tháng</h3>
          <div className="h-48 flex items-center justify-center text-slate-500">
            <BarChart3 className="w-12 h-12" />
          </div>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800/50 p-6">
          <h3 className="font-semibold mb-4">Đơn hàng gần đây</h3>
          <div className="h-48 flex items-center justify-center text-slate-500">
            <p className="text-sm">Tính năng đang phát triển</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
