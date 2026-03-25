import Link from "next/link";
import { Cpu, Monitor, MemoryStick, HardDrive, Zap, ShoppingCart, ArrowRight, Star, ChevronRight, Truck, Shield, Headphones } from "lucide-react";

const categories = [
  { name: "CPU", icon: Cpu, href: "/products?category=cpu", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { name: "Mainboard", icon: Monitor, href: "/products?category=mainboard", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { name: "RAM", icon: MemoryStick, href: "/products?category=ram", color: "bg-purple-50 text-purple-600 border-purple-200" },
  { name: "SSD/HDD", icon: HardDrive, href: "/products?category=ssd", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { name: "VGA", icon: Zap, href: "/products?category=vga", color: "bg-red-50 text-red-600 border-red-200" },
  { name: "Nguồn", icon: Zap, href: "/products?category=psu", color: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  { name: "Case", icon: Monitor, href: "/products?category=case", color: "bg-orange-50 text-orange-600 border-orange-200" },
  { name: "Tản nhiệt", icon: Zap, href: "/products?category=cooling", color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
];

const brands = ["Intel", "AMD", "ASUS", "GIGABYTE", "MSI", "CORSAIR", "Kingston", "Samsung", "WD", "Lenovo", "LG", "Dell"];

const promoBanners = [
  { title: "TBVP", sub: "Giảm tới 32%", gradient: "from-red-500 to-orange-400" },
  { title: "MÀN HÌNH", sub: "Giảm 1 Triệu", gradient: "from-blue-500 to-cyan-400" },
  { title: "GEAR", sub: "Giảm 50%", gradient: "from-fuchsia-500 to-purple-500" },
];

const productTabs = ["BÁN CHẠY", "PC GAMING", "LAPTOP", "MÀN HÌNH GAMING"];

const featuredProducts = [
  { id: 1, name: "CPU Intel Core i5-13600K", sku: "CPU0156", price: 6990000, oldPrice: 8190000, rating: 4.5, reviews: 23, image: null, discount: 15, inStock: true },
  { id: 2, name: "VGA MSI RTX 4060 VENTUS 2X", sku: "VGA0089", price: 8990000, oldPrice: null, rating: 4.8, reviews: 45, image: null, discount: 0, inStock: true },
  { id: 3, name: "RAM G.Skill Trident Z5 RGB DDR5", sku: "RAM0234", price: 3490000, oldPrice: 4990000, rating: 4.6, reviews: 12, image: null, discount: 30, inStock: true },
  { id: 4, name: "Mainboard ASUS ROG STRIX Z790-A", sku: "MB00456", price: 8990000, oldPrice: null, rating: 4.7, reviews: 18, image: null, discount: 0, inStock: true },
  { id: 5, name: "SSD Samsung 990 PRO 1TB NVMe", sku: "SSD0078", price: 3290000, oldPrice: 3790000, rating: 4.9, reviews: 67, image: null, discount: 13, inStock: true },
];

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + " đ";
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
        ))}
      </div>
      <span className="text-xs text-gray-400">({reviews})</span>
    </div>
  );
}

