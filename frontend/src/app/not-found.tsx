import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Global 404 Not Found page with dark theme design.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
          <Search className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-2xl font-bold text-white mb-2">
            Không tìm thấy trang
          </h2>
          <p className="text-slate-400">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
