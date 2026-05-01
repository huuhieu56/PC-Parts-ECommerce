"use client";

import { useState } from "react";
import api from "@/lib/api";
import { STRONG_PASSWORD_REGEX } from "@/lib/constants";

/**
 * Change password tab — extracted from profile page.
 */
export default function ChangePasswordTab({
  showMessage,
}: {
  showMessage: (type: "success" | "error", text: string) => void;
}) {
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      showMessage("error", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showMessage("error", "Mật khẩu xác nhận không khớp.");
      return;
    }

    if (pwForm.currentPassword === pwForm.newPassword) {
      showMessage("error", "Mật khẩu mới phải khác mật khẩu cũ.");
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(pwForm.newPassword)) {
      showMessage("error", "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.");
      return;
    }

    try {
      await api.put("/users/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
        confirmPassword: pwForm.confirmPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showMessage("success", "Đổi mật khẩu thành công!");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showMessage("error", axiosError.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Đổi mật khẩu</h2>
      <div className="max-w-md space-y-4">
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
          <input id="current-password" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
          <input id="new-password" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
          <input id="confirm-password" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <button onClick={changePassword} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Đổi mật khẩu</button>
      </div>
    </div>
  );
}
