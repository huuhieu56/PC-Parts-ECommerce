"use client";

import { useEffect, useState } from "react";
import { Search, Shield } from "lucide-react";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { Permission } from "@/lib/permissions";

const statusColors: Record<string, string> = { PENDING: "bg-amber-100 text-amber-700", IN_PROGRESS: "bg-blue-100 text-blue-700", RESOLVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700" };
const statusLabels: Record<string, string> = { PENDING: "Chờ xử lý", IN_PROGRESS: "Đang xử lý", RESOLVED: "Đã giải quyết", REJECTED: "Từ chối" };

interface WarrantyReq { id: number; productName: string; customerName: string; issueDescription: string; status: string; createdAt: string; }

export default function AdminWarrantyPage() {
  const [requests, setRequests] = useState<WarrantyReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  useEffect(() => {
    async function fetchWarranty() {
      try {
        const res = await api.get("/warranty/admin?page=0&size=50");
        const data = res.data.data || res.data;
        setRequests(data.content || data || []);
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetchWarranty();
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.put(`/warranty/${id}/status`, null, { params: { status: newStatus } });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      setMsg({ type: "success", text: `Cập nhật trạng thái → ${statusLabels[newStatus]}` });
    } catch {
      setMsg({ type: "error", text: "Cập nhật thất bại" });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý bảo hành</h1>
      {msg && <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm yêu cầu bảo hành..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div></div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : (() => {
          const filtered = requests.filter(r => !search.trim() || r.productName?.toLowerCase().includes(search.toLowerCase()) || r.customerName?.toLowerCase().includes(search.toLowerCase()) || r.issueDescription?.toLowerCase().includes(search.toLowerCase()));
          const totalPages = Math.ceil(filtered.length / pageSize);
          const paged = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
          return filtered.length === 0 ? (
          <div className="p-8 text-center"><Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">Chưa có yêu cầu bảo hành.</p></div>
        ) : (
          <>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Sản phẩm</th><th className="px-4 py-3 font-medium">Khách hàng</th><th className="px-4 py-3 font-medium">Vấn đề</th><th className="px-4 py-3 font-medium">Ngày tạo</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium">Thao tác</th></tr></thead>
            <tbody>
              {paged.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{r.productName}</td>
                  <td className="px-4 py-3 text-gray-500">{r.customerName}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{r.issueDescription}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[r.status] || r.status}</span></td>
                  <td className="px-4 py-3">
                    <PermissionGate permission={Permission.WARRANTY_MANAGE} fallback={<span className="text-xs text-gray-400">{statusLabels[r.status]}</span>}>
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="IN_PROGRESS">Đang xử lý</option>
                        <option value="RESOLVED">Đã giải quyết</option>
                        <option value="REJECTED">Từ chối</option>
                      </select>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={currentPage} totalPages={totalPages} totalElements={filtered.length} hasNext={currentPage < totalPages - 1} hasPrevious={currentPage > 0} onPageChange={setCurrentPage} size={pageSize} />
          </>
        );
        })()}
      </div>
    </div>
  );
}
