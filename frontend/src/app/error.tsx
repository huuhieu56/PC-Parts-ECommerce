"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Global error boundary — catches unhandled errors in the app.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Đã xảy ra lỗi
          </h2>
          <p className="text-slate-400">
            Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại sau.
          </p>
        </div>
        <Button
          onClick={reset}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
        >
          Thử lại
        </Button>
      </div>
    </div>
  );
}
