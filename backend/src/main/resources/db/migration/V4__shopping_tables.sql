-- =============================================
-- V4: Shopping Tables
-- =============================================

-- Cart (Giỏ hàng — user_id for customer, session_id for guest)
CREATE TABLE cart (
    id         BIGSERIAL       PRIMARY KEY,
    user_id    BIGINT          REFERENCES user_profile(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    created_at TIMESTAMP       DEFAULT NOW(),
    updated_at TIMESTAMP       DEFAULT NOW()
);

-- Cart_Item (Chi tiết giỏ hàng)
CREATE TABLE cart_item (
    id         BIGSERIAL       PRIMARY KEY,
    cart_id    BIGINT          NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    product_id BIGINT          NOT NULL REFERENCES product(id),
    quantity   INT             NOT NULL CHECK (quantity > 0)
);

-- Wishlist (Danh sách yêu thích)
CREATE TABLE wishlist (
    id         BIGSERIAL       PRIMARY KEY,
    user_id    BIGINT          NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
    product_id BIGINT          NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    created_at TIMESTAMP       DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- Indexes
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_cart_session ON cart(session_id);
CREATE INDEX idx_cart_item_cart ON cart_item(cart_id);
CREATE INDEX idx_cart_item_product ON cart_item(product_id);
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
