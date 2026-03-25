"use client";

import Link from "next/link";
import { Cpu, ShoppingCart, Heart, User, Menu, LogOut, Package, Settings } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navLinks = [
  { href: "/products", label: "Sản phẩm" },
  { href: "/build-pc", label: "Build PC" },
];

export function Header() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SALES" || user?.role === "WAREHOUSE";

  return (
    <header className="border-b border-slate-800/50 backdrop-blur-md bg-slate-950/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            PC Parts
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/wishlist" className="p-2 text-slate-400 hover:text-white transition-colors">
                <Heart className="w-5 h-5" />
              </Link>
              <Link href="/cart" className="p-2 text-slate-400 hover:text-white transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center p-2 text-slate-300 hover:text-white transition-colors rounded-md hover:bg-slate-800">
                  <User className="w-5 h-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-700">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{user?.fullName}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem className="text-slate-300 cursor-pointer">
                    <Link href="/profile" className="flex items-center w-full"><Settings className="mr-2 h-4 w-4" />Tài khoản</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 cursor-pointer">
                    <Link href="/orders" className="flex items-center w-full"><Package className="mr-2 h-4 w-4" />Đơn hàng</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="text-slate-300 cursor-pointer">
                      <Link href="/admin" className="flex items-center w-full"><Settings className="mr-2 h-4 w-4" />Quản trị</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    onClick={clearAuth}
                    className="text-red-400 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/cart" className="p-2 text-slate-400 hover:text-white transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20 text-white"
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="md:hidden inline-flex items-center justify-center p-2 text-slate-300 hover:text-white rounded-md">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="right" className="bg-slate-900 border-slate-800 w-72">
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-300 hover:text-white transition-colors text-lg font-medium py-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/cart" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white py-2 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />Giỏ hàng
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/orders" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white py-2 flex items-center gap-2">
                    <Package className="w-5 h-5" />Đơn hàng
                  </Link>
                  <button onClick={() => { clearAuth(); setMobileOpen(false); }} className="text-red-400 hover:text-red-300 py-2 flex items-center gap-2 text-left">
                    <LogOut className="w-5 h-5" />Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-center font-medium text-white"
                >
                  Đăng nhập
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
