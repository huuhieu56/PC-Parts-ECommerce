"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag, Calendar, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import type { ApiResponse, Coupon } from "@/types";
import { toast } from "sonner";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get<ApiResponse<Coupon[]>>("/admin/coupons");
      setCoupons(res.data.data);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteCoupon = async (id: number) => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success("Đã xóa mã giảm giá");
      fetchCoupons();
    } catch {
      toast.error("Không thể xóa");
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const isActive = (coupon: Coupon) => {
    const now = new Date();
    return new Date(coupon.startDate) <= now && new Date(coupon.endDate) >= now;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mã giảm giá</h1>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />Tạo mã mới
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-left">
              <tr>
                <th className="p-4">Mã</th>
                <th className="p-4">Loại</th>
                <th className="p-4">Giá trị</th>
                <th className="p-4">Sử dụng</th>
                <th className="p-4">Thời hạn</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="p-4"><div className="h-6 bg-slate-800/50 rounded animate-pulse" /></td></tr>
                ))
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Chưa có mã giảm giá</td></tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded">{coupon.code}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="border-slate-700 text-slate-300">
                        {coupon.discountType === "PERCENTAGE" ? <><Percent className="w-3 h-3 mr-1" />Phần trăm</> : <><DollarSign className="w-3 h-3 mr-1" />Cố định</>}
                      </Badge>
                    </td>
                    <td className="p-4 text-white font-medium">
                      {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}
                    </td>
                    <td className="p-4 text-slate-400">
                      {coupon.usedCount}/{coupon.maxUses ?? "∞"}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {formatDate(coupon.startDate)} — {formatDate(coupon.endDate)}
                    </td>
                    <td className="p-4">
                      <Badge className={isActive(coupon) ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}>
                        {isActive(coupon) ? "Hoạt động" : "Hết hạn"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCoupon(coupon.id)} className="h-8 w-8 text-slate-400 hover:text-red-400">
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
    </div>
  );
}
