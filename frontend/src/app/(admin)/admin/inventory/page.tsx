"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, AlertTriangle, Plus, Minus, History, X } from "lucide-react";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { Permission } from "@/lib/permissions";

interface InventoryItem { id: number; productName: string; productSku: string; quantity: number; lowStockThreshold: number; }
interface InventoryLog { id: number; type: string; quantityChange: number; note: string; createdAt: string; performedBy?: string; }

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  // Modal state
  const [modal, setModal] = useState<{ type: "import" | "adjust"; productId: number; productName: string } | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Logs modal state
  const [logsModal, setLogsModal] = useState<{ productId: number; productName: string } | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await api.get("/products?page=0&size=50");
      const pageData = res.data.data || res.data;
      const products = pageData.content || [];

      const inventoryItems: InventoryItem[] = [];
      for (const p of products) {
        try {
          const invRes = await api.get(`/inventory/${p.id}`);
          const inv = invRes.data.data || invRes.data;
          inventoryItems.push({
            id: p.id,
            productName: p.name,
            productSku: p.sku,
            quantity: inv.quantity || 0,
            lowStockThreshold: inv.lowStockThreshold || 10,
          });
        } catch {
          inventoryItems.push({
            id: p.id,
            productName: p.name,
            productSku: p.sku,
            quantity: 0,
            lowStockThreshold: 10,
          });
        }
      }
      setItems(inventoryItems);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const openImport = (item: InventoryItem) => {
    setModal({ type: "import", productId: item.id, productName: item.productName });
    setQuantity(""); setReason(""); setError("");
  };

  const openAdjust = (item: InventoryItem) => {
    setModal({ type: "adjust", productId: item.id, productName: item.productName });
    setQuantity(""); setReason(""); setError("");
  };

  const closeModal = () => { setModal(null); setQuantity(""); setReason(""); setError(""); };

  const handleSubmit = async () => {
    if (!modal) return;
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) { setError("Số lượng phải lớn hơn 0"); return; }
    setSubmitting(true); setError("");
    try {
      const endpoint = modal.type === "import" ? `/inventory/${modal.productId}/import` : `/inventory/${modal.productId}/adjust`;
      await api.post(endpoint, { quantity: qty, reason: reason || undefined });
      closeModal();
      fetchInventory();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Có lỗi xảy ra";
      setError(msg);
    } finally { setSubmitting(false); }
  };

  const openLogs = async (item: InventoryItem) => {
    setLogsModal({ productId: item.id, productName: item.productName });
    setLogsLoading(true);
    try {
      const res = await api.get(`/inventory/${item.id}/logs?size=20`);
      const data = res.data.data || res.data;
      setLogs(data.content || data || []);
    } catch { setLogs([]); } finally { setLogsLoading(false); }
  };

  const filtered = items.filter(i => i.productName.toLowerCase().includes(search.toLowerCase()) || i.productSku.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý kho hàng</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm trong kho..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : filtered.length === 0 ? <div className="p-8 text-center text-gray-400">Không có dữ liệu kho hàng</div> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Sản phẩm</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Tồn kho</th><th className="px-4 py-3 font-medium">Ngưỡng cảnh báo</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium">Thao tác</th></tr></thead>
            <tbody>
              {paged.map(i => {
                const low = i.quantity <= i.lowStockThreshold;
                return (
                  <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{i.productName}</td>
                    <td className="px-4 py-3 text-gray-500">{i.productSku}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{i.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{i.lowStockThreshold}</td>
                    <td className="px-4 py-3">
                      {low ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5 w-fit"><AlertTriangle className="w-3 h-3" /> Sắp hết</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Còn hàng</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PermissionGate permission={Permission.INVENTORY_IMPORT}>
                          <button onClick={() => openImport(i)} className="text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-0.5"><Plus className="w-3 h-3" /> Nhập</button>
                        </PermissionGate>
                        <PermissionGate permission={Permission.INVENTORY_ADJUST}>
                          <button onClick={() => openAdjust(i)} className="text-amber-600 hover:text-amber-700 text-xs font-medium flex items-center gap-0.5"><Minus className="w-3 h-3" /> Điều chỉnh</button>
                        </PermissionGate>
                        <PermissionGate permission={Permission.INVENTORY_VIEW}>
                          <button onClick={() => openLogs(i)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-0.5"><History className="w-3 h-3" /> Lịch sử</button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination page={currentPage} totalPages={totalPages} totalElements={filtered.length} hasNext={currentPage < totalPages - 1} hasPrevious={currentPage > 0} onPageChange={setCurrentPage} size={pageSize} />
      </div>

      {/* Import / Adjust Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{modal.type === "import" ? "Nhập kho" : "Điều chỉnh tồn kho"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Sản phẩm: <span className="font-medium text-gray-900">{modal.productName}</span></p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng {modal.type === "import" ? "nhập" : "điều chỉnh"} *</label>
                <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Nhập số lượng" className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Lý do nhập/điều chỉnh" className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? "Đang xử lý..." : "Xác nhận"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setLogsModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Lịch sử kho</h2>
              <button onClick={() => setLogsModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Sản phẩm: <span className="font-medium text-gray-900">{logsModal.productName}</span></p>
            <div className="flex-1 overflow-y-auto">
              {logsLoading ? <p className="text-sm text-gray-400 text-center py-4">Đang tải...</p> : logs.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">Chưa có lịch sử</p> : (
                <div className="space-y-2">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.type === "IMPORT" ? "bg-green-100 text-green-700" : log.type === "ADJUSTMENT" ? "bg-amber-100 text-amber-700" : log.type === "RETURN" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{log.type}</span>
                        {log.note && <p className="text-xs text-gray-500 mt-1">{log.note}</p>}
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${log.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}>{log.quantityChange > 0 ? "+" : ""}{log.quantityChange}</span>
                        <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
