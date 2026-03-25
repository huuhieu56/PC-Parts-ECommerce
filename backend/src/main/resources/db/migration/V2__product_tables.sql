-- =============================================
-- V2: Product Catalog Tables
-- =============================================

-- Category (Danh mục — self-referencing hierarchy)
CREATE TABLE category (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(255)    UNIQUE NOT NULL,
    description TEXT,
    parent_id   BIGINT          REFERENCES category(id) ON DELETE SET NULL,
    level       INT             DEFAULT 0,
    created_at  TIMESTAMP       DEFAULT NOW(),
    updated_at  TIMESTAMP       DEFAULT NOW()
);

-- Brand (Thương hiệu)
CREATE TABLE brand (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(255)    UNIQUE NOT NULL,
    logo_url    VARCHAR(500),
    description TEXT
);

-- Product (Sản phẩm)
CREATE TABLE product (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    sku             VARCHAR(100)    UNIQUE NOT NULL,
    slug            VARCHAR(255)    UNIQUE NOT NULL,
    original_price  DECIMAL(15,2)   NOT NULL,
    selling_price   DECIMAL(15,2)   NOT NULL,
    description     TEXT,
    category_id     BIGINT          NOT NULL REFERENCES category(id),
    brand_id        BIGINT          NOT NULL REFERENCES brand(id),
    condition       VARCHAR(20)     NOT NULL DEFAULT 'NEW',
    status          VARCHAR(20)     DEFAULT 'ACTIVE',
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

-- Attribute (Thuộc tính kỹ thuật per category)
CREATE TABLE attribute (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    category_id BIGINT          NOT NULL REFERENCES category(id) ON DELETE CASCADE
);

-- Attribute_Value (Giá trị thuộc tính)
CREATE TABLE attribute_value (
    id           BIGSERIAL       PRIMARY KEY,
    attribute_id BIGINT          NOT NULL REFERENCES attribute(id) ON DELETE CASCADE,
    value        VARCHAR(255)    NOT NULL
);

-- Product_Attribute (Liên kết SP — Thuộc tính — Giá trị)
CREATE TABLE product_attribute (
    product_id         BIGINT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    attribute_id       BIGINT NOT NULL REFERENCES attribute(id) ON DELETE CASCADE,
    attribute_value_id BIGINT NOT NULL REFERENCES attribute_value(id),
    PRIMARY KEY (product_id, attribute_id)
);

-- Product_Image (Hình ảnh sản phẩm)
CREATE TABLE product_image (
    id         BIGSERIAL       PRIMARY KEY,
    product_id BIGINT          NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    image_url  VARCHAR(500)    NOT NULL,
    is_primary BOOLEAN         DEFAULT FALSE,
    sort_order INT             DEFAULT 0
);

-- Indexes
CREATE INDEX idx_product_category ON product(category_id);
CREATE INDEX idx_product_brand ON product(brand_id);
CREATE INDEX idx_product_slug ON product(slug);
CREATE INDEX idx_product_sku ON product(sku);
CREATE INDEX idx_product_status ON product(status);
CREATE INDEX idx_attribute_category ON attribute(category_id);
CREATE INDEX idx_attribute_value_attr ON attribute_value(attribute_id);
CREATE INDEX idx_product_image_product ON product_image(product_id);
