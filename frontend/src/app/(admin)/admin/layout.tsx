"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Tag,
  Shield,
  Cpu,
  LogOut,
  FolderTree,
  Bookmark,
  Factory,
  Users,
  RotateCcw,
  BarChart3,
  Images,
  LucideIcon,
} from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAuthStore } from "@/stores/auth-store";
import { Permission, PermissionCode } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: PermissionCode | null;
}

/**
 * Admin navigation items with required permissions.
 * permission: null means accessible to all staff.
 */
const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/admin/products", label: "Sản phẩm", icon: Package, permission: Permission.PRODUCT_VIEW },
  { href: "/admin/categories", label: "Danh mục", icon: FolderTree, permission: Permission.CATEGORY_CREATE },
  { href: "/admin/brands", label: "Thương hiệu", icon: Bookmark, permission: Permission.BRAND_CREATE },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart, permission: Permission.ORDER_VIEW },
  { href: "/admin/inventory", label: "Kho hàng", icon: Warehouse, permission: Permission.INVENTORY_VIEW },
  { href: "/admin/suppliers", label: "Nhà cung cấp", icon: Factory, permission: Permission.SUPPLIER_CREATE },
  { href: "/admin/coupons", label: "Mã giảm giá", icon: Tag, permission: Permission.COUPON_CREATE },
  { href: "/admin/warranty", label: "Bảo hành", icon: Shield, permission: Permission.WARRANTY_VIEW },
  { href: "/admin/returns", label: "Đổi trả", icon: RotateCcw, permission: Permission.RETURN_VIEW },
  { href: "/admin/accounts", label: "Tài khoản", icon: Users, permission: Permission.ACCOUNT_VIEW },
  { href: "/admin/statistics", label: "Thống kê", icon: BarChart3, permission: Permission.REPORT_REVENUE },
  { href: "/admin/banners", label: "Banner", icon: Images, permission: Permission.BANNER_VIEW },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasPermission } = useAuthStore();

  // Filter nav items by user permissions
  const visibleNavItems = adminNavItems.filter((item) => {
    if (item.permission === null) return true; // Dashboard accessible to all staff
    return hasPermission(item.permission);
  });

  return (
    <AdminGuard>
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
              {visibleNavItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-400"}`} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-gray-200 mt-4">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Về cửa hàng
              </Link>
            </div>
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AdminGuard>
  );
}
