"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";

function formatPrice(p: number | undefined | null): string { return (p ?? 0).toLocaleString("vi-VN") + " đ"; }
const statusColors: Record<string, string> = { PENDING: "bg-amber-100 text-amber-700", CONFIRMED: "bg-blue-100 text-blue-700", PROCESSING: "bg-blue-100 text-blue-700", SHIPPED: "bg-purple-100 text-purple-700", DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700" };
const statusLabels: Record<string, string> = { PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", PROCESSING: "Đang xử lý", SHIPPED: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã hủy" };

interface Order { id: number; orderNumber: string; totalAmount: number; status: string; createdAt: string; recipientName: string; itemCount: number; }
interface PageData { content: Order[]; page: number; totalPages: number; totalElements: number; hasNext: boolean; hasPrevious: boolean; size: number; }

export default function AdminOrdersPage() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  const fetchOrders = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: String(pageSize) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/orders/admin?${params}`);
      const data = res.data.data || res.data;
      setPageData(data);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(currentPage); }, [currentPage, fetchOrders]);
  useEffect(() => { setCurrentPage(0); }, [statusFilter]);

  const orders = pageData?.content || [];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý đơn hàng</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-3 flex-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 border border-gray-300 rounded-lg px-3 text-sm bg-white">
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="SHIPPED">Đang giao</option>
            <option value="DELIVERED">Đã giao</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Mã đơn</th><th className="px-4 py-3 font-medium">Khách hàng</th><th className="px-4 py-3 font-medium">Ngày tạo</th><th className="px-4 py-3 font-medium">SP</th><th className="px-4 py-3 font-medium">Tổng tiền</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium">Thao tác</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">#{o.orderNumber || o.id}</td>
                  <td className="px-4 py-3 text-gray-700">{o.recipientName || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-gray-500">{o.itemCount || "—"}</td>
                  <td className="px-4 py-3 text-[#E31837] font-medium">{formatPrice(o.totalAmount)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[o.status] || o.status}</span></td>
                  <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Chi tiết</Link></td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Không tìm thấy đơn hàng</td></tr>}
            </tbody>
          </table>
        )}
        {pageData && (
          <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={pageData.totalElements} hasNext={pageData.hasNext} hasPrevious={pageData.hasPrevious} onPageChange={setCurrentPage} size={pageSize} />
        )}
      </div>
    </div>
  );
}
