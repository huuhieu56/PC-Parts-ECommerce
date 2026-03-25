"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Clock, CheckCircle, XCircle, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, PageResponse } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

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

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  RECEIVED: { label: "Đã tiếp nhận", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Clock },
  PROCESSING: { label: "Đang xử lý", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: AlertTriangle },
  RESOLVED: { label: "Đã giải quyết", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: CheckCircle },
  REJECTED: { label: "Từ chối", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle },
};

export default function WarrantyPage() {
  const { isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState<WarrantyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orderId: "", productId: "", issueDescription: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchTickets();
    else setLoading(false);
  }, [isAuthenticated]);

  const fetchTickets = async () => {
    try {
      const res = await api.get<ApiResponse<PageResponse<WarrantyDto>>>("/warranty?page=0&size=20");
      setTickets(res.data.data.content);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.orderId || !form.productId || !form.issueDescription) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/warranty", {
        orderId: Number(form.orderId),
        productId: Number(form.productId),
        issueDescription: form.issueDescription,
      });
      toast.success("Gửi yêu cầu bảo hành thành công!");
      setShowForm(false);
      setForm({ orderId: "", productId: "", issueDescription: "" });
      fetchTickets();
    } catch {
      toast.error("Không thể gửi yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">Đăng nhập để xem bảo hành</h2>
        <Link href="/login"><Button className="bg-gradient-to-r from-blue-600 to-purple-600">Đăng nhập</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />Bảo hành
        </h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />Tạo yêu cầu
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="bg-slate-900/50 border-slate-800/50 p-6 mb-8 animate-in slide-in-from-top-2">
          <h3 className="font-semibold mb-4">Tạo yêu cầu bảo hành mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm text-slate-400 mb-1 block">Mã đơn hàng</Label>
              <Input
                type="number"
                placeholder="Nhập mã đơn hàng"
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-400 mb-1 block">Mã sản phẩm</Label>
              <Input
                type="number"
                placeholder="Nhập mã sản phẩm"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="mb-4">
            <Label className="text-sm text-slate-400 mb-1 block">Mô tả vấn đề</Label>
            <textarea
              placeholder="Mô tả chi tiết vấn đề gặp phải..."
              value={form.issueDescription}
              onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
              className="w-full h-24 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600">
              <Send className="w-4 h-4 mr-2" />{submitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-700 text-slate-300">
              Hủy
            </Button>
          </div>
        </Card>
      )}

      {/* Tickets List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chưa có yêu cầu bảo hành</h2>
          <p className="text-slate-400">Bạn chưa gửi yêu cầu bảo hành nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const st = statusConfig[ticket.status] || statusConfig.RECEIVED;
            const StatusIcon = st.icon;
            return (
              <Card key={ticket.id} className="bg-slate-900/50 border-slate-800/50 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-slate-400">#{ticket.id}</span>
                      <Badge variant="outline" className={st.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />{st.label}
                      </Badge>
                    </div>
                    <p className="font-medium text-white">{ticket.productName}</p>
                    <p className="text-sm text-slate-400 mt-1">{ticket.issueDescription}</p>
                    {ticket.resolution && (
                      <p className="text-sm text-green-400 mt-2">
                        <CheckCircle className="w-3 h-3 inline mr-1" />Kết quả: {ticket.resolution}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Đơn hàng #{ticket.orderId}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("vi-VN") : ""}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
