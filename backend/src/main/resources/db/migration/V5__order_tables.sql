-- =============================================
-- V5: Order & Payment Tables
-- =============================================

-- Coupon (Mã giảm giá)
CREATE TABLE coupon (
    id              BIGSERIAL       PRIMARY KEY,
    code            VARCHAR(50)     UNIQUE NOT NULL,
    discount_type   VARCHAR(10)     NOT NULL,
    discount_value  DECIMAL(15,2)   NOT NULL,
    min_order_value DECIMAL(15,2)   DEFAULT 0,
    max_discount    DECIMAL(15,2),
    max_uses        INT             DEFAULT 0,
    used_count      INT             DEFAULT 0,
    start_date      TIMESTAMP       NOT NULL,
    end_date        TIMESTAMP       NOT NULL,
    created_at      TIMESTAMP       DEFAULT NOW()
);

-- Order (Đơn hàng)
CREATE TABLE orders (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES user_profile(id),
    address_id      BIGINT          NOT NULL REFERENCES address(id),
    subtotal        DECIMAL(15,2)   NOT NULL,
    discount_amount DECIMAL(15,2)   DEFAULT 0,
    total_amount    DECIMAL(15,2)   NOT NULL,
    status          VARCHAR(20)     DEFAULT 'PENDING',
    note            TEXT,
    coupon_id       BIGINT          REFERENCES coupon(id),
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

-- Order_Detail (Chi tiết đơn hàng)
CREATE TABLE order_detail (
    id         BIGSERIAL       PRIMARY KEY,
    order_id   BIGINT          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT          NOT NULL REFERENCES product(id),
    quantity   INT             NOT NULL,
    unit_price DECIMAL(15,2)   NOT NULL,
    line_total DECIMAL(15,2)   NOT NULL
);

-- Payment (Thanh toán)
CREATE TABLE payment (
    id             BIGSERIAL       PRIMARY KEY,
    order_id       BIGINT          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method         VARCHAR(20)     NOT NULL,
    amount         DECIMAL(15,2)   NOT NULL,
    status         VARCHAR(20)     DEFAULT 'PENDING',
    transaction_id VARCHAR(255),
    paid_at        TIMESTAMP,
    created_at     TIMESTAMP       DEFAULT NOW()
);

-- Shipping (Vận chuyển — 1:1 with Order)
CREATE TABLE shipping (
    id               BIGSERIAL       PRIMARY KEY,
    order_id         BIGINT          UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider         VARCHAR(50),
    tracking_number  VARCHAR(100),
    shipping_fee     DECIMAL(15,2)   DEFAULT 0,
    status           VARCHAR(20)     DEFAULT 'WAITING_PICKUP',
    estimated_date   DATE,
    delivered_date   DATE,
    created_at       TIMESTAMP       DEFAULT NOW(),
    updated_at       TIMESTAMP       DEFAULT NOW()
);

-- Coupon_Usage (Lịch sử sử dụng mã)
CREATE TABLE coupon_usage (
    id        BIGSERIAL       PRIMARY KEY,
    coupon_id BIGINT          NOT NULL REFERENCES coupon(id),
    user_id   BIGINT          NOT NULL REFERENCES user_profile(id),
    order_id  BIGINT          NOT NULL REFERENCES orders(id),
    used_at   TIMESTAMP       DEFAULT NOW(),
    UNIQUE (coupon_id, user_id)
);

-- Order_Status_History (Lịch sử trạng thái)
CREATE TABLE order_status_history (
    id         BIGSERIAL       PRIMARY KEY,
    order_id   BIGINT          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20)     NOT NULL,
    changed_by BIGINT          REFERENCES account(id),
    note       TEXT,
    created_at TIMESTAMP       DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_detail_order ON order_detail(order_id);
CREATE INDEX idx_payment_order ON payment(order_id);
CREATE INDEX idx_payment_status ON payment(status);
CREATE INDEX idx_shipping_order ON shipping(order_id);
CREATE INDEX idx_coupon_code ON coupon(code);
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
