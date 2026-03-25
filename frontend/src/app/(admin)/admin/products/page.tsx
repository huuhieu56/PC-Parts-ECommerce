"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import type { ApiResponse, PageResponse, Product } from "@/types";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), size: "10" });
      if (search) params.append("keyword", search);
      const res = await api.get<ApiResponse<PageResponse<Product>>>(`/products?${params}`);
      setProducts(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Đã xóa sản phẩm");
      fetchProducts();
    } catch {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />Thêm sản phẩm
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="pl-10 bg-slate-900/50 border-slate-700 text-white"
        />
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-left">
              <tr>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Giá bán</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-6 bg-slate-800/50 rounded animate-pulse" /></td></tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Không có sản phẩm</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800/50 rounded flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img src={product.images[0].imageUrl} alt="" className="w-full h-full object-contain p-1 rounded" />
                          ) : (
                            <div className="w-6 h-6 bg-slate-700 rounded" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.brandName} · {product.categoryName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">{product.sku}</td>
                    <td className="p-4 text-white font-medium">{formatPrice(product.sellingPrice)}</td>
                    <td className="p-4">
                      <Badge className={product.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}>
                        {product.status === "ACTIVE" ? "Hoạt động" : "Ẩn"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} className="h-8 w-8 text-slate-400 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)} className="border-slate-700 text-slate-300" size="sm">Trước</Button>
          <span className="px-3 py-2 text-sm text-slate-400">{page + 1} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="border-slate-700 text-slate-300" size="sm">Sau</Button>
        </div>
      )}
    </div>
  );
}
