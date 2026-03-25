"use client";

import { useEffect, useState } from "react";
import { Search, ArrowUpCircle, ArrowDownCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import type { ApiResponse, InventoryDto } from "@/types";
import { toast } from "sonner";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get<ApiResponse<InventoryDto[]>>("/admin/inventory");
      setInventory(res.data.data);
    } catch {
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const importStock = async (productId: number) => {
    const qty = prompt("Số lượng nhập kho:");
    if (!qty || isNaN(Number(qty))) return;
    try {
      await api.post(`/admin/inventory/${productId}/import`, { quantity: Number(qty), reason: "Nhập kho" });
      toast.success("Đã nhập kho thành công");
      fetchInventory();
    } catch {
      toast.error("Không thể nhập kho");
    }
  };

  const filtered = inventory.filter((i) =>
    i.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý kho hàng</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/50 border-slate-700 text-white"
        />
      </div>

      <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-left">
              <tr>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4 text-center">Tồn kho</th>
                <th className="p-4 text-center">Đã đặt</th>
                <th className="p-4 text-center">Khả dụng</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-6 bg-slate-800/50 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Không có dữ liệu</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-white font-medium">{item.productName}</td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className="border-slate-700 text-white">{item.quantity}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">{item.reservedQuantity}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={item.availableQuantity > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}>
                        {item.availableQuantity}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button size="sm" onClick={() => importStock(item.productId)} className="bg-blue-600 text-xs h-7">
                        <ArrowUpCircle className="w-3 h-3 mr-1" />Nhập kho
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
