"use client";

import { useAuthStore } from "@/stores/auth-store";
import type { PermissionCode } from "@/lib/permissions";

interface PermissionGateProps {
  /** Required permission(s) */
  permission: PermissionCode | PermissionCode[];
  /** Require ALL permissions (default: false = any) */
  requireAll?: boolean;
  /** Content to show when authorized */
  children: React.ReactNode;
  /** Content to show when not authorized (optional) */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on user permissions.
 * Use this to hide buttons, forms, or sections based on permissions.
 *
 * @example
 * <PermissionGate permission={Permission.PRODUCT_DELETE}>
 *   <Button variant="destructive">Delete</Button>
 * </PermissionGate>
 *
 * @example
 * <PermissionGate
 *   permission={[Permission.PRODUCT_CREATE, Permission.PRODUCT_UPDATE]}
 *   requireAll={true}
 * >
 *   <ProductForm />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission } = useAuthStore();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? permissions.every((p) => hasPermission(p))
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
