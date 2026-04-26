"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ShoppingCart, Truck, MapPin, Cpu, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";

function formatPrice(p: number): string { return p.toLocaleString("vi-VN") + " đ"; }

// Vietnamese phone number validation regex
const VIETNAM_PHONE_REGEX = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;

// Hanoi districts - 12 quận, 17 huyện, 1 thị xã
const HANOI_DISTRICTS = [
  // 12 Quận
  "Quận Ba Đình",
  "Quận Cầu Giấy",
  "Quận Đống Đa",
  "Quận Hai Bà Trưng",
  "Quận Hoàn Kiếm",
  "Quận Thanh Xuân",
  "Quận Hoàng Mai",
  "Quận Long Biên",
  "Quận Hà Đông",
  "Quận Tây Hồ",
  "Quận Nam Từ Liêm",
  "Quận Bắc Từ Liêm",
  // 17 Huyện
  "Huyện Thanh Trì",
  "Huyện Ba Vì",
  "Huyện Đan Phượng",
  "Huyện Gia Lâm",
  "Huyện Đông Anh",
  "Huyện Thường Tín",
  "Huyện Thanh Oai",
  "Huyện Chương Mỹ",
  "Huyện Hoài Đức",
  "Huyện Mỹ Đức",
  "Huyện Phúc Thọ",
  "Huyện Thạch Thất",
  "Huyện Quốc Oai",
  "Huyện Phú Xuyên",
  "Huyện Ứng Hòa",
  "Huyện Mê Linh",
  "Huyện Sóc Sơn",
  // 1 Thị xã
  "Thị xã Sơn Tây",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { items, totalPrice, totalItems, fetchCart, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  // Shipping form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [province] = useState("Hà Nội"); // Currently only support Hanoi
  const [district, setDistrict] = useState("Quận Ba Đình");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponError, setCouponError] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (mounted && user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
    }
  }, [mounted, user]);

  const shipping = 30000;
  const total = totalPrice - discount + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponMsg("");
    setCouponError(false);
    try {
      const res = await api.get(`/coupons/validate?code=${couponCode.trim()}&orderAmount=${totalPrice}`);
      const coupon = res.data.data || res.data;
      let discountAmount = 0;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = Math.round(totalPrice * coupon.discountValue / 100);
      } else {
        discountAmount = coupon.discountValue;
      }
      setDiscount(discountAmount);
      setCouponMsg(`Áp dụng thành công! Giảm ${formatPrice(discountAmount)}`);
      setCouponError(false);
      setAppliedCouponCode(couponCode.trim());
    } catch {
      setDiscount(0);
      setCouponMsg("Mã giảm giá không hợp lệ hoặc đã hết hạn");
      setCouponError(true);
      setAppliedCouponCode("");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!fullName || !phone || !address) {
      setError("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    if (!VIETNAM_PHONE_REGEX.test(phone)) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam (VD: 0987654321)");
      return;
    }

    setPlacing(true);
    setError("");

    try {
      const orderRequest = {
        paymentMethod,
        note: note || undefined,
        couponCode: appliedCouponCode || undefined,
        shippingAddress: {
          receiverName: fullName,
          receiverPhone: phone,
          province,
          district,
          ward: "",
          street: address,
        },
      };

      const res = await api.post("/orders", orderRequest);
      const order = res.data.data || res.data;

      // Clear cart after successful order
      await clearCart();

      // If MoMo, redirect to payment URL if provided
      if (order.paymentUrl) {
        window.location.href = order.paymentUrl;
        return;
      }

      // Redirect to success page
      router.push(`/checkout/success?orderNumber=${order.orderNumber || order.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setPlacing(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-500 text-sm mb-6">Thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
          <Link href="/products" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/cart" className="hover:text-blue-600">Giỏ hàng</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Thanh toán</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Thanh toán đơn hàng</h1>

        {!isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-6 text-sm">
            Bạn cần <Link href="/login" className="text-blue-600 font-medium hover:underline">đăng nhập</Link> để đặt hàng.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Shipping Address */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-blue-600" /> 1. Địa chỉ giao hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">Họ tên *</label><input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Nguyễn Văn A" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Số điện thoại *</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0912 345 678" /></div>
                <div className="md:col-span-2"><label className="block text-sm text-gray-600 mb-1">Địa chỉ *</label><input value={address} onChange={e => setAddress(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="123 Đường ABC, Phường XYZ" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">Tỉnh/Thành phố</label><input value={province} disabled className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 cursor-not-allowed" /><p className="text-xs text-gray-400 mt-1">Hiện tại chỉ hỗ trợ giao hàng tại Hà Nội</p></div>
                <div><label className="block text-sm text-gray-600 mb-1">Quận/Huyện *</label><select value={district} onChange={e => setDistrict(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">{HANOI_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
              <div className="mt-4"><label className="block text-sm text-gray-600 mb-1">Ghi chú</label><textarea value={note} onChange={e => setNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} placeholder="Ghi chú cho đơn hàng (tùy chọn)" /></div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Truck className="w-5 h-5 text-blue-600" /> 2. Phương thức thanh toán</h2>
              <div className="space-y-2">
                {[
                  { value: "COD", label: "Thanh toán khi nhận hàng (COD)", desc: "Thanh toán bằng tiền mặt khi nhận hàng", emoji: "📦" },
                  { value: "MOMO", label: "MoMo", desc: "Thanh toán qua ví MoMo", emoji: "📱" },
                ].map(pm => (
                  <label key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === pm.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="payment" value={pm.value} checked={paymentMethod === pm.value} onChange={() => setPaymentMethod(pm.value)} className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-lg">{pm.emoji}</span>
                    <div>
                      <span className="text-sm text-gray-700 font-medium">{pm.label}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{pm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Tag className="w-5 h-5 text-blue-600" /> 3. Mã giảm giá</h2>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Nhập mã giảm giá"
                  className="flex-1 h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="bg-blue-600 text-white px-4 h-10 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
                </button>
              </div>
              {couponMsg && <p className={`text-xs mt-2 ${couponError ? "text-red-500" : "text-green-600"}`}>{couponMsg}</p>}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-32">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><ShoppingCart className="w-5 h-5 text-blue-600" /> Tóm tắt đơn hàng</h2>
              <div className="space-y-3 text-sm">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
                      <Cpu className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate text-xs">{item.productName} x{item.quantity}</p>
                      <p className="text-gray-900 font-medium">{formatPrice(item.sellingPrice * item.quantity)}</p>
                    </div>
                  </div>
                ))}
                <hr className="border-gray-200" />
                <div className="flex justify-between text-gray-500"><span>Tạm tính ({totalItems}):</span><span>{formatPrice(totalPrice)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá:</span><span>-{formatPrice(discount)}</span></div>}
                <div className="flex justify-between text-gray-500"><span>Phí vận chuyển:</span><span>{formatPrice(shipping)}</span></div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-lg"><span className="text-gray-900">Tổng cộng:</span><span className="text-[#E31837]">{formatPrice(total)}</span></div>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={placing || !isAuthenticated}
                className="w-full mt-6 bg-[#E31837] hover:bg-red-700 text-white py-3.5 rounded-lg font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placing ? "Đang đặt hàng..." : "ĐẶT HÀNG"}
              </button>
              <p className="text-xs text-gray-400 mt-3 text-center">Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
