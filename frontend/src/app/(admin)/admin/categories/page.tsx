"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, FolderTree } from "lucide-react";
import api from "@/lib/api";

interface Category { id: number; name: string; description: string; parentId: number | null; parentName?: string; level: number; productCount?: number; }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", parentId: "" });
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data || res.data || []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditId(null); setForm({ name: "", description: "", parentId: "" }); setShowForm(true); };
  const openEdit = (c: Category) => { setEditId(c.id); setForm({ name: c.name, description: c.description || "", parentId: c.parentId?.toString() || "" }); setShowForm(true); };

  const save = async () => {
    try {
      const payload = { name: form.name, description: form.description, parentId: form.parentId ? Number(form.parentId) : null };
      if (editId) { await api.put(`/categories/${editId}`, payload); } else { await api.post("/categories", payload); }
      setShowForm(false);
      setMsg({ type: "success", text: editId ? "Cập nhật thành công!" : "Tạo danh mục thành công!" });
      fetchCategories();
    } catch { setMsg({ type: "error", text: "Thao tác thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const remove = async (id: number) => {
    if (!confirm("Xóa danh mục này?")) return;
    try { await api.delete(`/categories/${id}`); setCategories(prev => prev.filter(c => c.id !== id)); setMsg({ type: "success", text: "Đã xóa." }); }
    catch { setMsg({ type: "error", text: "Xóa thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Quản lý danh mục</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Thêm danh mục</button>
      </div>

      {msg && <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{editId ? "Sửa danh mục" : "Thêm danh mục mới"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
              <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Không có (gốc) —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Lưu</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Hủy</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm danh mục..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center"><FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-gray-400">Không có danh mục nào</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Tên</th><th className="px-4 py-3 font-medium">Danh mục cha</th><th className="px-4 py-3 font-medium">Mô tả</th><th className="px-4 py-3 font-medium">Thao tác</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.parentName || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-700 p-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
