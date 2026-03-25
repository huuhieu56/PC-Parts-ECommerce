"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, PageResponse, Order } from "@/types";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: Clock },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: CheckCircle },
  DELIVERING: { label: "Đang giao", color: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: Truck },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle },
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const res = await api.get<ApiResponse<PageResponse<Order>>>("/orders?page=0&size=20");
      setOrders(res.data.data.content);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">Đăng nhập để xem đơn hàng</h2>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-900/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Package className="w-8 h-8 text-blue-400" />Đơn hàng của tôi
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chưa có đơn hàng</h2>
          <Link href="/products">
            <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600">Mua sắm ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const st = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = st.icon;
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="bg-slate-900/50 border-slate-800/50 p-6 hover:border-blue-500/30 transition-all cursor-pointer group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-slate-400">#{order.id}</span>
                        <Badge variant="outline" className={st.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {st.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{formatDate(order.createdAt)}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {order.items.length} sản phẩm
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{formatPrice(order.totalAmount)}</p>
                        {order.discountAmount > 0 && (
                          <p className="text-xs text-green-400">Giảm {formatPrice(order.discountAmount)}</p>
                        )}
                      </div>
                      <Eye className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
