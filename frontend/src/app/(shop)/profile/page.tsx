"use client";

import Link from "next/link";
import { ChevronRight, User, MapPin, Lock, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  avatarUrl?: string;
}

interface Address {
  id: number;
  label: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const [tab, setTab] = useState<"info" | "addresses" | "password">("info");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", dateOfBirth: "", gender: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: "", receiverName: "", receiverPhone: "", province: "", district: "", ward: "", street: "" });

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, addrRes] = await Promise.all([
          api.get("/users/profile"),
          api.get("/users/addresses"),
        ]);
        const p = profileRes.data.data || profileRes.data;
        setProfile(p);
        setEditForm({ fullName: p.fullName || "", phone: p.phone || "", dateOfBirth: p.dateOfBirth || "", gender: p.gender || "" });
        setAddresses((addrRes.data.data || addrRes.data) || []);
      } catch { /* not logged in */ }
      setLoading(false);
    }
    load();
  }, []);

  const saveProfile = async () => {
    try {
      await api.put("/users/profile", editForm);
      setProfile((prev) => prev ? { ...prev, ...editForm } : prev);
      setEditMode(false);
      setMsg({ type: "success", text: "Cập nhật thành công!" });
    } catch { setMsg({ type: "error", text: "Cập nhật thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setMsg({ type: "error", text: "Vui lòng nhập đầy đủ thông tin." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    if (pwForm.currentPassword === pwForm.newPassword) {
      setMsg({ type: "error", text: "Mật khẩu mới phải khác mật khẩu cũ." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(pwForm.newPassword)) {
      setMsg({ type: "error", text: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }

    try {
      await api.put("/users/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
        confirmPassword: pwForm.confirmPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setMsg({
        type: "error",
        text: axiosError.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.",
      });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const addAddress = async () => {
    try {
      const res = await api.post("/users/addresses", { ...newAddr, isDefault: addresses.length === 0 });
      setAddresses((prev) => [...prev, res.data.data || res.data]);
      setAddingAddress(false);
      setNewAddr({ label: "", receiverName: "", receiverPhone: "", province: "", district: "", ward: "", street: "" });
      setMsg({ type: "success", text: "Thêm địa chỉ thành công!" });
    } catch { setMsg({ type: "error", text: "Thêm địa chỉ thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const deleteAddress = async (id: number) => {
    try {
      await api.delete(`/users/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch { setMsg({ type: "error", text: "Xóa địa chỉ thất bại." }); setTimeout(() => setMsg(null), 3000); }
  };

  const setDefault = async (id: number) => {
    try {
      await api.put(`/users/addresses/${id}/default`);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch { /* ignore */ }
  };

  const tabs = [
    { key: "info" as const, label: "Thông tin cá nhân", icon: User },
    { key: "addresses" as const, label: "Sổ địa chỉ", icon: MapPin },
    { key: "password" as const, label: "Đổi mật khẩu", icon: Lock },
  ];

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl h-48 animate-pulse" />
            <div className="md:col-span-3 bg-white rounded-xl h-96 animate-pulse" />
          </div>
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
            <span className="text-gray-900 font-medium">Tài khoản</span>
          </nav>
        </div>
      </div>

      {msg && (
        <div className={`max-w-5xl mx-auto px-4 mt-4`}>
          <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.text}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{profile?.fullName || "User"}</p>
                  <p className="text-xs text-gray-500">{profile?.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${tab === t.key ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </nav>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/orders" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  📦 Đơn hàng của tôi
                </Link>
                <Link href="/warranty" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  🛡️ Bảo hành
                </Link>
                <Link href="/wishlist" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  ❤️ Yêu thích
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {tab === "info" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h2>
                  {!editMode ? (
                    <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      <Edit2 className="w-4 h-4" /> Chỉnh sửa
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditMode(false)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /> Hủy</button>
                      <button onClick={saveProfile} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"><Save className="w-4 h-4" /> Lưu</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-full-name" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    {editMode ? (
                      <input id="profile-full-name" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    ) : <p className="text-sm text-gray-900 py-2">{profile?.fullName || "—"}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900 py-2">{profile?.email || "—"}</p>
                  </div>
                  <div>
                    <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    {editMode ? (
                      <input id="profile-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    ) : <p className="text-sm text-gray-900 py-2">{profile?.phone || "—"}</p>}
                  </div>
                  <div>
                    <label htmlFor="profile-date-of-birth" className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                    {editMode ? (
                      <input id="profile-date-of-birth" type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    ) : <p className="text-sm text-gray-900 py-2">{profile?.dateOfBirth || "—"}</p>}
                  </div>
                  <div>
                    <label htmlFor="profile-gender" className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                    {editMode ? (
                      <select id="profile-gender" value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Chọn</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    ) : <p className="text-sm text-gray-900 py-2">{profile?.gender === "MALE" ? "Nam" : profile?.gender === "FEMALE" ? "Nữ" : profile?.gender || "—"}</p>}
                  </div>
                </div>
              </div>
            )}

            {tab === "addresses" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Sổ địa chỉ</h2>
                  <button onClick={() => setAddingAddress(true)} className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Thêm địa chỉ
                  </button>
                </div>
                {addingAddress && (
                  <div className="border border-blue-200 rounded-xl p-4 mb-4 bg-blue-50/30">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Thêm địa chỉ mới</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input placeholder="Nhãn (VD: Nhà, Cơ quan)" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input placeholder="Tên người nhận" value={newAddr.receiverName} onChange={(e) => setNewAddr({ ...newAddr, receiverName: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input placeholder="SĐT người nhận" value={newAddr.receiverPhone} onChange={(e) => setNewAddr({ ...newAddr, receiverPhone: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input placeholder="Tỉnh/Thành phố" value={newAddr.province} onChange={(e) => setNewAddr({ ...newAddr, province: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input placeholder="Quận/Huyện" value={newAddr.district} onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input placeholder="Phường/Xã" value={newAddr.ward} onChange={(e) => setNewAddr({ ...newAddr, ward: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input placeholder="Số nhà, đường" value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-full" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={addAddress} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Lưu</button>
                      <button onClick={() => setAddingAddress(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">Hủy</button>
                    </div>
                  </div>
                )}
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Chưa có địa chỉ nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div key={addr.id} className={`border rounded-xl p-4 ${addr.isDefault ? "border-blue-300 bg-blue-50/30" : "border-gray-200"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">{addr.label || "Địa chỉ"}</span>
                              {addr.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Mặc định</span>}
                            </div>
                            <p className="text-sm text-gray-700">{addr.receiverName} — {addr.receiverPhone}</p>
                            <p className="text-sm text-gray-500">{addr.street}, {addr.ward}, {addr.district}, {addr.province}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!addr.isDefault && (
                              <button onClick={() => setDefault(addr.id)} className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1">Đặt mặc định</button>
                            )}
                            <button onClick={() => deleteAddress(addr.id)} aria-label="Xóa địa chỉ" className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "password" && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
