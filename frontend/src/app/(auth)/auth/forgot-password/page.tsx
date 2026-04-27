"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle, Cpu } from "lucide-react";
import api from "@/lib/api";
import type { ForgotPasswordRequest } from "@/types";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const SUCCESS_MESSAGE = "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!EMAIL_REGEX.test(email)) {
      setError("Email không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const payload: ForgotPasswordRequest = { email };
      const res = await api.post("/auth/forgot-password", payload);
      setSuccess(res.data.message || SUCCESS_MESSAGE);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Không thể gửi liên kết đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="text-sm text-gray-500 mt-1">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#1A4B9C] hover:bg-blue-900 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">{"< Quay lại đăng nhập"}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
