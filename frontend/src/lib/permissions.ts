/**
 * Permission constants matching backend permission codes.
 * Centralized for type safety and autocomplete.
 */
export const Permission = {
  // Product
  PRODUCT_CREATE: "product.create",
  PRODUCT_UPDATE: "product.update",
  PRODUCT_DELETE: "product.delete",
  PRODUCT_VIEW: "product.view",

  // Category
  CATEGORY_CREATE: "category.create",
  CATEGORY_UPDATE: "category.update",
  CATEGORY_DELETE: "category.delete",

  // Brand
  BRAND_CREATE: "brand.create",
  BRAND_UPDATE: "brand.update",
  BRAND_DELETE: "brand.delete",

  // Order
  ORDER_VIEW: "order.view",
  ORDER_UPDATE: "order.update",

  // Inventory
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_IMPORT: "inventory.import",
  INVENTORY_ADJUST: "inventory.adjust",
  INVENTORY_MANAGE: "inventory.manage",

  // Supplier
  SUPPLIER_CREATE: "supplier.create",
  SUPPLIER_UPDATE: "supplier.update",
  SUPPLIER_DELETE: "supplier.delete",

  // Coupon
  COUPON_VIEW: "coupon.view",
  COUPON_CREATE: "coupon.create",
  COUPON_UPDATE: "coupon.update",
  COUPON_DELETE: "coupon.delete",

  // Account
  ACCOUNT_VIEW: "account.view",
  ACCOUNT_CREATE: "account.create",
  ACCOUNT_UPDATE: "account.update",

  // Warranty
  WARRANTY_VIEW: "warranty.view",
  WARRANTY_MANAGE: "warranty.manage",
  WARRANTY_POLICY_CREATE: "warranty_policy.create",
  WARRANTY_POLICY_UPDATE: "warranty_policy.update",
  WARRANTY_POLICY_DELETE: "warranty_policy.delete",

  // Return
  RETURN_VIEW: "return.view",
  RETURN_MANAGE: "return.manage",

  // Report
  REPORT_REVENUE: "report.revenue",

  // Banner / Slider
  BANNER_VIEW: "banner.view",
  BANNER_CREATE: "banner.create",
  BANNER_UPDATE: "banner.update",
  BANNER_DELETE: "banner.delete",

  // Shopping (CUSTOMER only)
  CART_MANAGE: "cart.manage",
  ORDER_PLACE: "order.place",
  ORDER_VIEW_OWN: "order.view_own",
  ORDER_CANCEL: "order.cancel",

  // System
  SYSTEM_ADMIN: "system.admin",
} as const;

export type PermissionCode = (typeof Permission)[keyof typeof Permission];

/**
 * Admin module route -> required permission mapping.
 * null means any staff can access (Dashboard).
 */
export const ADMIN_ROUTES: Record<string, PermissionCode | null> = {
  "/admin": null, // Dashboard - any staff
  "/admin/products": Permission.PRODUCT_VIEW,
  "/admin/categories": Permission.CATEGORY_CREATE,
  "/admin/brands": Permission.BRAND_CREATE,
  "/admin/orders": Permission.ORDER_VIEW,
  "/admin/inventory": Permission.INVENTORY_VIEW,
  "/admin/suppliers": Permission.INVENTORY_MANAGE,
  "/admin/coupons": Permission.COUPON_VIEW,
  "/admin/warranty": Permission.WARRANTY_VIEW,
  "/admin/returns": Permission.RETURN_VIEW,
  "/admin/accounts": Permission.ACCOUNT_VIEW,
  "/admin/statistics": Permission.REPORT_REVENUE,
  "/admin/banners": Permission.BANNER_VIEW,
};

/**
 * Check if a path requires a specific permission.
 * Returns the required permission or null if accessible to all staff.
 */
export function getRequiredPermission(pathname: string): PermissionCode | null {
  // Exact match first
  if (pathname in ADMIN_ROUTES) {
    return ADMIN_ROUTES[pathname];
  }

  // Check parent routes for nested paths like /admin/products/123/edit
  for (const route of Object.keys(ADMIN_ROUTES)) {
    if (pathname.startsWith(route + "/")) {
      return ADMIN_ROUTES[route];
    }
  }

  return null;
}
