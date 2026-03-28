-- =============================================
-- V8: Seed Data (Roles, Permissions, Admin Account)
-- =============================================

-- Seed Roles
INSERT INTO role (name, description) VALUES
    ('ADMIN', 'Quản trị viên hệ thống'),
    ('SALES', 'Nhân viên bán hàng'),
    ('WAREHOUSE', 'Nhân viên kho'),
    ('CUSTOMER', 'Khách hàng');

-- Seed Permissions
INSERT INTO permission (code, description) VALUES
    -- Product
    ('product.create', 'Tạo sản phẩm'),
    ('product.update', 'Cập nhật sản phẩm'),
    ('product.delete', 'Xóa sản phẩm'),
    ('product.view', 'Xem sản phẩm'),
    -- Category
    ('category.create', 'Tạo danh mục'),
    ('category.update', 'Cập nhật danh mục'),
    ('category.delete', 'Xóa danh mục'),
    -- Brand
    ('brand.create', 'Tạo thương hiệu'),
    ('brand.update', 'Cập nhật thương hiệu'),
    ('brand.delete', 'Xóa thương hiệu'),
    -- Order
    ('order.view', 'Xem đơn hàng'),
    ('order.update', 'Cập nhật đơn hàng'),
    -- Inventory
    ('inventory.view', 'Xem tồn kho'),
    ('inventory.import', 'Nhập hàng'),
    ('inventory.adjust', 'Điều chỉnh kho'),
    -- Supplier
    ('supplier.create', 'Tạo NCC'),
    ('supplier.update', 'Cập nhật NCC'),
    ('supplier.delete', 'Xóa NCC'),
    -- Coupon
    ('coupon.create', 'Tạo mã giảm giá'),
    ('coupon.update', 'Cập nhật mã giảm giá'),
    ('coupon.delete', 'Xóa mã giảm giá'),
    -- Account
    ('account.view', 'Xem tài khoản'),
    ('account.create', 'Tạo tài khoản nội bộ'),
    ('account.update', 'Cập nhật tài khoản'),
    -- Warranty
    ('warranty.view', 'Xem bảo hành'),
    ('warranty.manage', 'Quản lý bảo hành'),
    ('warranty_policy.create', 'Tạo chính sách BH'),
    ('warranty_policy.update', 'Cập nhật chính sách BH'),
    ('warranty_policy.delete', 'Xóa chính sách BH'),
    -- Return
    ('return.view', 'Xem đổi trả'),
    ('return.manage', 'Duyệt đổi trả'),
    -- Report
    ('report.revenue', 'Xem thống kê doanh thu'),
    -- System
    ('system.admin', 'Quyền quản trị hệ thống');

-- Assign all permissions to ADMIN
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'ADMIN';

-- Assign permissions to SALES
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'SALES'
  AND p.code IN (
    'product.view', 'product.create', 'product.update',
    'order.view', 'order.update',
    'coupon.create', 'coupon.update', 'coupon.delete',
    'warranty.view', 'warranty.manage',
    'return.view', 'return.manage',
    'report.revenue'
  );

-- Assign permissions to WAREHOUSE
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'WAREHOUSE'
  AND p.code IN (
    'product.view',
    'inventory.view', 'inventory.import', 'inventory.adjust'
  );

-- NOTE: Account creation moved to bin/seed-data script.
-- Accounts are created via REST API to ensure correct password hashing
-- regardless of BCrypt configuration or environment (.env).
-- See: bin/seed-data
