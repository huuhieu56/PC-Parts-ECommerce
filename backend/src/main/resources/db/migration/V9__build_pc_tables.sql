-- V9: Build PC configuration tables
-- Cho phép Guest và Customer tự chọn linh kiện ráp PC

CREATE TABLE pc_build (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES user_profile(id),
    session_id VARCHAR(100),
    name VARCHAR(200) DEFAULT 'Cấu hình mới',
    total_price DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pc_build_component (
    id BIGSERIAL PRIMARY KEY,
    build_id BIGINT NOT NULL REFERENCES pc_build(id) ON DELETE CASCADE,
    slot_type VARCHAR(50) NOT NULL,
    product_id BIGINT NOT NULL REFERENCES product(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pc_build_user ON pc_build(user_id);
CREATE INDEX idx_pc_build_session ON pc_build(session_id);
CREATE INDEX idx_pc_build_component_build ON pc_build_component(build_id);
