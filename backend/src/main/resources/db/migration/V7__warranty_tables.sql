-- =============================================
-- V7: Warranty & Return Tables
-- =============================================

-- Warranty_Policy (Chính sách bảo hành)
CREATE TABLE warranty_policy (
    id              BIGSERIAL       PRIMARY KEY,
    category_id     BIGINT          REFERENCES category(id) ON DELETE SET NULL,
    product_id      BIGINT          REFERENCES product(id) ON DELETE SET NULL,
    duration_months INT             NOT NULL,
    conditions      TEXT,
    description     TEXT
);

-- Warranty_Ticket (Phiếu bảo hành)
CREATE TABLE warranty_ticket (
    id                BIGSERIAL       PRIMARY KEY,
    user_id           BIGINT          NOT NULL REFERENCES user_profile(id),
    product_id        BIGINT          NOT NULL REFERENCES product(id),
    order_id          BIGINT          NOT NULL REFERENCES orders(id),
    serial_number     VARCHAR(100),
    issue_description TEXT            NOT NULL,
    status            VARCHAR(20)     DEFAULT 'RECEIVED',
    resolution        TEXT,
    resolved_at       TIMESTAMP,
    created_at        TIMESTAMP       DEFAULT NOW(),
    updated_at        TIMESTAMP       DEFAULT NOW()
);

-- Return (Đổi trả / Hoàn tiền)
CREATE TABLE return_request (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES user_profile(id),
    order_id        BIGINT          NOT NULL REFERENCES orders(id),
    order_detail_id BIGINT          NOT NULL REFERENCES order_detail(id),
    type            VARCHAR(20)     NOT NULL,
    reason          TEXT            NOT NULL,
    status          VARCHAR(20)     DEFAULT 'PENDING_APPROVAL',
    refund_amount   DECIMAL(15,2),
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_warranty_policy_category ON warranty_policy(category_id);
CREATE INDEX idx_warranty_policy_product ON warranty_policy(product_id);
CREATE INDEX idx_warranty_ticket_user ON warranty_ticket(user_id);
CREATE INDEX idx_warranty_ticket_status ON warranty_ticket(status);
CREATE INDEX idx_return_request_user ON return_request(user_id);
CREATE INDEX idx_return_request_order ON return_request(order_id);
CREATE INDEX idx_return_request_status ON return_request(status);
