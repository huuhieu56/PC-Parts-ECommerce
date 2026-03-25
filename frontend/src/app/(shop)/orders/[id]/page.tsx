"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle, XCircle, Truck, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import type { ApiResponse, Order } from "@/types";

const statusSteps = ["PENDING", "CONFIRMED", "DELIVERING", "COMPLETED"];
const statusLabels: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  DELIVERING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get<ApiResponse<Order>>(`/orders/${params.id}`);
      setOrder(res.data.data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-96 bg-slate-900/50 rounded-xl animate-pulse" /></div>;
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
        <Link href="/orders"><span className="text-blue-400 hover:underline">← Quay lại</span></Link>
      </div>
    );
  }

  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link href="/orders" className="hover:text-white transition-colors">Đơn hàng</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white">#{order.id}</span>
      </nav>

      {/* Status Timeline */}
      {order.status !== "CANCELLED" ? (
        <Card className="bg-slate-900/50 border-slate-800/50 p-6 mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700 -z-0" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 -z-0 transition-all duration-500"
              style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
            />
            {statusSteps.map((step, i) => (
              <div key={step} className="relative flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  i <= currentStep ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-slate-700"
                }`}>
                  {i <= currentStep ? <CheckCircle className="w-5 h-5 text-white" /> : <Clock className="w-5 h-5 text-slate-400" />}
                </div>
                <span className={`text-xs mt-2 whitespace-nowrap ${
                  i <= currentStep ? "text-white font-medium" : "text-slate-500"
                }`}>
                  {statusLabels[step]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="bg-red-500/10 border-red-500/30 p-6 mb-8 text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-semibold">Đơn hàng đã bị hủy</p>
        </Card>
      )}

      {/* Items */}
      <Card className="bg-slate-900/50 border-slate-800/50 p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">Sản phẩm</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-white">{item.productName}</p>
                <p className="text-xs text-slate-400">x{item.quantity} × {formatPrice(item.unitPrice)}</p>
              </div>
              <span className="font-medium text-white">{formatPrice(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <Separator className="my-4 bg-slate-700" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between"><span className="text-slate-400">Giảm giá</span><span className="text-green-400">-{formatPrice(order.discountAmount)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-slate-400">Vận chuyển</span><span className="text-green-400">Miễn phí</span></div>
        </div>
        <Separator className="my-4 bg-slate-700" />
        <div className="flex justify-between text-lg font-bold">
          <span>Tổng cộng</span>
          <span className="text-blue-400">{formatPrice(order.totalAmount)}</span>
        </div>
      </Card>
    </div>
  );
}
