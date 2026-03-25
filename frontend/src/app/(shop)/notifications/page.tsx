"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, PageResponse } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

interface NotificationDto {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { color: string }> = {
  SYSTEM: { color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  ORDER: { color: "bg-green-500/10 text-green-400 border-green-500/30" },
  PROMOTION: { color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
};

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
    else setLoading(false);
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<ApiResponse<PageResponse<NotificationDto>>>("/notifications?page=0&size=50");
      setNotifications(res.data.data.content);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Đã đánh dấu tất cả đã đọc");
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">Đăng nhập để xem thông báo</h2>
        <Link href="/login"><Button className="bg-gradient-to-r from-blue-600 to-purple-600">Đăng nhập</Button></Link>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-400" />Thông báo
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">{unreadCount} mới</Badge>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="border-slate-700 text-slate-300" size="sm">
            <CheckCheck className="w-4 h-4 mr-2" />Đọc tất cả
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chưa có thông báo</h2>
          <p className="text-slate-400">Bạn sẽ nhận thông báo khi có đơn hàng mới hoặc khuyến mãi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const tc = typeConfig[n.type] || typeConfig.SYSTEM;
            return (
              <Card
                key={n.id}
                className={`p-5 border transition-all cursor-pointer ${
                  n.isRead
                    ? "bg-slate-900/30 border-slate-800/30"
                    : "bg-slate-900/60 border-blue-500/20 shadow-lg shadow-blue-500/5"
                }`}
                onClick={() => !n.isRead && markAsRead(n.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.isRead ? "bg-slate-600" : "bg-blue-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium text-sm ${n.isRead ? "text-slate-400" : "text-white"}`}>{n.title}</p>
                      <Badge variant="outline" className={`text-xs ${tc.color}`}>{n.type}</Badge>
                    </div>
                    <p className={`text-sm ${n.isRead ? "text-slate-500" : "text-slate-300"}`}>{n.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-500">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                        }) : ""}
                      </span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-green-400 flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
