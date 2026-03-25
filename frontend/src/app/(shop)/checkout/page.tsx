"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CreditCard, Truck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, Address, CartDto, Order, CreateOrderRequest } from "@/types";
import { toast } from "sonner";

type PaymentMethod = "COD" | "VNPAY" | "MOMO";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [cart, setCart] = useState<CartDto | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [addressRes, cartRes] = await Promise.all([
        api.get<ApiResponse<Address[]>>("/addresses"),
        api.get<ApiResponse<CartDto>>("/cart"),
      ]);
      setAddresses(addressRes.data.data);
      setCart(cartRes.data.data);
      const defaultAddr = addressRes.data.data.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAddress) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }
    setSubmitting(true);
    try {
      const request: CreateOrderRequest = {
        addressId: selectedAddress,
        note: note || undefined,
        couponCode: couponCode || undefined,
        paymentMethod,
      };
      const res = await api.post<ApiResponse<Order>>("/orders", request);
      toast.success("Đặt hàng thành công!");
      router.push(`/orders/${res.data.data.id}`);
    } catch {
      toast.error("Không thể đặt hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const paymentMethods: { key: PaymentMethod; label: string; desc: string }[] = [
    { key: "COD", label: "Thanh toán khi nhận hàng", desc: "Trả tiền mặt khi nhận hàng" },
    { key: "VNPAY", label: "VNPay", desc: "Thanh toán qua cổng VNPay" },
    { key: "MOMO", label: "MoMo", desc: "Thanh toán qua ví MoMo" },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-96 bg-slate-900/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <Card className="bg-slate-900/50 border-slate-800/50 p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />Địa chỉ giao hàng
            </h2>
            {addresses.length === 0 ? (
              <p className="text-slate-400">Chưa có địa chỉ. Vui lòng thêm địa chỉ trong phần tài khoản.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedAddress === addr.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {addr.receiverName} — {addr.receiverPhone}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                      </div>
                      {selectedAddress === addr.id && (
                        <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Payment Method */}
          <Card className="bg-slate-900/50 border-slate-800/50 p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.key}
                  onClick={() => setPaymentMethod(pm.key)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === pm.key
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{pm.label}</p>
                      <p className="text-sm text-slate-400">{pm.desc}</p>
                    </div>
                    {paymentMethod === pm.key && <Check className="w-5 h-5 text-blue-400" />}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Note */}
          <Card className="bg-slate-900/50 border-slate-800/50 p-6">
            <Label className="text-sm text-slate-300 mb-2 block">Ghi chú đơn hàng</Label>
            <Input
              placeholder="Ghi chú cho đơn hàng (tùy chọn)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="bg-slate-900/50 border-slate-800/50 p-6 sticky top-24">
            <h3 className="font-semibold text-lg mb-4">Đơn hàng</h3>
            <div className="space-y-3 text-sm max-h-60 overflow-y-auto">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-slate-400 truncate flex-1 mr-2">
                    {item.productName} x{item.quantity}
                  </span>
                  <span className="text-white whitespace-nowrap">
                    {formatPrice(item.sellingPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="my-4 bg-slate-700" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Tạm tính</span>
                <span className="text-white">{formatPrice(cart?.totalPrice ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vận chuyển</span>
                <span className="text-green-400">Miễn phí</span>
              </div>
            </div>

            <Separator className="my-4 bg-slate-700" />

            {/* Coupon */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Mã giảm giá"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white text-sm"
              />
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                Áp dụng
              </Button>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Tổng cộng</span>
              <span className="text-blue-400">{formatPrice(cart?.totalPrice ?? 0)}</span>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedAddress}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold shadow-lg shadow-blue-500/20"
            >
              {submitting ? "Đang xử lý..." : "Đặt hàng"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
