"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Cpu } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

interface Product { id: number; name: string; sku: string; price: number; quantity: number; categoryName: string; brandName: string; }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetch_() {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/products?page=0&size=50`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (res.ok) { const data = await res.json(); setProducts(data.content || []); }
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetch_();
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Quản lý sản phẩm</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Thêm sản phẩm</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Sản phẩm</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Danh mục</th><th className="px-4 py-3 font-medium">Giá</th><th className="px-4 py-3 font-medium">Tồn kho</th><th className="px-4 py-3 font-medium">Thao tác</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><Cpu className="w-5 h-5 text-gray-400" /></div><span className="text-gray-900 font-medium truncate max-w-xs">{p.name}</span></div></td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categoryName}</td>
                  <td className="px-4 py-3 text-[#E31837] font-medium">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.quantity}</span></td>
                  <td className="px-4 py-3"><button className="text-blue-600 hover:text-blue-700 text-xs font-medium">Sửa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
