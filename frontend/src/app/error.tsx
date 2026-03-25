"use client";

import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h1>
        <p className="text-gray-500 text-sm mb-6">{error.message || "Vui lòng thử lại sau."}</p>
        <button onClick={reset} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Thử lại
        </button>
      </div>
    </div>
  );
}
