| Hinh | Sequence (source) | Khop code? | Da sua | Ghi chu |
| --- | --- | --- | --- | --- |
| Hinh 3.10 | Dang ky tai khoan (seq_register.puml) | ✅ Khop | — | Endpoint, check trung email/phone, tao Account + UserProfile dung. |
| Hinh 3.11 | Dang nhap & merge gio hang (seq_login.puml) | ✅ Khop | Sua docs | Tach merge cart thanh buoc rieng (`POST /cart/merge`). Them rate limiter, account lock check. |
| Hinh 3.12 | Dang xuat & refresh token (seq_logout_refresh.puml) | ✅ Khop | Sua docs | Refresh tra ca access + refresh (rotation). Logout dung `auth.getName()` xoa tat ca token. |
| Hinh 3.13 | Thay doi mat khau (seq_change_password.puml) | ✅ Khop | Sua docs | Them `confirmPassword`, dung accountId, xoa refresh token sau khi doi. |
| Hinh 3.14 | Quen & reset mat khau (seq_forgot_password.puml) | ✅ Khop | Sua docs | Them `confirmPassword` vao reset request. Xoa token cu truoc khi tao moi. |
| Hinh 3.15 | Cap nhat thong tin ca nhan (seq_update_profile.puml) | ✅ Khop | — | Da khop tu dau, khong can sua. |
| Hinh 3.15a | Quan ly dia chi giao hang (seq_manage_address.puml) | ✅ Khop | Sua docs | Bo soft-delete logic (khong co trong code). |
| Hinh 3.16 | Duyet/tim kiem/loc san pham (seq_search_filter.puml) | ✅ Khop | Sua docs | Params dung (`keyword`, `attributeValueIds`). Them `/products/filters`. Bo Redis cache, bo `/categories/{id}/products`. |
| Hinh 3.17 | Xem chi tiet san pham (seq_product_detail.puml) | ✅ Khop | Sua docs | Reviews endpoint: `/reviews/product/{productId}`. Bo Redis cache. |
| Hinh 3.18 | Quan ly gio hang (seq_cart.puml) | ✅ Khop | Sua docs | `X-Session-Id` header, `PUT /{productId}?quantity=`, `DELETE /{productId}`, them clear cart + get cart. |
| Hinh 3.19 | Checkout & tao don hang (seq_checkout.puml) | ✅ Khop | Sua docs | Bo MoMo payment URL flow (chua implement). Ghi chu ro. |
| Hinh 3.20 | MoMo callback (seq_payment_callback.puml) | ⚠️ Chua implement | Sua docs | Danh dau **CHUA TRIEN KHAI**. Giu thiet ke du kien de tham khao. |
| Hinh 3.21 | Lich su & chi tiet don hang (seq_order_history.puml) | ✅ Khop | Sua docs | Bo `status` query param (customer endpoint khong ho tro). Page 0-based. |
| Hinh 3.22 | Huy don hang (seq_cancel_order.puml) | ✅ Khop | Sua docs | Khong co endpoint customer cancel rieng. Huy qua admin `PUT /orders/{id}/status?status=CANCELLED`. |
| Hinh 3.23 | Doi tra & hoan tien (seq_return_refund.puml) | ✅ Khop | Sua docs | Endpoints: `/returns`, `/returns/my`, `PUT /returns/{id}/status`. Bo `PATCH /admin/returns/{id}`. |
| Hinh 3.24 | Yeu cau bao hanh (seq_warranty.puml) | ✅ Khop | Sua docs | Endpoint `/warranty` (khong `/warranty-tickets`). Admin list `/warranty/admin`. Update `PUT /{id}/status`. |
| Hinh 3.25 | Danh gia san pham (seq_review.puml) | ✅ Khop | Sua docs | Upload anh truoc (`/reviews/images`). Bo update/delete (chua co). Reviews tai `/reviews/product/{productId}`. |
| Hinh 3.26 | Wishlist (seq_wishlist.puml) | ✅ Khop | Sua docs | `POST/DELETE /{productId}`. GET tra List (khong pagination). Bo toggle logic. |
| Hinh 3.27 | Build PC + AI (seq_build_pc.puml) | ✅ Khop | Sua docs | Chi co `check-compatibility`. Bo categories, products, export-quote, add-to-cart. Ghi chu chua implement. |
| Hinh 3.28 | Admin quan ly san pham (seq_admin_product.puml) | ✅ Khop | Sua docs | `/api/v1/products` + RBAC `@PreAuthorize`. Upload `/products/{id}/images`. |
| Hinh 3.29 | Admin quan ly danh muc (seq_admin_category.puml) | ✅ Khop | Sua docs | `/api/v1/categories` + RBAC. Bo attribute endpoints (chua co). |
| Hinh 3.30 | Admin quan ly ton kho (seq_admin_inventory.puml) | ✅ Khop | Sua docs | `/inventory/{productId}/import\|export\|adjust\|logs`. Khong co list endpoint. |
| Hinh 3.31 | Admin cap nhat trang thai don (seq_admin_order_status.puml) | ✅ Khop | Sua docs | List: `GET /orders/admin`. Update: `PUT /orders/{id}/status?status=`. |
| Hinh 3.32 | Admin quan ly nguoi dung (seq_admin_users.puml) | ✅ Khop | Sua docs | `/admin/accounts`. `PUT /{id}/status` body `{isActive}`. `PUT /{id}/role` body `{roleName}`. |
| Hinh 3.33 | Admin quan ly coupon (seq_admin_coupon.puml) | ✅ Khop | Sua docs | `/coupons` (khong `/admin/coupons`). GET tra List. Them validate endpoint. |
| Hinh 3.34 | Gui thong bao (seq_notification.puml) | ✅ Khop | Sua docs | `PUT` (khong `PATCH`). Them `unread-count` va `read-all`. Bo email trigger. |
| Hinh 3.35 | Admin quan ly banner/slider (design.md) | ✅ Khop | — | BannerController co day du CRUD + reorder. |
