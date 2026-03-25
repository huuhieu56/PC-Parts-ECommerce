import Link from "next/link";
import { Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">PC Parts</span>
            </div>
            <p className="text-sm text-slate-400">
              Linh kiện máy tính chính hãng, giá tốt nhất thị trường.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Sản phẩm</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/products" className="hover:text-white transition-colors">Tất cả sản phẩm</Link></li>
              <li><Link href="/build-pc" className="hover:text-white transition-colors">Build PC</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/orders" className="hover:text-white transition-colors">Tra cứu đơn hàng</Link></li>
              <li><span className="cursor-default">Chính sách bảo hành</span></li>
              <li><span className="cursor-default">Chính sách đổi trả</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>📞 1900-XXXX</li>
              <li>📧 support@pcparts.vn</li>
              <li>📍 TP. Hồ Chí Minh</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/50 pt-6 text-center">
          <p className="text-sm text-slate-500">
            © 2026 PC Parts E-Commerce. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
