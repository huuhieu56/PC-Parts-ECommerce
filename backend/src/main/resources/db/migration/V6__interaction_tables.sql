-- =============================================
-- V6: Review & Interaction Tables
-- =============================================

-- Review (Đánh giá sản phẩm)
CREATE TABLE review (
    id         BIGSERIAL       PRIMARY KEY,
    user_id    BIGINT          NOT NULL REFERENCES user_profile(id),
    product_id BIGINT          NOT NULL REFERENCES product(id),
    order_id   BIGINT          NOT NULL REFERENCES orders(id),
    rating     INT             NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content    TEXT,
    created_at TIMESTAMP       DEFAULT NOW()
);

-- Review_Image (Ảnh đánh giá)
CREATE TABLE review_image (
    id        BIGSERIAL       PRIMARY KEY,
    review_id BIGINT          NOT NULL REFERENCES review(id) ON DELETE CASCADE,
    image_url VARCHAR(500)    NOT NULL
);

-- Indexes
CREATE INDEX idx_review_product ON review(product_id);
CREATE INDEX idx_review_user ON review(user_id);
CREATE INDEX idx_review_order ON review(order_id);
CREATE INDEX idx_review_image_review ON review_image(review_id);
