"use client";

import Link from "next/link";
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

function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

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

  const submitReturn = async () => {
    try {
      await api.post("/returns", form);
      setShowForm(false);
      setForm({ orderId: "", orderDetailId: "", reason: "", type: "REFUND" });
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
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Tạo yêu cầu
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tạo yêu cầu đổi trả mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                <input value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} placeholder="VD: 1001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại yêu cầu</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="REFUND">Hoàn tiền</option>
                  <option value="EXCHANGE">Đổi hàng</option>
                </select>
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Mô tả chi tiết lý do đổi trả..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={submitReturn} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Gửi yêu cầu</button>
              <button onClick={() => setShowForm(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Hủy</button>
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
                  <span className="flex items-center gap-1 text-gray-400"><Clock className="w-3.5 h-3.5" /> {new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
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
