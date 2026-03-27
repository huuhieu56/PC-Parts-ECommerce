"use client";

import Link from "next/link";
import { ChevronRight, Package, Clock, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Order { id: number; orderNumber: string; status: string; totalAmount: number; createdAt: string; itemCount: number; }
function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã hủy",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get("/orders?page=0&size=20");
        const data = res.data.data || res.data;
        setOrders(data.content || []);
      } catch { /* user not logged in */ } finally { setLoading(false); }
    }
    fetchOrders();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Đơn hàng của tôi</span>
          </nav>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Đơn hàng của tôi</h1>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-xl shadow-sm h-24 animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h2>
            <Link href="/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Mua sắm ngay →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">#{order.orderNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                    <span>{order.itemCount || "—"} sản phẩm</span>
                  </div>
                  <span className="font-bold text-[#E31837]">{formatPrice(order.totalAmount)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
