import { Cpu, ShoppingCart, Wrench, Shield, Truck, Star } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-md bg-slate-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              PC Parts
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Sản phẩm
            </Link>
            <Link href="/build-pc" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Build PC
            </Link>
            <Link href="/cart" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
            >
              Đăng nhập
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-8">
            <Star className="w-4 h-4" />
            <span>Linh kiện chính hãng — Giá tốt nhất</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Xây dựng{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              PC trong mơ
            </span>
            <br />
            của bạn
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Hàng ngàn linh kiện máy tính từ các thương hiệu hàng đầu.
            Công cụ Build PC thông minh với AI kiểm tra tương thích.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-lg font-semibold hover:from-blue-500 hover:to-purple-500 transition-all shadow-xl shadow-blue-500/25"
            >
              Khám phá sản phẩm
            </Link>
            <Link
              href="/build-pc"
              className="px-8 py-4 bg-slate-800/80 border border-slate-700/50 rounded-xl text-lg font-semibold hover:bg-slate-700/80 transition-all backdrop-blur"
            >
              Build PC ngay
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Wrench,
              title: "Build PC thông minh",
              desc: "Chọn linh kiện, AI kiểm tra tương thích, xuất báo giá PDF",
              gradient: "from-blue-500 to-cyan-500",
            },
            {
              icon: Shield,
              title: "Bảo hành chính hãng",
              desc: "Chính sách bảo hành rõ ràng, hỗ trợ đổi trả dễ dàng",
              gradient: "from-purple-500 to-pink-500",
            },
            {
              icon: Truck,
              title: "Giao hàng toàn quốc",
              desc: "Miễn phí giao hàng cho đơn từ 500K, giao nhanh 24h nội thành",
              gradient: "from-orange-500 to-red-500",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">PC Parts</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 PC Parts E-Commerce. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
