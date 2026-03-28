"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ChevronRight, Package, Truck, CheckCircle, ArrowLeft } from "lucide-react";
import api from "@/lib/api";

function formatPrice(p: number | undefined | null): string { return (p ?? 0).toLocaleString("vi-VN") + " đ"; }

const statusLabels: Record<string, string> = { PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", PROCESSING: "Đang xử lý", SHIPPED: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã hủy" };
const statusColors: Record<string, string> = { PENDING: "bg-amber-100 text-amber-700", CONFIRMED: "bg-blue-100 text-blue-700", PROCESSING: "bg-blue-100 text-blue-700", SHIPPED: "bg-purple-100 text-purple-700", DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" };

// Valid status transitions
const nextStatuses: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

interface OrderItem { id: number; productId: number; productName: string; quantity: number; unitPrice: number; lineTotal: number; }
interface Order { id: number; orderNumber: string; subtotal: number; discountAmount: number; totalAmount: number; status: string; note: string; recipientName: string; recipientPhone: string; shippingAddress: string; paymentMethod: string; paymentStatus: string; createdAt: string; items: OrderItem[]; }

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await api.get(`/orders/admin/${id}`);
        setOrder(res.data.data || res.data);
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!order || updating) return;
    setUpdating(true);
    try {
      const res = await api.put(`/orders/${order.id}/status`, null, { params: { status: newStatus } });
      const updated = res.data.data || res.data;
      setOrder(prev => prev ? { ...prev, status: updated.status || newStatus } : prev);
      setMsg({ type: "success", text: `Đã chuyển trạng thái → ${statusLabels[newStatus] || newStatus}` });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Cập nhật thất bại";
      setMsg({ type: "error", text: message });
    } finally { setUpdating(false); }
    setTimeout(() => setMsg(null), 4000);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!order) return <div className="text-center py-12"><Package className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h1 className="text-lg font-semibold text-gray-900">Không tìm thấy đơn hàng</h1><Link href="/admin/orders" className="text-blue-600 text-sm mt-2 inline-block">← Quay lại</Link></div>;

  const steps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentStep = steps.indexOf(order.status);
  const available = nextStatuses[order.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><ArrowLeft className="w-4 h-4 text-gray-600" /></Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Đơn hàng #{order.orderNumber || order.id}</h1>
            <p className="text-sm text-gray-500">Ngày đặt: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "—"}</p>
          </div>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[order.status] || order.status}</span>
      </div>

      {msg && <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}

      {/* Progress */}
      {order.status !== "CANCELLED" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= currentStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i <= currentStep ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-xs mt-1 ${i <= currentStep ? "text-green-600 font-medium" : "text-gray-400"}`}>{statusLabels[s]}</span>
                {i < steps.length - 1 && <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < currentStep ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Update */}
      {available.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Cập nhật trạng thái</h2>
          <div className="flex gap-2">
            {available.map(s => (
              <button key={s} onClick={() => updateStatus(s)} disabled={updating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  s === "CANCELLED" ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}>
                {updating ? "Đang xử lý..." : `→ ${statusLabels[s]}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-blue-600" /> Sản phẩm ({order.items?.length || 0})</h2>
          {(order.items || []).map(item => (
            <div key={item.id} className="flex justify-between py-2 border-t border-gray-100 text-sm">
              <span className="text-gray-700">{item.productName} <span className="text-gray-400">x{item.quantity}</span></span>
              <span className="text-gray-900 font-medium">{formatPrice(item.lineTotal || item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Giảm giá</span><span className="text-green-600">−{formatPrice(order.discountAmount)}</span></div>}
            <div className="flex justify-between font-bold text-base pt-1"><span className="text-gray-900">Tổng cộng</span><span className="text-[#E31837]">{formatPrice(order.totalAmount)}</span></div>
          </div>
        </div>

        {/* Shipping + Payment */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-600" /> Thông tin giao hàng</h2>
            <div className="text-sm space-y-1 text-gray-600">
              <p>Người nhận: <span className="text-gray-900 font-medium">{order.recipientName || "—"}</span></p>
              <p>Điện thoại: <span className="text-gray-900 font-medium">{order.recipientPhone || "—"}</span></p>
              <p>Địa chỉ: <span className="text-gray-900 font-medium">{order.shippingAddress || "—"}</span></p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">💳 Thanh toán</h2>
            <div className="text-sm space-y-1 text-gray-600">
              <p>Phương thức: <span className="text-gray-900 font-medium">{order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : order.paymentMethod || "COD"}</span></p>
              <p>Trạng thái: <span className={`font-medium ${order.paymentStatus === "PAID" ? "text-green-600" : "text-amber-600"}`}>{order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</span></p>
              {order.note && <p>Ghi chú: <span className="text-gray-900">{order.note}</span></p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
