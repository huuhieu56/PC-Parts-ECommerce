import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy trang</h1>
        <p className="text-gray-500 text-sm mb-6">Trang bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Về trang chủ
          </Link>
          <Link href="/products" className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1">
            <Search className="w-4 h-4" /> Tìm sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}
