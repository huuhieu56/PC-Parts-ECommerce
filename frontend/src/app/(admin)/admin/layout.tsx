"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Warehouse, Tag, Shield, Cpu, LogOut } from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/inventory", label: "Kho hàng", icon: Warehouse },
  { href: "/admin/coupons", label: "Mã giảm giá", icon: Tag },
  { href: "/admin/warranty", label: "Bảo hành", icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shrink-0 hidden lg:block">
        <div className="sticky top-0">
          <div className="p-4 border-b border-gray-200">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1A4B9C] rounded-lg flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm">PC Parts</span>
                <p className="text-[10px] text-gray-400">Admin Panel</p>
              </div>
            </Link>
          </div>
          <nav className="p-3 space-y-0.5">
            {adminNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-400"}`} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-gray-200 mt-4">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <LogOut className="w-4 h-4" /> Về cửa hàng
            </Link>
          </div>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
