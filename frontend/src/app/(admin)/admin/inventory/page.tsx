"use client";

import { useEffect, useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

interface InventoryItem { id: number; productName: string; productSku: string; quantity: number; lowStockThreshold: number; }

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchInventory() {
      try {
        // Products are public, get all products first
        const res = await api.get("/products?page=0&size=50");
        const pageData = res.data.data || res.data;
        const products = pageData.content || [];

        // For each product, try to get inventory via auth endpoint
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
            // If no inventory data or auth error, show a default entry
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
    }
    fetchInventory();
  }, []);

  const filtered = items.filter(i => i.productName.toLowerCase().includes(search.toLowerCase()) || i.productSku.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý kho hàng</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm trong kho..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : filtered.length === 0 ? <div className="p-8 text-center text-gray-400">Không có dữ liệu kho hàng</div> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200"><th className="px-4 py-3 font-medium">Sản phẩm</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Tồn kho</th><th className="px-4 py-3 font-medium">Ngưỡng cảnh báo</th><th className="px-4 py-3 font-medium">Trạng thái</th></tr></thead>
            <tbody>
              {filtered.map(i => {
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
