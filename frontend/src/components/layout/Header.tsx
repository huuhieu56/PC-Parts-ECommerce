"use client";

import Link from "next/link";
import { Cpu, ShoppingCart, Heart, User, Menu, LogOut, Package, Settings, Search, Phone, MapPin, Tag, Monitor } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useRef } from "react";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/build-pc", label: "Build PC" },
];

export function Header() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { totalItems } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [cartShake, setCartShake] = useState(false);
  const prevTotalItems = useRef(totalItems);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SALES" || user?.role === "WAREHOUSE";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Shake cart icon when items count increases
  useEffect(() => {
    if (mounted && totalItems > prevTotalItems.current) {
      setCartShake(true);
      const timer = setTimeout(() => setCartShake(false), 600);
      return () => clearTimeout(timer);
    }
    prevTotalItems.current = totalItems;
  }, [totalItems, mounted]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?keyword=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-[#0D2B5E] text-white/90 text-xs">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              1900.XXXX
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Hệ thống Showroom
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/products" className="flex items-center gap-1 hover:text-amber-400 transition-colors">
              <Tag className="w-3 h-3" />
              Khuyến mãi
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-[#1A4B9C] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white hidden sm:block">
              PC Parts
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-10 rounded-md bg-white text-gray-900 text-sm placeholder:text-gray-400 border-0 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button type="submit" className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center bg-amber-500 hover:bg-amber-600 rounded-r-md transition-colors">
                <Search className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/build-pc" className="flex flex-col items-center gap-0.5 px-3 py-1 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white">
              <Monitor className="w-5 h-5" />
              <span className="text-[10px] font-medium">Build PC</span>
            </Link>
            {mounted && isAuthenticated && (
              <Link href="/wishlist" className="flex flex-col items-center gap-0.5 px-3 py-1 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white">
                <Heart className="w-5 h-5" />
                <span className="text-[10px] font-medium">Yêu thích</span>
              </Link>
            )}
            <Link href="/cart" className={`flex flex-col items-center gap-0.5 px-3 py-1 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white relative ${cartShake ? 'animate-cart-shake' : ''}`}>
              <ShoppingCart className="w-5 h-5" />
              <span className="text-[10px] font-medium">Giỏ hàng</span>
              {mounted && totalItems > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center transition-transform ${cartShake ? 'animate-badge-bounce' : ''}`}>{totalItems > 9 ? "9+" : totalItems}</span>
              )}
            </Link>
            {mounted && isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex flex-col items-center gap-0.5 px-3 py-1 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white cursor-pointer">
                  <User className="w-5 h-5" />
                  <span className="text-[10px] font-medium truncate max-w-[60px]">{user?.fullName?.split(' ').pop() || 'Tài khoản'}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 text-gray-900">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem className="text-gray-700 cursor-pointer hover:bg-gray-50">
                    <Link href="/profile" className="flex items-center w-full"><Settings className="mr-2 h-4 w-4" />Tài khoản</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-700 cursor-pointer hover:bg-gray-50">
                    <Link href="/orders" className="flex items-center w-full"><Package className="mr-2 h-4 w-4" />Đơn hàng</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="text-gray-700 cursor-pointer hover:bg-gray-50">
                      <Link href="/admin" className="flex items-center w-full"><Settings className="mr-2 h-4 w-4" />Quản trị</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem
                    onClick={clearAuth}
                    className="text-red-600 cursor-pointer hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center gap-0.5 px-3 py-1 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] font-medium">Đăng nhập</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center p-2 text-white hover:bg-white/10 rounded-md">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-white border-gray-200 w-72 text-gray-900">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link href="/cart" onClick={() => setMobileOpen(false)} className="text-gray-700 hover:text-blue-600 py-2 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />Giỏ hàng
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="text-gray-700 hover:text-blue-600 py-2 flex items-center gap-2">
                      <Heart className="w-5 h-5" />Yêu thích
                    </Link>
                    <Link href="/orders" onClick={() => setMobileOpen(false)} className="text-gray-700 hover:text-blue-600 py-2 flex items-center gap-2">
                      <Package className="w-5 h-5" />Đơn hàng
                    </Link>
                    <button onClick={() => { clearAuth(); setMobileOpen(false); }} className="text-red-600 hover:text-red-500 py-2 flex items-center gap-2 text-left">
                      <LogOut className="w-5 h-5" />Đăng xuất
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="mt-4 px-4 py-3 bg-[#1A4B9C] rounded-lg text-center font-medium text-white"
                  >
                    Đăng nhập
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-[#1A4B9C] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="hidden md:flex items-center gap-0 h-10 -mb-px">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 h-full flex items-center text-sm font-medium text-white/90 hover:text-amber-400 hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/products"
              className="px-4 h-full flex items-center text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-white/5 transition-colors"
            >
              🔥 Khuyến mãi
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
