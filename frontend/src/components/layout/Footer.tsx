import Link from "next/link";
import { Cpu, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#1A4B9C] rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">PC Parts</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Linh kiện máy tính chính hãng, giá tốt nhất thị trường. 
              Bảo hành uy tín, giao hàng toàn quốc.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Sản phẩm</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/products" className="hover:text-amber-400 transition-colors">Tất cả sản phẩm</Link></li>
              <li><Link href="/build-pc" className="hover:text-amber-400 transition-colors">Build PC</Link></li>
              <li><Link href="/products" className="hover:text-amber-400 transition-colors">Khuyến mãi</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Hỗ trợ</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/orders" className="hover:text-amber-400 transition-colors">Tra cứu đơn hàng</Link></li>
              <li><Link href="/warranty" className="hover:text-amber-400 transition-colors">Chính sách bảo hành</Link></li>
              <li><Link href="/warranty" className="hover:text-amber-400 transition-colors">Chính sách đổi trả</Link></li>
              <li><Link href="/products" className="hover:text-amber-400 transition-colors">Hướng dẫn mua hàng</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Liên hệ</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span className="text-white font-medium">1900.6868</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                support@pcparts.vn
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 mt-0.5" />
                TP. Hồ Chí Minh, Việt Nam
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © 2026 PC Parts E-Commerce. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Thanh toán:</span>
              <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">VNPay</span>
              <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">MoMo</span>
              <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">COD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
