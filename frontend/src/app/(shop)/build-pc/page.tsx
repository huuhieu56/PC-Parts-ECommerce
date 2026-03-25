"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2, ShoppingCart, Cpu, Plus, Minus, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, PcBuild, PcBuildComponent } from "@/types";
import { toast } from "sonner";

const SLOT_LABELS: Record<string, string> = {
  CPU: "Bộ xử lý (CPU)",
  MAINBOARD: "Bo mạch chủ",
  RAM: "Bộ nhớ RAM",
  GPU: "Card đồ họa (GPU)",
  SSD: "Ổ cứng SSD",
  HDD: "Ổ cứng HDD",
  PSU: "Nguồn (PSU)",
  CASE: "Vỏ máy (Case)",
  COOLER: "Tản nhiệt",
  FAN: "Quạt tản nhiệt",
  MONITOR: "Màn hình",
};

export default function BuildPCPage() {
  const { isAuthenticated } = useAuthStore();
  const [build, setBuild] = useState<PcBuild | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuild();
  }, []);

  const getHeaders = () => {
    if (!isAuthenticated) {
      const sid = getSessionId();
      return { "X-Session-Id": sid };
    }
    return {};
  };

  const fetchBuild = async () => {
    try {
      const [slotsRes, buildsRes] = await Promise.all([
        api.get<ApiResponse<string[]>>("/build-pc/slots"),
        api.get<ApiResponse<PcBuild[]>>("/build-pc", { headers: getHeaders() }),
      ]);
      setSlots(slotsRes.data.data);
      if (buildsRes.data.data.length > 0) {
        setBuild(buildsRes.data.data[0]);
      }
    } catch {
      setSlots(Object.keys(SLOT_LABELS));
    } finally {
      setLoading(false);
    }
  };

  const createBuild = async () => {
    try {
      const res = await api.post<ApiResponse<PcBuild>>("/build-pc", { name: "Cấu hình mới" }, {
        headers: getHeaders(),
      });
      setBuild(res.data.data);
      toast.success("Đã tạo cấu hình mới");
    } catch {
      toast.error("Không thể tạo cấu hình");
    }
  };

  const addToCart = async () => {
    if (!build) return;
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }
    try {
      await api.post(`/build-pc/${build.id}/add-to-cart`);
      toast.success("Đã thêm cấu hình vào giỏ hàng!");
    } catch {
      toast.error("Không thể thêm vào giỏ hàng");
    }
  };

  const removeComponent = async (slotType: string) => {
    if (!build) return;
    try {
      const res = await api.delete<ApiResponse<PcBuild>>(
        `/build-pc/${build.id}/components/${slotType}`,
        { headers: getHeaders() }
      );
      setBuild(res.data.data);
      toast.success("Đã xóa linh kiện");
    } catch {
      toast.error("Không thể xóa linh kiện");
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const getComponentForSlot = (slot: string): PcBuildComponent | undefined =>
    build?.components.find((c) => c.slotType === slot);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-96 bg-slate-900/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Build PC
          </span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Tự chọn linh kiện, xây dựng cấu hình máy tính trong mơ. Không cần đăng nhập!
        </p>
      </div>

      {!build ? (
        <div className="text-center py-16">
          <Cpu className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-4">Bắt đầu xây dựng cấu hình</h2>
          <Button
            onClick={createBuild}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 h-12 px-8"
          >
            <Plus className="w-5 h-5 mr-2" />Tạo cấu hình mới
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Component Slots */}
          <div className="lg:col-span-2 space-y-3">
            {slots.map((slot) => {
              const comp = getComponentForSlot(slot);
              return (
                <Card key={slot} className={`bg-slate-900/50 border-slate-800/50 p-4 transition-all ${
                  comp ? "border-blue-500/20" : "border-dashed"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        comp ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"
                      }`}>
                        {slot.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          {SLOT_LABELS[slot] || slot}
                        </p>
                        {comp ? (
                          <p className="text-sm font-medium text-white truncate">{comp.productName}</p>
                        ) : (
                          <p className="text-sm text-slate-500 italic">Chưa chọn</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {comp ? (
                        <>
                          <span className="text-sm font-semibold text-blue-400 whitespace-nowrap">
                            {formatPrice(comp.lineTotal)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeComponent(slot)}
                            className="h-8 w-8 text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Link href={`/products?slot=${slot}`}>
                          <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white">
                            <Plus className="w-3 h-3 mr-1" />Chọn
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Summary */}
          <div>
            <Card className="bg-slate-900/50 border-slate-800/50 p-6 sticky top-24">
              <h3 className="font-semibold text-lg mb-4">{build.name}</h3>
              <Badge variant="outline" className="mb-4 text-xs border-slate-700 text-slate-400">
                {build.components.length}/{slots.length} linh kiện
              </Badge>

              <Separator className="my-4 bg-slate-700" />

              {build.components.length > 0 ? (
                <div className="space-y-2 text-sm mb-4">
                  {build.components.map((c) => (
                    <div key={c.id} className="flex justify-between">
                      <span className="text-slate-400 truncate flex-1 mr-2">{SLOT_LABELS[c.slotType] || c.slotType}</span>
                      <span className="text-white whitespace-nowrap">{formatPrice(c.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-4">Chưa có linh kiện nào</p>
              )}

              <Separator className="my-4 bg-slate-700" />

              <div className="flex justify-between text-xl font-bold mb-6">
                <span>Tổng cộng</span>
                <span className="text-blue-400">{formatPrice(build.totalPrice)}</span>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={addToCart}
                  disabled={build.components.length === 0}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold shadow-lg shadow-blue-500/20"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />Thêm vào giỏ hàng
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("sessionId");
  if (!sid) {
    sid = "session_" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("sessionId", sid);
  }
  return sid;
}
