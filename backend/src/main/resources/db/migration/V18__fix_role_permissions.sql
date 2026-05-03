-- =============================================
-- V18: Fix role permissions to match design spec
-- =============================================
-- Fixes:
-- 1. Remove product.create and product.update from SALES
-- 2. Add report.revenue to WAREHOUSE
-- 3. Add missing inventory.manage permission
-- 4. Remove coupon.create/update/delete from SALES, add coupon.view
-- 5. Add shopping permissions for CUSTOMER (cart, order place/view/cancel)

-- 1. Remove product write permissions from SALES
DELETE FROM role_permission
WHERE role_id = (SELECT id FROM role WHERE name = 'SALES')
  AND permission_id IN (
    SELECT id FROM permission WHERE code IN ('product.create', 'product.update')
  );

-- 2. Add report.revenue to WAREHOUSE (dashboard access for all staff)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'WAREHOUSE' AND p.code = 'report.revenue'
ON CONFLICT DO NOTHING;

-- 3. Add inventory.manage permission (was used by SupplierController but never seeded)
INSERT INTO permission (code, description) VALUES
    ('inventory.manage', 'Quản lý nhà cung cấp')
ON CONFLICT (code) DO NOTHING;

-- 4. Assign inventory.manage to ADMIN and WAREHOUSE
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name IN ('ADMIN', 'WAREHOUSE') AND p.code = 'inventory.manage'
ON CONFLICT DO NOTHING;

-- 5. Add coupon.view permission (SALES needs read-only access)
INSERT INTO permission (code, description) VALUES
    ('coupon.view', 'Xem mã giảm giá')
ON CONFLICT (code) DO NOTHING;

-- 6. Remove coupon write permissions from SALES
DELETE FROM role_permission
WHERE role_id = (SELECT id FROM role WHERE name = 'SALES')
  AND permission_id IN (
    SELECT id FROM permission WHERE code IN ('coupon.create', 'coupon.update', 'coupon.delete')
  );

-- 7. Assign coupon.view to SALES (read-only access)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'SALES' AND p.code = 'coupon.view'
ON CONFLICT DO NOTHING;

-- 8. Add shopping permissions for CUSTOMER role
INSERT INTO permission (code, description) VALUES
    ('cart.manage', 'Quản lý giỏ hàng'),
    ('order.place', 'Đặt hàng'),
    ('order.view_own', 'Xem đơn hàng của mình'),
    ('order.cancel', 'Hủy đơn hàng của mình')
ON CONFLICT (code) DO NOTHING;

-- 9. Assign shopping permissions to CUSTOMER
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'CUSTOMER' AND p.code IN ('cart.manage', 'order.place', 'order.view_own', 'order.cancel')
ON CONFLICT DO NOTHING;
