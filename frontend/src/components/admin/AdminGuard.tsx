"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getRequiredPermission } from "@/lib/permissions";

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Guards admin routes by checking authentication and permissions.
 * - Not authenticated -> redirect to login
 * - Not staff -> redirect to home
 * - No permission for route -> redirect to admin dashboard
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const isStaff = useAuthStore((state) => state.isStaff);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Compute authorization status using useMemo to avoid setState in effect
  const authStatus = useMemo(() => {
    if (!mounted) return "loading";
    if (!isAuthenticated || !user) return "unauthenticated";
    if (!isStaff()) return "not-staff";

    const requiredPermission = getRequiredPermission(pathname);
    if (requiredPermission !== null && !hasPermission(requiredPermission)) {
      return "no-permission";
    }

    return "authorized";
  }, [mounted, isAuthenticated, user, pathname, hasPermission, isStaff]);

  // Handle redirects in a separate effect
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login?redirect=" + encodeURIComponent(pathname));
    } else if (authStatus === "not-staff") {
      router.replace("/");
    } else if (authStatus === "no-permission") {
      router.replace("/admin");
    }
  }, [authStatus, router, pathname]);

  // Show loading while checking or redirecting
  if (authStatus !== "authorized") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
