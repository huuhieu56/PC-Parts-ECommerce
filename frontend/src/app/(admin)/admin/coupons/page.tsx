"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Plus, Search, Tag, Edit2, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";


interface Coupon { id: number; code: string; discountType: string; discountValue: number; minOrderValue: number; maxDiscount: number; maxUses: number; usedCount: number; isActive: boolean; startDate: string; endDate: string; }

const emptyCoupon = { code: "", discountType: "PERCENTAGE", discountValue: "", minOrderValue: "", maxDiscount: "", maxUses: "", startDate: "", endDate: "" };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyCoupon);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  const fetchData = async () => {
    try {
      const res = await api.get("/coupons");
      const data = res.data.data || res.data;
      setCoupons(Array.isArray(data) ? data : (data.content || []));
    } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyCoupon); setShowForm(true); };
  const openEdit = (c: Coupon) => {
    setEditId(c.id);
    setForm({
      code: c.code, discountType: c.discountType,
      discountValue: String(c.discountValue), minOrderValue: String(c.minOrderValue || ""),
      maxDiscount: String(c.maxDiscount || ""), maxUses: String(c.maxUses || ""),
      startDate: c.startDate?.slice(0, 16) || "", endDate: c.endDate?.slice(0, 16) || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    try {
      const payload = {
        code: form.code, discountType: form.discountType,
        discountValue: parseFloat(form.discountValue) || 0,
        minOrderValue: parseFloat(form.minOrderValue) || 0,
        maxDiscount: parseFloat(form.maxDiscount) || null,
        maxUses: parseInt(form.maxUses) || 0,
        startDate: form.startDate || null, endDate: form.endDate || null, isActive: true,
      };
      if (editId) { await api.put(`/coupons/${editId}`, payload); } else { await api.post("/coupons", payload); }
      setShowForm(false);
      setMsg({ type: "success", text: editId ? "Cập nhật thành công!" : "Tạo mã thành công!" });
      fetchData();
    } catch { setMsg({ type: "error", text: "Thao tác thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const remove = async (id: number) => {
    if (!confirm("Xóa mã giảm giá này?")) return;
    try { await api.delete(`/coupons/${id}`); setCoupons(prev => prev.filter(c => c.id !== id)); setMsg({ type: "success", text: "Đã xóa." }); }
    catch { setMsg({ type: "error", text: "Xóa thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mã giảm giá</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Tạo mã</button>
      </div>
      {msg && <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{editId ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mã code *</label>
              <input value={form.code} onChange={set("code")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase" placeholder="VD: SUMMER50" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
              <select value={form.discountType} onChange={set("discountType")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="PERCENTAGE">Phần trăm (%)</option><option value="FIXED">Số tiền cố định (VND)</option>
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm *</label>
              <input type="number" value={form.discountValue} onChange={set("discountValue")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VND)</label>
              <input type="number" value={form.minOrderValue} onChange={set("minOrderValue")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (VND)</label>
              <input type="number" value={form.maxDiscount} onChange={set("maxDiscount")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Số lượt dùng tối đa</label>
              <input type="number" value={form.maxUses} onChange={set("maxUses")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
              <input type="datetime-local" value={form.startDate} onChange={set("startDate")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
              <input type="datetime-local" value={form.endDate} onChange={set("endDate")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Lưu</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Hủy</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã giảm giá..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div></div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : (() => {
          const filtered = coupons.filter(c => !search.trim() || c.code.toLowerCase().includes(search.toLowerCase()));
          const totalPages = Math.ceil(filtered.length / pageSize);
          const paged = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
          return filtered.length === 0 ? (
          <div className="p-8 text-center"><Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">Chưa có mã giảm giá.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Mã</th><th className="px-4 py-3 font-medium">Giảm giá</th><th className="px-4 py-3 font-medium">Đơn tối thiểu</th><th className="px-4 py-3 font-medium">Giảm tối đa</th><th className="px-4 py-3 font-medium">Đã dùng</th><th className="px-4 py-3 font-medium">Hết hạn</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium">Thao tác</th></tr></thead>
            <tbody>
              {paged.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                  <td className="px-4 py-3 text-[#E31837] font-medium">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : formatPrice(c.discountValue)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatPrice(c.minOrderValue)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatPrice(c.maxDiscount)}</td>
                  <td className="px-4 py-3 text-gray-500">{c.usedCount}/{c.maxUses}</td>
                  <td className="px-4 py-3 text-gray-500">{c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.isActive ? "Hoạt động" : "Vô hiệu"}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-700 p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        );
        })()}
        {!loading && <Pagination page={currentPage} totalPages={Math.ceil(coupons.filter(c => !search.trim() || c.code.toLowerCase().includes(search.toLowerCase())).length / pageSize)} totalElements={coupons.filter(c => !search.trim() || c.code.toLowerCase().includes(search.toLowerCase())).length} hasNext={currentPage < Math.ceil(coupons.filter(c => !search.trim() || c.code.toLowerCase().includes(search.toLowerCase())).length / pageSize) - 1} hasPrevious={currentPage > 0} onPageChange={setCurrentPage} size={pageSize} />}
      </div>
    </div>
  );
}
