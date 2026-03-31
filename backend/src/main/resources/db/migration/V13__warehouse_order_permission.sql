-- =============================================
-- V13: Add order.view permission to WAREHOUSE role
-- =============================================
-- Allows WAREHOUSE staff to view orders (needed for preparing shipments)

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'WAREHOUSE' AND p.code = 'order.view';
