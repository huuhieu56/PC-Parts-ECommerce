"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ChevronRight, RotateCcw, Plus, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface ReturnRequest {
  id: number;
  orderNumber: string;
  productName: string;
  reason: string;
  type: string;
  status: string;
  refundAmount?: number;
  createdAt: string;
}

interface OrderSummary {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}


function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "—";
}

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "Chờ duyệt", APPROVED: "Đã duyệt",
  COMPLETED: "Hoàn thành", REJECTED: "Từ chối",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OrderSummary[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orderId: "", orderDetailId: "", reason: "", type: "REFUND" });
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get("/returns/my?page=0&size=20");
        const data = res.data.data || res.data;
        setReturns(data.content || data || []);
      } catch { /* not logged in or no returns */ }
      setLoading(false);
    }
    fetch();
  }, []);

  const loadCompletedOrders = async () => {
    try {
      const res = await api.get("/orders?page=0&size=50");
      const data = res.data.data || res.data;
      const orders = ((data.content || data || []) as OrderSummary[])
        .filter((order) => order.status === "COMPLETED")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCompletedOrders(orders);
    } catch {
      setCompletedOrders([]);
    }
  };

  const openReturnForm = async () => {
    setShowForm(true);
    setForm({ orderId: "", orderDetailId: "", reason: "", type: "REFUND" });
    setOrderItems([]);
    await loadCompletedOrders();
  };

  const selectOrder = async (orderId: string) => {
    setForm((prev) => ({ ...prev, orderId, orderDetailId: "" }));
    setOrderItems([]);
    if (!orderId) {
      return;
    }

    try {
      const res = await api.get(`/orders/${orderId}`);
      const data = res.data.data || res.data;
      setOrderItems((data.items || []) as OrderItem[]);
    } catch {
      setMsg({ type: "error", text: "Không tải được sản phẩm trong đơn hàng." });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const submitReturn = async () => {
    const orderId = Number(form.orderId);
    const orderDetailId = Number(form.orderDetailId);
    const reason = form.reason.trim();

    if (!Number.isInteger(orderId) || orderId <= 0 || !Number.isInteger(orderDetailId) || orderDetailId <= 0 || !reason) {
      setMsg({ type: "error", text: "Vui lòng chọn đơn hàng, sản phẩm và nhập lý do đổi trả." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    try {
      await api.post("/returns", { orderId, orderDetailId, reason, type: form.type });
      setShowForm(false);
      setForm({ orderId: "", orderDetailId: "", reason: "", type: "REFUND" });
      setOrderItems([]);
      setMsg({ type: "success", text: "Yêu cầu đổi trả đã được gửi thành công!" });
      // reload
      const res = await api.get("/returns/my?page=0&size=20");
      const data = res.data.data || res.data;
      setReturns(data.content || data || []);
    } catch { setMsg({ type: "error", text: "Gửi yêu cầu thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Đổi trả</span>
          </nav>
        </div>
      </div>

      {msg && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.text}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Yêu cầu đổi trả</h1>
          <button onClick={openReturnForm} className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Tạo yêu cầu
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tạo yêu cầu đổi trả mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="return-order" className="block text-sm font-medium text-gray-700 mb-1">Đơn hàng</label>
                <select id="return-order" value={form.orderId} onChange={(e) => selectOrder(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Chọn đơn hàng đã hoàn thành</option>
                  {completedOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber || `ORD-${String(order.id).padStart(6, "0")}`} - {formatDate(order.createdAt)} - {formatPrice(order.totalAmount)}
                    </option>
                  ))}
                </select>
                {completedOrders.length === 0 && <p className="text-xs text-gray-500 mt-1">Chưa có đơn hàng hoàn thành để đổi trả.</p>}
              </div>
              <div>
                <label htmlFor="return-type" className="block text-sm font-medium text-gray-700 mb-1">Loại yêu cầu</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  id="return-type" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="REFUND">Hoàn tiền</option>
                  <option value="EXCHANGE">Đổi hàng</option>
                </select>
              </div>
              <div className="col-span-full">
                <label htmlFor="return-item" className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm</label>
                <select id="return-item" value={form.orderDetailId} onChange={(e) => setForm({ ...form, orderDetailId: e.target.value })}
                  disabled={!form.orderId}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400">
                  <option value="">Chọn sản phẩm cần đổi trả</option>
                  {orderItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.productName} x{item.quantity} - {formatPrice(item.lineTotal || item.unitPrice * item.quantity)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-full">
                <label htmlFor="return-reason" className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Mô tả chi tiết lý do đổi trả..."
                  id="return-reason" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={submitReturn} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Gửi yêu cầu</button>
              <button onClick={() => { setShowForm(false); setOrderItems([]); }} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Hủy</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-xl shadow-sm h-24 animate-pulse" />)}</div>
        ) : returns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <RotateCcw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Chưa có yêu cầu đổi trả</h2>
            <p className="text-sm text-gray-500">Bạn có thể tạo yêu cầu đổi trả cho các đơn hàng đã nhận.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">#{r.orderNumber || r.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] || "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.type === "REFUND" ? "Hoàn tiền" : "Đổi hàng"}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-1">{r.productName || "Sản phẩm"}</p>
                <p className="text-sm text-gray-500 mb-2">Lý do: {r.reason}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-400"><Clock className="w-3.5 h-3.5" /> {formatDate(r.createdAt)}</span>
                  {r.refundAmount && <span className="font-bold text-[#E31837]">{formatPrice(r.refundAmount)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
