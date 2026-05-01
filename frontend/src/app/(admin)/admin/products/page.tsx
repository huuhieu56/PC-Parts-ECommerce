"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Cpu } from "lucide-react";
import api from "@/lib/api";
import Pagination from "@/components/Pagination";


interface Product { id: number; name: string; slug: string; sku: string; sellingPrice: number; categoryName: string; brandName: string; status: string; }
interface PageData { content: Product[]; page: number; totalPages: number; totalElements: number; hasNext: boolean; hasPrevious: boolean; size: number; }

export default function AdminProductsPage() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  const fetchProducts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/products?page=${page}&size=${pageSize}&keyword=${encodeURIComponent(search)}`);
      const data = res.data.data || res.data;
      setPageData(data);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProducts(currentPage); }, [currentPage, fetchProducts]);

  const handleSearch = () => { setCurrentPage(0); fetchProducts(0); };

  const products = pageData?.content || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Quản lý sản phẩm</h1>
        <Link href="/admin/products/new/edit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Thêm sản phẩm</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Tìm sản phẩm... (Enter)"
              className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có sản phẩm nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Sản phẩm</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Danh mục</th><th className="px-4 py-3 font-medium">Giá</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium">Thao tác</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><Cpu className="w-5 h-5 text-gray-400" /></div><span className="text-gray-900 font-medium truncate max-w-xs">{p.name}</span></div></td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categoryName}</td>
                  <td className="px-4 py-3 text-[#E31837] font-medium">{formatPrice(p.sellingPrice)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.status === "ACTIVE" ? "Đang bán" : p.status}</span></td>
                  <td className="px-4 py-3"><Link href={`/admin/products/${p.id}/edit`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Sửa</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pageData && (
          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={pageData.totalElements}
            hasNext={pageData.hasNext}
            hasPrevious={pageData.hasPrevious}
            onPageChange={setCurrentPage}
            size={pageSize}
          />
        )}
      </div>
    </div>
  );
}
