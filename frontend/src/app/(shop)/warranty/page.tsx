"use client";

import Link from "next/link";
import { ChevronRight, Shield, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface WarrantyRequest { id: number; productName: string; status: string; issueDescription: string; createdAt: string; }
const statusColors: Record<string, string> = { PENDING: "bg-amber-100 text-amber-700", IN_PROGRESS: "bg-blue-100 text-blue-700", RESOLVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700" };
const statusLabels: Record<string, string> = { PENDING: "Chờ xử lý", IN_PROGRESS: "Đang xử lý", RESOLVED: "Đã xử lý", REJECTED: "Từ chối" };

export default function WarrantyPage() {
  const [requests, setRequests] = useState<WarrantyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWarranty() {
      try {
        const res = await api.get("/warranty");
        const data = res.data.data || res.data;
        setRequests(Array.isArray(data) ? data : (data.content || []));
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetchWarranty();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link><ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Bảo hành</span>
          </nav>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Yêu cầu bảo hành</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Tạo yêu cầu</button>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />)}</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Chưa có yêu cầu bảo hành</h2>
            <p className="text-sm text-gray-500">Tạo yêu cầu bảo hành khi sản phẩm gặp sự cố.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{req.productName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[req.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[req.status] || req.status}</span>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {req.issueDescription}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
