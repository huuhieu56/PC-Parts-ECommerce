"use client";

import { useEffect, useState } from "react";
import { Search, Users, Shield } from "lucide-react";
import api from "@/lib/api";

interface Account { id: number; email: string; fullName: string; phone: string; roleName: string; isActive: boolean; lastLoginAt?: string; createdAt: string; }

const roleBadge: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700", SALES: "bg-blue-100 text-blue-700",
  WAREHOUSE: "bg-purple-100 text-purple-700", CUSTOMER: "bg-gray-100 text-gray-700",
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get("/admin/accounts?page=0&size=50");
        const data = res.data.data || res.data;
        setAccounts(data.content || data || []);
      } catch { /* empty */ } finally { setLoading(false); }
    }
    fetch();
  }, []);

  const filtered = accounts.filter(a => {
    const matchSearch = a.email.toLowerCase().includes(search.toLowerCase()) || a.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || a.roleName === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleStatus = async (id: number, currentActive: boolean) => {
    try {
      await api.put(`/admin/accounts/${id}/status`, { isActive: !currentActive });
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: !currentActive } : a));
      setMsg({ type: "success", text: "Cập nhật thành công!" });
    } catch { setMsg({ type: "error", text: "Cập nhật thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  const updateRole = async (id: number, newRole: string) => {
    try {
      await api.put(`/admin/accounts/${id}/role`, { roleName: newRole });
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, roleName: newRole } : a));
      setMsg({ type: "success", text: "Cập nhật role thành công!" });
    } catch { setMsg({ type: "error", text: "Cập nhật role thất bại." }); }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Quản lý tài khoản</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" /> {accounts.length} tài khoản
        </div>
      </div>
      {msg && <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</div>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo email, tên..." className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-9 border border-gray-300 rounded-lg px-3 text-sm bg-white">
            <option value="">Tất cả role</option>
            <option value="ADMIN">Admin</option>
            <option value="SALES">Sales</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Đang tải...</div> : filtered.length === 0 ? (
          <div className="p-8 text-center"><Users className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-gray-400">Không có tài khoản nào</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Họ tên</th><th className="px-4 py-3 font-medium">SĐT</th>
              <th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Trạng thái</th><th className="px-4 py-3 font-medium">Ngày tạo</th><th className="px-4 py-3 font-medium">Thao tác</th>
            </tr></thead>
            <tbody>{filtered.map(a => (
              <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.email}</td>
                <td className="px-4 py-3 text-gray-700">{a.fullName || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{a.phone || "—"}</td>
                <td className="px-4 py-3">
                  <select value={a.roleName} onChange={e => updateRole(a.id, e.target.value)} className="text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer" style={{ backgroundColor: "transparent" }}>
                    <option value="ADMIN">ADMIN</option><option value="SALES">SALES</option><option value="WAREHOUSE">WAREHOUSE</option><option value="CUSTOMER">CUSTOMER</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {a.isActive ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(a.id, a.isActive)} className={`text-xs px-2 py-1 rounded-lg font-medium ${a.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                    {a.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
