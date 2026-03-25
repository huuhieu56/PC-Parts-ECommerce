-- =============================================
-- V3: Inventory Tables
-- =============================================

-- Supplier (Nhà cung cấp)
CREATE TABLE supplier (
    id             BIGSERIAL       PRIMARY KEY,
    name           VARCHAR(255)    NOT NULL,
    contact_person VARCHAR(255),
    phone          VARCHAR(20),
    email          VARCHAR(255),
    address        TEXT
);

-- Inventory (Kho hàng — 1:1 with Product)
CREATE TABLE inventory (
    id                  BIGSERIAL       PRIMARY KEY,
    product_id          BIGINT          UNIQUE NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    quantity            INT             DEFAULT 0,
    low_stock_threshold INT             DEFAULT 10,
    supplier_id         BIGINT          REFERENCES supplier(id) ON DELETE SET NULL,
    updated_at          TIMESTAMP       DEFAULT NOW()
);

-- Inventory_Log (Lịch sử biến động kho)
CREATE TABLE inventory_log (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL REFERENCES product(id),
    type            VARCHAR(20)     NOT NULL,
    quantity_change INT             NOT NULL,
    performed_by    BIGINT          REFERENCES account(id),
    note            TEXT,
    created_at      TIMESTAMP       DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_log_product ON inventory_log(product_id);
CREATE INDEX idx_inventory_log_type ON inventory_log(type);
CREATE INDEX idx_inventory_log_created ON inventory_log(created_at);
