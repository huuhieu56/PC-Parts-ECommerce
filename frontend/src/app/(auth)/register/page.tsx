"use client";

import Link from "next/link";
import { useState } from "react";
import { Cpu, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#1A4B9C] rounded-lg flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">PC Parts</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Tạo tài khoản để mua sắm và theo dõi đơn hàng</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label><input placeholder="Nguyễn Văn A" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" placeholder="example@email.com" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label><input placeholder="0912 345 678" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Tối thiểu 8 ký tự" className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#1A4B9C] hover:bg-blue-900 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">
              Đăng ký
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
