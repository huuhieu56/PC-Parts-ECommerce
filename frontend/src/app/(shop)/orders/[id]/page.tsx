"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ChevronRight, Package, Truck, CheckCircle } from "lucide-react";
import api from "@/lib/api";

function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await api.get(`/orders/${id}`);
        const data = res.data.data || res.data;
        setOrder(data);
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetchOrder();
  }, [id]);

  if (loading) return <div className="bg-gray-50 min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!order) return <div className="bg-gray-50 min-h-screen flex items-center justify-center"><div className="text-center"><Package className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h1 className="text-lg font-semibold text-gray-900">Không tìm thấy đơn hàng</h1><Link href="/orders" className="text-blue-600 text-sm mt-2 inline-block">← Quay lại</Link></div></div>;

  const status = (order.status as string) || "PENDING";
  const steps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentStep = steps.indexOf(status);
  const items = (order.items as Array<{ productName: string; quantity: number; unitPrice: number; lineTotal: number }>) || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link><ChevronRight className="w-3.5 h-3.5" />
            <Link href="/orders" className="hover:text-blue-600">Đơn hàng</Link><ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">#{(order.orderNumber as string) || id}</span>
          </nav>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= currentStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i <= currentStep ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-xs mt-1 ${i <= currentStep ? "text-green-600 font-medium" : "text-gray-400"}`}>
                  {["Chờ xác nhận", "Xác nhận", "Xử lý", "Giao hàng", "Hoàn thành"][i]}
                </span>
                {i < steps.length - 1 && <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < currentStep ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-blue-600" /> Sản phẩm</h2>
          {items.length > 0 ? items.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-t border-gray-100 text-sm">
              <span className="text-gray-700">{item.productName} x{item.quantity}</span>
              <span className="text-gray-900 font-medium">{formatPrice(item.lineTotal || item.unitPrice * item.quantity)}</span>
            </div>
          )) : <p className="text-sm text-gray-500">Không có thông tin sản phẩm.</p>}
          <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold"><span className="text-gray-900">Tổng cộng</span><span className="text-[#E31837]">{formatPrice((order.totalAmount as number) || 0)}</span></div>
        </div>
        {/* Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-600" /> Thông tin giao hàng</h2>
          <div className="text-sm space-y-1 text-gray-600">
            <p>Người nhận: <span className="text-gray-900 font-medium">{(order.recipientName as string) || "—"}</span></p>
            <p>Điện thoại: <span className="text-gray-900 font-medium">{(order.recipientPhone as string) || "—"}</span></p>
            <p>Địa chỉ: <span className="text-gray-900 font-medium">{(order.shippingAddress as string) || "—"}</span></p>
          </div>
        </div>
        {/* Payment Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">💳 Thanh toán</h2>
          <div className="text-sm space-y-1 text-gray-600">
            <p>Phương thức: <span className="text-gray-900 font-medium">{(order.paymentMethod as string) === "COD" ? "Thanh toán khi nhận hàng (COD)" : (order.paymentMethod as string) === "VNPAY" ? "VNPay" : (order.paymentMethod as string) === "MOMO" ? "MoMo" : (order.paymentMethod as string) || "COD"}</span></p>
            <p>Trạng thái: <span className={`font-medium ${(order.paymentStatus as string) === "PAID" ? "text-green-600" : "text-amber-600"}`}>{(order.paymentStatus as string) === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</span></p>
            {(order.note as string) && <p>Ghi chú: <span className="text-gray-900">{order.note as string}</span></p>}
            <p>Ngày đặt: <span className="text-gray-900 font-medium">{order.createdAt ? new Date(order.createdAt as string).toLocaleString("vi-VN") : "—"}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
