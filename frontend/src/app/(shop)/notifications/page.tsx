"use client";

import Link from "next/link";
import { ChevronRight, Bell, Check, CheckCheck } from "lucide-react";
import { useState, useEffect } from "react";

interface Notification { id: number; title: string; message: string; type: string; isRead: boolean; createdAt: string; }
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_URL}/notifications?page=0&size=50`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const data = await res.json(); setNotifications(data.content || []); }
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetch_();
  }, []);

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      await fetch(`${API_URL}/notifications/mark-all-read`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch { /* empty */ }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link><ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Thông báo</span>
          </nav>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Thông báo</h1>
          <button onClick={markAllRead} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"><CheckCheck className="w-4 h-4" /> Đọc tất cả</button>
        </div>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white rounded-lg h-16 animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Không có thông báo</h2>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className={`p-4 rounded-lg border transition-colors ${n.isRead ? "bg-white border-gray-100" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>{n.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1.5" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
