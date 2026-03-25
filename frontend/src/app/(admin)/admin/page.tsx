"use client";

import { useEffect, useState } from "react";
import { BarChart3, Package, ShoppingCart, Users, TrendingUp, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  { label: "Doanh thu tháng", value: "0₫", icon: DollarSign, color: "from-green-500 to-emerald-500" },
  { label: "Đơn hàng mới", value: "0", icon: ShoppingCart, color: "from-blue-500 to-cyan-500" },
  { label: "Sản phẩm", value: "0", icon: Package, color: "from-purple-500 to-pink-500" },
  { label: "Khách hàng", value: "0", icon: Users, color: "from-orange-500 to-red-500" },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Placeholder charts */}
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
            <p className="text-sm">Chưa có đơn hàng</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
