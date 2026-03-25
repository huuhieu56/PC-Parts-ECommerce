"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Tag,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/inventory", label: "Kho hàng", icon: Warehouse },
  { href: "/admin/coupons", label: "Mã giảm giá", icon: Tag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const role = user?.role;
    if (role !== "ADMIN" && role !== "SALES" && role !== "WAREHOUSE") {
      router.push("/");
    }
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 border-r border-slate-800/50 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-800/50">
          <h2 className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Admin Panel
          </h2>
          <p className="text-xs text-slate-500 mt-1">{user?.fullName} ({user?.role})</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800/50">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />Về trang chủ
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
