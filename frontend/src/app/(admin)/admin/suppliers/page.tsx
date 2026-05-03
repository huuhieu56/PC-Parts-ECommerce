"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Factory } from "lucide-react";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";
import { PermissionGate } from "@/components/admin/PermissionGate";
import { Permission } from "@/lib/permissions";

interface Supplier { id: number; name: string; contactPerson: string; phone: string; email: string; address: string; }

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "", address: "" });
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  const fetchData = async () => {
    try { const res = await api.get("/suppliers"); setSuppliers(res.data.data || res.data || []); } catch { /* empty */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.contactPerson?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const openCreate = () => { setEditId(null); setForm({ name: "", contactPerson: "", phone: "", email: "", address: "" }); setShowForm(true); };
  const openEdit = (s: Supplier) => { setEditId(s.id); setForm({ name: s.name, contactPerson: s.contactPerson || "", phone: s.phone || "", email: s.email || "", address: s.address || "" }); setShowForm(true); };

  const save = async () => {
    try {
      if (editId) { await api.put(`/suppliers/${editId}`, form); } else { await api.post("/suppliers", form); }
      setShowForm(false); setMsg({ type: "success", text: editId ? "Cập nhật thành công!" : "Tạo NCC thành công!" }); fetchData();
    } catch { setMsg({ type: "error", text: "Thao tác thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const remove = async (id: number) => {
    if (!confirm("Xóa nhà cung cấp này?")) return;
    try { await api.delete(`/suppliers/${id}`); setSuppliers(prev => prev.filter(s => s.id !== id)); setMsg({ type: "success", text: "Đã xóa." }); }
    catch { setMsg({ type: "error", text: "Xóa thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Quản lý nhà cung cấp</h1>
        <PermissionGate permission={Permission.INVENTORY_MANAGE}>
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Thêm NCC</button>
        </PermissionGate>
      </div>
      {msg && <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{editId ? "Sửa NCC" : "Thêm NCC mới"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
              <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div className="col-span-full"><label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Lưu</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Hủy</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm NCC..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div></div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : filtered.length === 0 ? (
          <div className="p-8 text-center"><Factory className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-gray-400">Không có NCC nào</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Tên</th><th className="px-4 py-3 font-medium">Liên hệ</th><th className="px-4 py-3 font-medium">SĐT</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Thao tác</th></tr></thead>
            <tbody>{paged.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.contactPerson || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{s.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{s.email || "—"}</td>
                <td className="px-4 py-3"><PermissionGate permission={Permission.INVENTORY_MANAGE}><div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-700 p-1"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => remove(s.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                </div></PermissionGate></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        <Pagination page={currentPage} totalPages={totalPages} totalElements={filtered.length} hasNext={currentPage < totalPages - 1} hasPrevious={currentPage > 0} onPageChange={setCurrentPage} size={pageSize} />
      </div>
    </div>
  );
}
