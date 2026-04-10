"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <div className="print:hidden"><Header /></div>
      <main className="flex-1">{children}</main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
