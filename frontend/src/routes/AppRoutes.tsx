/**
 * 🛤️ ĐỊNH TUYẾN ỨNG DỤNG (App Routes)
 * - Cấu hình định tuyến trung tâm theo SYSTEM_DESIGN.md
 * - Sử dụng lazy loading cho hiệu năng
 * - Bảo vệ các tuyến quản trị bằng cơ chế quyền (Protected Routes)
 * - Bao gồm: trang công khai, xác thực, quản trị, nhân viên và 404
 */

import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import NotFoundPage from "../pages/NotFoundPage";

// Layouts
import { MainLayout, AdminLayout, StaffLayout } from "../components/layout";

// Lazy-loaded pages cho performance
const HomePage = React.lazy(() => import("../pages/Home"));
const ProductsPage = React.lazy(() => import("../pages/Products"));
const ProductDetailPage = React.lazy(
  () => import("../pages/Products/ProductDetailPage")
);
const CartPage = React.lazy(() => import("../pages/Cart"));
const ProfilePage = React.lazy(() => import("../pages/Profile/ProfilePage"));
const OrderCreatePage = React.lazy(
  () => import("../pages/Order/OrderCreatePage")
);
const OrderDetailPage = React.lazy(
  () => import("../pages/Order/OrderDetailPage")
);
const BuildPcCheckoutPage = React.lazy(
  () => import("../pages/Order/BuildPcCheckoutPage")
);
const BuildPcPage = React.lazy(() => import("../pages/BuildPC/BuildPcPage"));
const SupportPage = React.lazy(() => import("../pages/Support"));
const WarrantyPolicyPage = React.lazy(
  () => import("../pages/Policies/WarrantyPolicyPage")
);
const ReturnsPolicyPage = React.lazy(
  () => import("../pages/Policies/ReturnsPolicyPage")
);
const ShippingPolicyPage = React.lazy(
  () => import("../pages/Policies/ShippingPolicyPage")
);
const PaymentGuidePage = React.lazy(
  () => import("../pages/Guides/PaymentGuidePage")
);
const BuildPcGuidePage = React.lazy(
  () => import("../pages/Guides/BuildPcGuidePage")
);

// Auth pages
const LoginPage = React.lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = React.lazy(() => import("../pages/auth/RegisterPage"));

// Admin pages
import AdminPanel from "../pages/admin/AdminPanel";

// Admin product pages (lazy)
const AdminProductsList = React.lazy(
  () => import("../pages/admin/products/ProductsList")
);
const AdminProductForm = React.lazy(
  () => import("../pages/admin/products/ProductForm")
);
const AdminUsersList = React.lazy(
  () => import("../pages/admin/users/UsersList")
);
const AdminUserForm = React.lazy(() => import("../pages/admin/users/UserForm"));
const AdminCategoriesList = React.lazy(
  () => import("../pages/admin/categories/CategoriesList")
);
const AdminCategoryForm = React.lazy(
  () => import("../pages/admin/categories/CategoryForm")
);
const AdminCategoryAttributes = React.lazy(
  () => import("../pages/admin/categories/CategoryAttributesManager")
);
const AdminOrdersList = React.lazy(
  () => import("../pages/admin/orders/OrdersList")
);
const AdminInventoryList = React.lazy(
  () => import("../pages/admin/inventory/InventoryList")
);
const AdminPromotionsList = React.lazy(
  () => import("../pages/admin/promotions/PromotionsList")
);
const AdminPromotionForm = React.lazy(
  () => import("../pages/admin/promotions/PromotionForm")
);
const AdminCommentsList = React.lazy(
  () => import("../pages/admin/comments/CommentsList")
);
const AdminReportsPage = React.lazy(
  () => import("../pages/admin/reports/ReportsPage")
);
const AdminSettingsPage = React.lazy(
  () => import("../pages/admin/settings/SettingsPage")
);

// Staff pages
import StaffPanel from "../pages/staff/StaffPanel";
const StaffInventoryOverview = React.lazy(
  () => import("../pages/staff/inventory/InventoryOverview")
);
const StaffOrdersDashboard = React.lazy(
  () => import("../pages/staff/orders/OrdersDashboard")
);
const StaffCommentsResponseCenter = React.lazy(
  () => import("../pages/staff/comments/CommentsResponseCenter")
);

// Protected route components
import { AdminRoute, StaffRoute } from "../components/auth";

// Loading component
const PageLoader: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "50vh",
    }}
  >
    <CircularProgress />
  </Box>
);

// StaffLayout now uses a dedicated sidebar, imported from components/layout

