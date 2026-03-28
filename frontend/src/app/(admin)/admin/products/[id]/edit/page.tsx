"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import api from "@/lib/api";

interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface ProductForm { name: string; sku: string; originalPrice: string; sellingPrice: string; description: string; categoryId: string; brandId: string; condition: string; }

const empty: ProductForm = { name: "", sku: "", originalPrice: "", sellingPrice: "", description: "", categoryId: "", brandId: "", condition: "NEW" };

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";

  const [form, setForm] = useState<ProductForm>(empty);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, brandRes] = await Promise.all([api.get("/categories"), api.get("/brands")]);
        setCategories(catRes.data.data || catRes.data || []);
        setBrands(brandRes.data.data || brandRes.data || []);

        if (!isNew) {
          const res = await api.get(`/products/admin/${id}`);
          const p = res.data.data || res.data;
          setForm({
            name: p.name || "",
            sku: p.sku || "",
            originalPrice: p.originalPrice?.toString() || "",
            sellingPrice: p.sellingPrice?.toString() || "",
            description: p.description || "",
            categoryId: p.categoryId?.toString() || "",
            brandId: p.brandId?.toString() || "",
            condition: p.condition || "NEW",
          });
        }
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetchData();
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        originalPrice: parseFloat(form.originalPrice),
        sellingPrice: parseFloat(form.sellingPrice),
        description: form.description,
        categoryId: parseInt(form.categoryId),
        brandId: parseInt(form.brandId),
        condition: form.condition,
      };
      if (isNew) {
        await api.post("/products", payload);
        setMsg({ type: "success", text: "Tạo sản phẩm thành công!" });
      } else {
        await api.put(`/products/${id}`, payload);
        setMsg({ type: "success", text: "Cập nhật sản phẩm thành công!" });
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lưu thất bại";
      setMsg({ type: "error", text: message });
    } finally { setSaving(false); }
    setTimeout(() => setMsg(null), 4000);
  };

  const set = (key: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><ArrowLeft className="w-4 h-4 text-gray-600" /></Link>
        <h1 className="text-xl font-bold text-gray-900">{isNew ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h1>
      </div>

      {msg && <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
            <input value={form.name} onChange={set("name")} required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="VD: AMD Ryzen 9 7950X" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <input value={form.sku} onChange={set("sku")} required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="VD: CPU-AMD-7950X" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc (VND) *</label>
            <input type="number" value={form.originalPrice} onChange={set("originalPrice")} required min={0} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VND) *</label>
            <input type="number" value={form.sellingPrice} onChange={set("sellingPrice")} required min={0} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
            <select value={form.categoryId} onChange={set("categoryId")} required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Chọn danh mục</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu *</label>
            <select value={form.brandId} onChange={set("brandId")} required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Chọn thương hiệu</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng</label>
          <select value={form.condition} onChange={set("condition")} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="NEW">Mới</option>
            <option value="USED">Đã qua sử dụng</option>
            <option value="REFURBISHED">Tân trang</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea value={form.description} onChange={set("description")} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="Mô tả chi tiết sản phẩm..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/products" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Hủy</Link>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1">
            <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : isNew ? "Tạo sản phẩm" : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
