-- =============================================
-- V15: Banner / Slider Content Tables
-- =============================================

CREATE TABLE banner (
    id          BIGSERIAL       PRIMARY KEY,
    title       VARCHAR(255)    NOT NULL,
    image_url   VARCHAR(500)    NOT NULL,
    link_url    VARCHAR(500),
    sort_order  INT             DEFAULT 0,
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    start_date  TIMESTAMP,
    end_date    TIMESTAMP,
    created_at  TIMESTAMP       DEFAULT NOW(),
    updated_at  TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX idx_banner_status ON banner(status);
CREATE INDEX idx_banner_display_order ON banner(status, sort_order, start_date, end_date);

INSERT INTO permission (code, description) VALUES
    ('banner.view', 'Xem banner trang chủ'),
    ('banner.create', 'Tạo banner trang chủ'),
    ('banner.update', 'Cập nhật banner trang chủ'),
    ('banner.delete', 'Xóa banner trang chủ')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'ADMIN'
  AND p.code IN ('banner.view', 'banner.create', 'banner.update', 'banner.delete')
ON CONFLICT DO NOTHING;
