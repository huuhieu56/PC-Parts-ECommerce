-- =============================================
-- V19: Remove report.revenue from WAREHOUSE
-- =============================================
-- WAREHOUSE should only manage inventory, not view revenue statistics.
-- Dashboard access is now handled by hasAnyAuthority('report.revenue', 'inventory.view')
-- in AdminDashboardController.

DELETE FROM role_permission
WHERE role_id = (SELECT id FROM role WHERE name = 'WAREHOUSE')
  AND permission_id = (SELECT id FROM permission WHERE code = 'report.revenue');
