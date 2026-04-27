"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertCircle, CheckCircle, Cpu, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import type { ResetPasswordRequest } from "@/types";

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_RULE_MESSAGE = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số";
const TOKEN_ERROR_MESSAGE = "Liên kết đã hết hạn. Vui lòng yêu cầu lại";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(token ? "" : TOKEN_ERROR_MESSAGE);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError(TOKEN_ERROR_MESSAGE);
      return;
    }
    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      setError(PASSWORD_RULE_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const payload: ResetPasswordRequest = { token, newPassword, confirmPassword };
      const res = await api.post("/auth/reset-password", payload);
      setSuccess(res.data.message || "Đặt lại mật khẩu thành công");
      window.setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || TOKEN_ERROR_MESSAGE);
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
          <h1 className="text-2xl font-bold text-gray-900">Thiết lập lại mật khẩu</h1>
          <p className="text-sm text-gray-500 mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
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
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số"
                  required
                  className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.</p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !token || Boolean(success)} className="w-full bg-[#1A4B9C] hover:bg-blue-900 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">Gửi lại liên kết</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
