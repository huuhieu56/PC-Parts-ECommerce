-- =============================================
-- V1: Authentication & Authorization Tables
-- =============================================

-- Role (Vai trò)
CREATE TABLE role (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(50)     UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- Permission (Quyền hạn)
CREATE TABLE permission (
    id          BIGSERIAL       PRIMARY KEY,
    code        VARCHAR(100)    UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- Role_Permission (Phân quyền)
CREATE TABLE role_permission (
    role_id       BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Account (Tài khoản)
CREATE TABLE account (
    id            BIGSERIAL       PRIMARY KEY,
    email         VARCHAR(255)    UNIQUE NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    is_active     BOOLEAN         DEFAULT TRUE,
    is_verified   BOOLEAN         DEFAULT FALSE,
    role_id       BIGINT          NOT NULL REFERENCES role(id),
    last_login_at TIMESTAMP,
    created_at    TIMESTAMP       DEFAULT NOW(),
    updated_at    TIMESTAMP       DEFAULT NOW()
);

-- User Profile (Thông tin cá nhân)
CREATE TABLE user_profile (
    id            BIGSERIAL       PRIMARY KEY,
    account_id    BIGINT          UNIQUE NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    full_name     VARCHAR(255)    NOT NULL,
    phone         VARCHAR(20)     UNIQUE NOT NULL,
    avatar_url    VARCHAR(500),
    date_of_birth DATE,
    gender        VARCHAR(10),
    created_at    TIMESTAMP       DEFAULT NOW(),
    updated_at    TIMESTAMP       DEFAULT NOW()
);

-- Address (Địa chỉ giao hàng)
CREATE TABLE address (
    id             BIGSERIAL       PRIMARY KEY,
    user_id        BIGINT          NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
    label          VARCHAR(50),
    receiver_name  VARCHAR(255)    NOT NULL,
    receiver_phone VARCHAR(20)     NOT NULL,
    province       VARCHAR(100)    NOT NULL,
    district       VARCHAR(100)    NOT NULL,
    ward           VARCHAR(100)    NOT NULL,
    street         VARCHAR(255)    NOT NULL,
    is_default     BOOLEAN         DEFAULT FALSE,
    created_at     TIMESTAMP       DEFAULT NOW(),
    updated_at     TIMESTAMP       DEFAULT NOW()
);

-- Token (Refresh token, reset password, OTP)
CREATE TABLE token (
    id          BIGSERIAL       PRIMARY KEY,
    account_id  BIGINT          NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    token_type  VARCHAR(20)     NOT NULL,
    token_value VARCHAR(500)    NOT NULL,
    expires_at  TIMESTAMP       NOT NULL,
    created_at  TIMESTAMP       DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_account_email ON account(email);
CREATE INDEX idx_account_role ON account(role_id);
CREATE INDEX idx_user_profile_account ON user_profile(account_id);
CREATE INDEX idx_address_user ON address(user_id);
CREATE INDEX idx_token_account ON token(account_id);
CREATE INDEX idx_token_value ON token(token_value);
