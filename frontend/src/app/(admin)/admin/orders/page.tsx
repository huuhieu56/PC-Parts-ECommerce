"use client";

import { useEffect, useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import type { ApiResponse, PageResponse, Order } from "@/types";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-yellow-500/10 text-yellow-400" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-500/10 text-blue-400" },
  DELIVERING: { label: "Đang giao", color: "bg-purple-500/10 text-purple-400" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-500/10 text-green-400" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-500/10 text-red-400" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({ page: "0", size: "20" });
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get<ApiResponse<PageResponse<Order>>>(`/admin/orders?${params}`);
      setOrders(res.data.data.content);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      toast.success("Đã cập nhật trạng thái");
      fetchOrders();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý đơn hàng</h1>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ key: "", label: "Tất cả" }, ...Object.entries(statusConfig).map(([key, { label }]) => ({ key, label }))].map(({ key, label }) => (
          <Button
            key={key}
            variant={statusFilter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(key)}
            className={statusFilter === key ? "bg-blue-600" : "border-slate-700 text-slate-400"}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-left">
              <tr>
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Ngày</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-6 bg-slate-800/50 rounded animate-pulse" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Không có đơn hàng</td></tr>
              ) : (
                orders.map((order) => {
                  const st = statusConfig[order.status] || statusConfig.PENDING;
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono text-white">#{order.id}</td>
                      <td className="p-4 text-slate-400">{formatDate(order.createdAt)}</td>
                      <td className="p-4 text-white font-medium">{formatPrice(order.totalAmount)}</td>
                      <td className="p-4">
                        <Badge className={st.color}>{st.label}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {order.status === "PENDING" && (
                            <Button size="sm" onClick={() => updateStatus(order.id, "CONFIRMED")} className="bg-blue-600 text-xs h-7">
                              Xác nhận
                            </Button>
                          )}
                          {order.status === "CONFIRMED" && (
                            <Button size="sm" onClick={() => updateStatus(order.id, "DELIVERING")} className="bg-purple-600 text-xs h-7">
                              Giao hàng
                            </Button>
                          )}
                          {order.status === "DELIVERING" && (
                            <Button size="sm" onClick={() => updateStatus(order.id, "COMPLETED")} className="bg-green-600 text-xs h-7">
                              Hoàn thành
                            </Button>
                          )}
                          {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(order.id, "CANCELLED")} className="text-red-400 hover:text-red-300 text-xs h-7">
                              Hủy
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
