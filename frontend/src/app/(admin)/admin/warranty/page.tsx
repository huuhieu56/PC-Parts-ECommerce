"use client";

import { useEffect, useState } from "react";
import { Shield, Search, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import type { ApiResponse, PageResponse } from "@/types";
import { toast } from "sonner";

interface WarrantyDto {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  issueDescription: string;
  status: string;
  resolution: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: "Đã tiếp nhận", color: "bg-blue-500/10 text-blue-400" },
  PROCESSING: { label: "Đang xử lý", color: "bg-yellow-500/10 text-yellow-400" },
  RESOLVED: { label: "Đã giải quyết", color: "bg-green-500/10 text-green-400" },
  REJECTED: { label: "Từ chối", color: "bg-red-500/10 text-red-400" },
};

export default function AdminWarrantyPage() {
  const [tickets, setTickets] = useState<WarrantyDto[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams({ page: "0", size: "20" });
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get<ApiResponse<PageResponse<WarrantyDto>>>(`/warranty/admin?${params}`);
      setTickets(res.data.data.content);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string, resolution?: string) => {
    try {
      const params = new URLSearchParams({ status });
      if (resolution) params.append("resolution", resolution);
      await api.put(`/warranty/${id}/status?${params}`);
      toast.success("Cập nhật thành công");
      fetchTickets();
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  const handleResolve = (id: number) => {
    const resolution = prompt("Nhập kết quả xử lý:");
    if (resolution) updateStatus(id, "RESOLVED", resolution);
  };

  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Shield className="w-7 h-7 text-blue-400" />Quản lý bảo hành
      </h1>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ key: "", label: "Tất cả" }, ...Object.entries(statusConfig).map(([key, { label }]) => ({ key, label }))].map(({ key, label }) => (
          <Button
            key={key}
            variant={statusFilter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(key)}
            className={statusFilter === key ? "bg-blue-600" : "border-slate-700 text-slate-400"}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 text-slate-400 text-left">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">Vấn đề</th>
                <th className="p-4">Ngày</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-4"><div className="h-6 bg-slate-800/50 rounded animate-pulse" /></td></tr>
                ))
              ) : tickets.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không có yêu cầu</td></tr>
              ) : (
                tickets.map((t) => {
                  const st = statusConfig[t.status] || statusConfig.RECEIVED;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono text-white">#{t.id}</td>
                      <td className="p-4 text-white">{t.productName}</td>
                      <td className="p-4 text-slate-400 max-w-[200px] truncate">{t.issueDescription}</td>
                      <td className="p-4 text-slate-400">{formatDate(t.createdAt)}</td>
                      <td className="p-4"><Badge className={st.color}>{st.label}</Badge></td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {t.status === "RECEIVED" && (
                            <Button size="sm" onClick={() => updateStatus(t.id, "PROCESSING")} className="bg-yellow-600 text-xs h-7">Xử lý</Button>
                          )}
                          {t.status === "PROCESSING" && (
                            <Button size="sm" onClick={() => handleResolve(t.id)} className="bg-green-600 text-xs h-7">Hoàn thành</Button>
                          )}
                          {(t.status === "RECEIVED" || t.status === "PROCESSING") && (
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "REJECTED", "Không đủ điều kiện bảo hành")} className="text-red-400 text-xs h-7">Từ chối</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