// ===== MAIN ROUTES COMPONENT =====
export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Tuyến công khai dùng MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          {/* Slug danh mục đẹp dưới /products/:slug (ví dụ: /products/cpu) */}
          <Route path="products/:slug" element={<ProductsPage />} />
          <Route path="category/:categoryId" element={<ProductsPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="order/create" element={<OrderCreatePage />} />
          <Route path="order/build-pc" element={<BuildPcCheckoutPage />} />
          <Route path="order/:id" element={<OrderDetailPage />} />
          <Route path="build-pc" element={<BuildPcPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="policies/warranty" element={<WarrantyPolicyPage />} />
          <Route path="policies/returns" element={<ReturnsPolicyPage />} />
          <Route path="policies/shipping" element={<ShippingPolicyPage />} />
          <Route path="guides/payment" element={<PaymentGuidePage />} />
          <Route path="guides/build-pc" element={<BuildPcGuidePage />} />
          {/* Alias: liên kết bảo hành trực tiếp */}
          <Route path="warranty" element={<WarrantyPolicyPage />} />
          {/* Alias: liên kết đổi trả trực tiếp */}
          <Route path="returns" element={<ReturnsPolicyPage />} />
          {/* Alias: liên kết vận chuyển trực tiếp */}
          <Route path="shipping" element={<ShippingPolicyPage />} />
          <Route path="shipping-policy" element={<ShippingPolicyPage />} />
          {/* Alias: hướng dẫn thanh toán */}
          <Route path="payment-guide" element={<PaymentGuidePage />} />
          <Route path="build-pc-guide" element={<BuildPcGuidePage />} />
          <Route path="payment" element={<PaymentGuidePage />} />
          {/* Alias SEO/legacy: /return-policy */}
          <Route path="return-policy" element={<ReturnsPolicyPage />} />

          {/* Các trang đã triển khai */}
          <Route path="profile" element={<ProfilePage />} />
          {/* TODO: bổ sung các trang: checkout, orders, build-pc */}
        </Route>

        {/* Tuyến xác thực - không dùng layout (trang độc lập) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Tuyến Admin - được bảo vệ và lồng dưới AdminLayout */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* Trang chính / bảng điều khiển */}
          <Route index element={<AdminPanel />} />
          {/* Quản lý sản phẩm */}
          <Route
            path="products"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminProductsList />
              </React.Suspense>
            }
          />
          <Route
            path="products/create"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminProductForm />
              </React.Suspense>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminProductForm />
              </React.Suspense>
            }
          />
          {/* Quản lý người dùng */}
          <Route
            path="users"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminUsersList />
              </React.Suspense>
            }
          />
          <Route
            path="users/create"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminUserForm />
              </React.Suspense>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminUserForm />
              </React.Suspense>
            }
          />
          {/* Quản lý danh mục */}
          <Route
            path="categories"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminCategoriesList />
              </React.Suspense>
            }
          />
          <Route
            path="categories/create"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminCategoryForm />
              </React.Suspense>
            }
          />
          <Route
            path="categories/:id/edit"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminCategoryForm />
              </React.Suspense>
            }
          />
          <Route
            path="categories/:id/attributes"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminCategoryAttributes />
              </React.Suspense>
            }
          />
          <Route
            path="inventory"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminInventoryList />
              </React.Suspense>
            }
          />
          <Route
            path="promotions"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminPromotionsList />
              </React.Suspense>
            }
          />
          <Route
            path="promotions/create"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminPromotionForm />
              </React.Suspense>
            }
          />
          <Route
            path="promotions/:id/edit"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminPromotionForm />
              </React.Suspense>
            }
          />
          <Route
            path="comments"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminCommentsList />
              </React.Suspense>
            }
          />
          {/* Quản lý đơn hàng */}
          <Route
            path="orders"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminOrdersList />
              </React.Suspense>
            }
          />
          <Route
            path="orders/:id"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <OrderDetailPage />
              </React.Suspense>
            }
          />
          {/* Báo cáo & Cài đặt */}
          <Route
            path="reports"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminReportsPage />
              </React.Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <AdminSettingsPage />
              </React.Suspense>
            }
          />
          {/* TODO: thêm các tuyến con khác: users, orders, inventory */}
        </Route>

        {/* Tuyến Nhân Viên - được bảo vệ */}
        <Route
          path="/staff"
          element={
            <StaffRoute>
              <StaffLayout />
            </StaffRoute>
          }
        >
          <Route index element={<StaffPanel />} />
          <Route
            path="inventory"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <StaffInventoryOverview />
              </React.Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <StaffOrdersDashboard />
              </React.Suspense>
            }
          />
          <Route
            path="comments"
            element={
              <React.Suspense fallback={<PageLoader />}>
                <StaffCommentsResponseCenter />
              </React.Suspense>
            }
          />
        </Route>

        {/* Trang 404 (độc lập, không header) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
