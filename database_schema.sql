-- Computer Shop Database Schema
-- PostgreSQL Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS users_seq START 1;
CREATE SEQUENCE IF NOT EXISTS categories_seq START 1;
CREATE SEQUENCE IF NOT EXISTS products_seq START 1;
CREATE SEQUENCE IF NOT EXISTS product_images_seq START 1;
CREATE SEQUENCE IF NOT EXISTS carts_seq START 1;
CREATE SEQUENCE IF NOT EXISTS cart_items_seq START 1;
CREATE SEQUENCE IF NOT EXISTS orders_seq START 1;
CREATE SEQUENCE IF NOT EXISTS order_items_seq START 1;
CREATE SEQUENCE IF NOT EXISTS comments_seq START 1;
CREATE SEQUENCE IF NOT EXISTS inventory_logs_seq START 1;
CREATE SEQUENCE IF NOT EXISTS promotions_seq START 1;
CREATE SEQUENCE IF NOT EXISTS tokens_seq START 1;
CREATE SEQUENCE IF NOT EXISTS roles_seq START 1;
CREATE SEQUENCE IF NOT EXISTS attributes_seq START 1;

-- Roles table
CREATE TABLE roles (
    id BIGINT PRIMARY KEY DEFAULT nextval('roles_seq'),
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY DEFAULT nextval('users_seq'),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL, 
    address TEXT,
    role_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Categories table
CREATE TABLE categories (
    id BIGINT PRIMARY KEY DEFAULT nextval('categories_seq'),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id BIGINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Products table
CREATE TABLE products (
    id BIGINT PRIMARY KEY DEFAULT nextval('products_seq'),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    category_id BIGINT NOT NULL,
    specifications JSONB,
    attributes JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_low_stock_threshold CHECK (low_stock_threshold >= 0)
);

-- Attribute Definitions table (per-category filter schema)
CREATE TABLE IF NOT EXISTS attribute_definitions (
    id BIGINT PRIMARY KEY DEFAULT nextval('attributes_seq'),
    category_id BIGINT NOT NULL,
    code VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    data_type VARCHAR(20) NOT NULL,   -- string | number | boolean | enum
    input_type VARCHAR(30) NOT NULL,  -- select 
    unit VARCHAR(50),
    sort_order INTEGER,
    options JSONB,                    -- predefined options for enum/select
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_attrdef_category_code UNIQUE (category_id, code),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Product images table
CREATE TABLE product_images (
    id BIGINT PRIMARY KEY DEFAULT nextval('product_images_seq'),
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Carts table
CREATE TABLE carts (
    id BIGINT PRIMARY KEY DEFAULT nextval('carts_seq'),
    user_id BIGINT NOT NULL UNIQUE, -- Mỗi user chỉ có 1 cart
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cart items table
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY DEFAULT nextval('cart_items_seq'),
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_item_quantity CHECK (quantity > 0),
    UNIQUE(cart_id, product_id)
);

-- Orders table
CREATE TABLE orders (
    id BIGINT PRIMARY KEY DEFAULT nextval('orders_seq'),
    order_code VARCHAR(50) UNIQUE NOT NULL, 
    user_id BIGINT NOT NULL,
    customer_name VARCHAR(100) NOT NULL, 
    customer_email VARCHAR(100) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    promotion_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(20) DEFAULT 'COD',
    shipping_address TEXT NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_total_amount CHECK (total_amount > 0), 
    CONSTRAINT chk_discount_amount CHECK (discount_amount >= 0),
    CONSTRAINT chk_final_amount CHECK (final_amount > 0), 
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('COD'))
);

-- Order items table
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY DEFAULT nextval('order_items_seq'),
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL, 
    quantity INTEGER NOT NULL,
    price DECIMAL(15,2) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_item_quantity CHECK (quantity > 0),
    CONSTRAINT chk_order_item_price CHECK (price >= 0)
);

-- Comments table
CREATE TABLE comments (
    id BIGINT PRIMARY KEY DEFAULT nextval('comments_seq'),
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    parent_comment_id BIGINT,
    content TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Inventory logs table
CREATE TABLE inventory_logs (
    id BIGINT PRIMARY KEY DEFAULT nextval('inventory_logs_seq'),
    product_id BIGINT NOT NULL,
    change_type VARCHAR(10) NOT NULL,
    quantity_change INTEGER NOT NULL, -- Số lượng thay đổi (+/-)
    reason VARCHAR(200),
    performed_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_change_type CHECK (change_type IN ('IN', 'OUT'))
);

-- Promotions table
CREATE TABLE promotions (
    id BIGINT PRIMARY KEY DEFAULT nextval('promotions_seq'),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(15,2) NOT NULL,
    minimum_order_amount DECIMAL(15,2) DEFAULT 0,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_discount_type CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    CONSTRAINT chk_discount_value CHECK (discount_value > 0),
    CONSTRAINT chk_minimum_order_amount CHECK (minimum_order_amount >= 0),
    CONSTRAINT chk_date_range CHECK (end_date > start_date)
);

-- Tokens table
CREATE TABLE tokens (
    id BIGINT PRIMARY KEY DEFAULT nextval('tokens_seq'),
    token VARCHAR(500) UNIQUE NOT NULL,
    token_type VARCHAR(50) NOT NULL DEFAULT 'ACCESS_TOKEN',
    expiration_date TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    expired BOOLEAN NOT NULL DEFAULT false,
    user_id BIGINT NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_token_type CHECK (token_type IN ('ACCESS_TOKEN', 'REFRESH_TOKEN', 'RESET_PASSWORD', 'EMAIL_VERIFICATION'))
);

-- Add foreign key for promotions in orders table
ALTER TABLE orders ADD CONSTRAINT fk_orders_promotion 
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role_id);

CREATE INDEX idx_roles_name ON roles(name);

CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_categories_active ON categories(is_active);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_low_stock ON products(quantity, low_stock_threshold);
CREATE INDEX idx_products_specifications ON products USING GIN (specifications);
-- JSONB attributes index for dynamic filtering
CREATE INDEX idx_products_attributes_gin ON products USING GIN (attributes jsonb_path_ops);

-- Indexes for attribute_definitions
CREATE INDEX IF NOT EXISTS idx_attrdefs_category ON attribute_definitions(category_id);
CREATE INDEX IF NOT EXISTS idx_attrdefs_active ON attribute_definitions(is_active);


CREATE INDEX idx_products_attr_brand ON products ((attributes->>'brand'));
CREATE INDEX idx_products_attr_generation ON products (
    (CAST(NULLIF(regexp_replace(attributes->>'generation', '[^0-9]', '', 'g'), '') AS int))
);

-- OPTIMIZED: Composite indexes cho filtering queries phức tạp
CREATE INDEX idx_products_category_price ON products(category_id, price) WHERE is_active = true;
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_active_price ON products(is_active, price);
CREATE INDEX idx_products_quantity_active ON products(quantity, is_active);

-- OPTIMIZED: Full-text search index cho product name (PostgreSQL specific)
CREATE INDEX idx_products_name_fulltext ON products USING GIN (to_tsvector('english', name));
CREATE INDEX idx_products_description_fulltext ON products USING GIN (to_tsvector('english', description));

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(is_primary);

CREATE INDEX idx_carts_user ON carts(user_id);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
CREATE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_promotion ON orders(promotion_id);
CREATE INDEX idx_orders_order_code ON orders(order_code);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_comments_product ON comments(product_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_staff_reply ON comments(is_staff_reply);

-- OPTIMIZED: Composite index cho comment queries (root comments vs replies)
CREATE INDEX idx_comments_product_parent ON comments(product_id, parent_comment_id);
CREATE INDEX idx_comments_product_created ON comments(product_id, created_at DESC) WHERE parent_comment_id IS NULL;

CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_performed_by ON inventory_logs(performed_by);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX idx_inventory_logs_change_type ON inventory_logs(change_type);

CREATE INDEX idx_promotions_active ON promotions(is_active);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_discount_type ON promotions(discount_type);

CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_expiration ON tokens(expiration_date);
CREATE INDEX idx_tokens_type ON tokens(token_type);
CREATE INDEX idx_tokens_revoked ON tokens(revoked);
CREATE INDEX idx_tokens_expired ON tokens(expired);

CREATE INDEX idx_product_name ON products USING GIN (to_tsvector('english', name));
CREATE INDEX idx_product_category ON products(category_id) WHERE is_active = true;
CREATE INDEX idx_product_price ON products(price) WHERE is_active = true;
CREATE INDEX idx_product_quantity ON products(quantity) WHERE is_active = true;

-- Index cho JOIN
CREATE INDEX idx_cart_item_cart_product ON cart_items(cart_id, product_id);
CREATE INDEX idx_order_user_status ON orders(user_id, status);
CREATE INDEX idx_comment_product ON comments(product_id) WHERE parent_comment_id IS NULL;

-- Composite index cho filtering
CREATE INDEX idx_product_category_price ON products(category_id, price) WHERE is_active = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Insert roles
INSERT INTO roles (name) VALUES 
('ADMIN'),
('STAFF'),
('CUSTOMER');

-- Insert categories
INSERT INTO categories (name, description) VALUES 
('CPU', 'Bộ vi xử lý'),
('Video Card', 'Card đồ họa'),
('Memory', 'Bộ nhớ trong'),
('Motherboard', 'Bo mạch chủ'),
('Power Supply', 'Nguồn máy tính'),
('Case', 'Vỏ máy tính'),
('Monitor', 'Màn hình máy tính'),
('Keyboard', 'Bàn phím'),
('Mouse', 'Chuột máy tính'),
('Headphones', 'Tai nghe'),
('Operating System', 'Hệ điều hành'),
('Sound Card', 'Card âm thanh'),
('Speakers', 'Loa máy tính'),
('UPS', 'Bộ lưu điện'),
('Webcam', 'Thiết bị webcam'),
('Wired Network Card', 'Card mạng có dây'),
('Wireless Network Card', 'Card mạng không dây'),
('Case Accessory', 'Phụ kiện case'),
('Case Fan', 'Quạt case'),
('CPU Cooler', 'Tản nhiệt CPU'),
('External Hard Drive', 'Ổ cứng gắn ngoài'),
('Internal Hard Drive', 'Ổ cứng gắn trong'),
('Optical Drive', 'Ổ đĩa quang'),
('Fan Controller', 'Bộ điều khiển quạt'),
('Thermal Paste', 'Keo tản nhiệt');

-- Insert admin user (password: admin123)
INSERT INTO users (username, email, password, phone, full_name, role_id) VALUES 
('admin', 'admin@computershop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0000000000', 'Administrator', 
 (SELECT id FROM roles WHERE name = 'ADMIN'));

-- Insert staff user (password: staff123)
INSERT INTO users (username, email, password, phone, full_name, role_id) VALUES 
('staff', 'staff@computershop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0000000001', 'Staff Member', 
 (SELECT id FROM roles WHERE name = 'STAFF'));


-- Insert sample promotions
INSERT INTO promotions (name, description, discount_type, discount_value, minimum_order_amount, start_date, end_date) VALUES 
('Khuyến mãi Tết 2025', 'Giảm 10% cho đơn hàng từ 10 triệu', 'PERCENTAGE', 10.00, 10000000, '2025-01-01 00:00:00', '2025-02-28 23:59:59'),
('Giảm giá linh kiện', 'Giảm 500K cho đơn hàng từ 5 triệu', 'FIXED_AMOUNT', 500000.00, 5000000, '2025-01-01 00:00:00', '2025-12-31 23:59:59');


COMMIT;