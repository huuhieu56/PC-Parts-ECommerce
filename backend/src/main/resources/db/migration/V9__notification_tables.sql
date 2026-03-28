-- =============================================
-- V10: Notification Tables
-- =============================================

CREATE TABLE notification (
    id         BIGSERIAL       PRIMARY KEY,
    user_id    BIGINT          NOT NULL REFERENCES user_profile(id),
    title      VARCHAR(255)    NOT NULL,
    message    TEXT            NOT NULL,
    type       VARCHAR(50)     NOT NULL DEFAULT 'SYSTEM',
    is_read    BOOLEAN         DEFAULT FALSE,
    created_at TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX idx_notification_user ON notification(user_id);
CREATE INDEX idx_notification_read ON notification(user_id, is_read);
CREATE INDEX idx_notification_created ON notification(created_at DESC);