function ProductCard({ product }: { product: typeof featuredProducts[0] }) {
  return (
    <div className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 p-4">
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center">
          <Cpu className="w-12 h-12 text-gray-400" />
        </div>
        {product.discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            -{product.discount}%
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
          <button className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-md shadow-sm hover:bg-white transition-colors">
            So sánh
          </button>
          <button className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-md shadow-sm hover:bg-white transition-colors">
            ❤️ Thích
          </button>
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 mb-1.5">Mã SP: {product.sku}</p>
        <StarRating rating={product.rating} reviews={product.reviews} />
        <div className="mt-2">
          {product.oldPrice && (
            <p className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</p>
          )}
          <p className="text-[#E31837] font-bold text-base">{formatPrice(product.price)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs text-green-600 flex items-center gap-0.5">✓ Còn hàng</span>
          </div>
          <button className="w-8 h-8 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors">
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-gray-50">
      {/* Hero Banner + Promo Cards */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Hero Banner */}
          <div className="lg:col-span-2 relative rounded-xl overflow-hidden bg-gradient-to-r from-[#1A4B9C] to-[#2563EB] text-white min-h-[300px] flex">
            <div className="flex-1 p-8 flex flex-col justify-center">
              <span className="text-amber-400 text-sm font-semibold mb-2 uppercase tracking-wide">🔥 Sản phẩm HOT</span>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
                Linh kiện chính hãng<br />
                <span className="text-amber-400">Giá tốt nhất</span>
              </h1>
              <p className="text-white/80 mb-6 text-sm">
                CPU, GPU, RAM, SSD từ Intel, AMD, NVIDIA — Bảo hành chính hãng
              </p>
              <div className="flex gap-3">
                <Link
                  href="/products"
                  className="bg-[#E31837] hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors shadow-lg"
                >
                  MUA NGAY
                </Link>
                <Link
                  href="/build-pc"
                  className="bg-white/15 hover:bg-white/25 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors backdrop-blur-sm border border-white/20"
                >
                  BUILD PC
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center pr-8 opacity-30">
              <Cpu className="w-48 h-48" />
            </div>
          </div>
          {/* Side Promo Cards */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-xl overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 flex flex-col justify-center">
              <p className="text-sm font-semibold opacity-90 mb-1">BUILD PC CẤP</p>
              <p className="text-2xl font-bold">Giảm lên đến 30tr</p>
              <Link href="/build-pc" className="text-sm mt-2 flex items-center gap-1 underline underline-offset-4 hover:opacity-80 transition-opacity">
                Xây dựng ngay <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 flex flex-col justify-center">
              <p className="text-sm font-semibold opacity-90 mb-1">LAPTOP</p>
              <p className="text-2xl font-bold">Giảm thêm 1 Triệu</p>
              <Link href="/products" className="text-sm mt-2 flex items-center gap-1 underline underline-offset-4 hover:opacity-80 transition-opacity">
                Xem ngay <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Danh mục nổi bật</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border hover:shadow-md transition-all ${cat.color}`}
              >
                <cat.icon className="w-7 h-7" />
                <span className="text-xs font-medium text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Logos */}
      <section className="max-w-7xl mx-auto px-4 pb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max">
            {brands.map((brand) => (
              <span key={brand} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer whitespace-nowrap">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promoBanners.map((b) => (
            <div
              key={b.title}
              className={`bg-gradient-to-r ${b.gradient} rounded-xl text-white p-6 flex flex-col justify-center hover:shadow-lg transition-shadow cursor-pointer`}
            >
              <p className="text-sm font-semibold opacity-90">{b.title}</p>
              <p className="text-2xl font-bold">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Products with Tabs */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6">
            <div className="flex items-center gap-0 overflow-x-auto">
              <h2 className="text-lg font-bold text-[#1A4B9C] flex items-center gap-2 pr-4 py-4 border-b-2 border-[#1A4B9C] whitespace-nowrap">
                TOP SẢN PHẨM BÁN CHẠY
              </h2>
              {productTabs.slice(1).map((tab) => (
                <button
                  key={tab}
                  className="px-4 py-4 text-sm font-medium text-gray-500 hover:text-[#1A4B9C] border-b-2 border-transparent hover:border-[#1A4B9C] transition-colors whitespace-nowrap"
                >
                  {tab}
                </button>
              ))}
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.sku.toLowerCase()}`}>
                  <ProductCard product={product} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Bar */}
      <section className="max-w-7xl mx-auto px-4 py-6 pb-10">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Giao hàng</p>
                <p className="text-xs text-gray-500">Toàn quốc</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Bảo hành</p>
                <p className="text-xs text-gray-500">Chính hãng đến 36 tháng</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Giá tốt nhất</p>
                <p className="text-xs text-gray-500">Cam kết giá tốt</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Hỗ trợ 24/7</p>
                <p className="text-xs text-gray-500">Tư vấn miễn phí</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
