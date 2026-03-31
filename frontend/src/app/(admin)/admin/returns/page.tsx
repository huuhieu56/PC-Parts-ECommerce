"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, RotateCcw } from "lucide-react";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";

interface ReturnItem { id: number; orderNumber: string; customerName: string; productName: string; reason: string; type: string; status: string; refundAmount?: number; createdAt: string; }
interface PageData { content: ReturnItem[]; page: number; totalPages: number; totalElements: number; hasNext: boolean; hasPrevious: boolean; size: number; }
function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-700", APPROVED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "Chờ duyệt", APPROVED: "Đã duyệt", COMPLETED: "Hoàn thành", REJECTED: "Từ chối",
};

export default function AdminReturnsPage() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const pageSize = 15;

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: String(pageSize) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/returns?${params}`);
      const data = res.data.data || res.data;
      setPageData(data);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(currentPage); }, [currentPage, fetchData]);
  useEffect(() => { setCurrentPage(0); }, [statusFilter]);

  const returns = pageData?.content || [];
  const filtered = returns.filter(r => !search.trim() || r.customerName?.toLowerCase().includes(search.toLowerCase()) || r.orderNumber?.toLowerCase().includes(search.toLowerCase()) || r.productName?.toLowerCase().includes(search.toLowerCase()));

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.put(`/returns/${id}/status`, null, { params: { status: newStatus } });
      setPageData(prev => prev ? { ...prev, content: prev.content.map(r => r.id === id ? { ...r, status: newStatus } : r) } : prev);
      setMsg({ type: "success", text: "Cập nhật trạng thái thành công!" });
    } catch { setMsg({ type: "error", text: "Cập nhật thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý đổi trả</h1>
      {msg && <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo KH, mã đơn..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 border border-gray-300 rounded-lg px-3 text-sm bg-white">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : filtered.length === 0 ? (
          <div className="p-8 text-center"><RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-gray-400">Không có yêu cầu đổi trả nào</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 font-medium">Mã đơn</th><th className="px-4 py-3 font-medium">Khách hàng</th><th className="px-4 py-3 font-medium">Sản phẩm</th>
              <th className="px-4 py-3 font-medium">Loại</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium">Số tiền</th><th className="px-4 py-3 font-medium">Thao tác</th>
            </tr></thead>
            <tbody>{filtered.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">#{r.orderNumber || r.id}</td>
                <td className="px-4 py-3 text-gray-700">{r.customerName || "—"}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.productName || "—"}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.type === "REFUND" ? "Hoàn tiền" : "Đổi hàng"}</span></td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[r.status] || r.status}</span></td>
                <td className="px-4 py-3 text-gray-700">{r.refundAmount ? formatPrice(r.refundAmount) : "—"}</td>
                <td className="px-4 py-3">
                  <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white">
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {pageData && (
          <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={pageData.totalElements} hasNext={pageData.hasNext} hasPrevious={pageData.hasPrevious} onPageChange={setCurrentPage} size={pageSize} />
        )}
      </div>
    </div>
  );
}
