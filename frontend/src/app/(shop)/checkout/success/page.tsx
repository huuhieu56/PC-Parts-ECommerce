"use client";

import Link from "next/link";
import { CheckCircle, Package, ArrowLeft, Copy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const total = searchParams.get("total") || "0";

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
          <p className="text-gray-500 mb-6">Cảm ơn bạn đã mua hàng tại PC Parts. Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.</p>

          {orderNumber && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Mã đơn hàng</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-bold text-gray-900">#{orderNumber}</span>
                <button onClick={() => navigator.clipboard.writeText(orderNumber)} className="text-gray-400 hover:text-gray-600">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {total !== "0" && (
                <p className="text-sm text-gray-500 mt-2">Tổng thanh toán: <span className="font-bold text-[#E31837]">{Number(total).toLocaleString("vi-VN")} đ</span></p>
              )}
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Bước tiếp theo</h3>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li>📧 Email xác nhận đã được gửi đến email đăng ký</li>
              <li>📱 Nhân viên sẽ liên hệ xác nhận trong 30 phút</li>
              <li>🚚 Dự kiến giao hàng trong 2-5 ngày làm việc</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/orders" className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center">
              Xem đơn hàng
            </Link>
            <Link href="/" className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Cần hỗ trợ? Gọi <span className="font-medium">1900.6868</span> hoặc email support@pcparts.com
        </p>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="bg-gray-50 min-h-screen flex items-center justify-center"><div className="animate-pulse bg-white rounded-2xl w-96 h-96" /></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
