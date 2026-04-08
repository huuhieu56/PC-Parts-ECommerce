-- =============================================
-- V11: Comprehensive Seed Data
-- Categories, Brands, Attributes, Products, Inventory, Suppliers, Coupons, Customer
-- =============================================

-- =============================================
-- 1. CATEGORIES (9 root categories)
-- =============================================
INSERT INTO category (name, description, parent_id, level) VALUES
    ('CPU', 'Bộ vi xử lý - Processor', NULL, 0),
    ('Mainboard', 'Bo mạch chủ - Motherboard', NULL, 0),
    ('RAM', 'Bộ nhớ trong - Memory', NULL, 0),
    ('SSD', 'Ổ cứng thể rắn - Solid State Drive', NULL, 0),
    ('HDD', 'Ổ cứng cơ học - Hard Disk Drive', NULL, 0),
    ('VGA', 'Card đồ hoạ - Graphics Card', NULL, 0),
    ('PSU', 'Nguồn máy tính - Power Supply Unit', NULL, 0),
    ('Case', 'Vỏ máy tính - Computer Case', NULL, 0),
    ('Cooling', 'Tản nhiệt - CPU Cooler & Fans', NULL, 0);

-- =============================================
-- 2. BRANDS (12 brands)
-- =============================================
INSERT INTO brand (name, logo_url, description) VALUES
    ('Intel', NULL, 'Nhà sản xuất CPU và chipset hàng đầu thế giới'),
    ('AMD', NULL, 'Nhà sản xuất CPU và GPU hiệu năng cao'),
    ('ASUS', NULL, 'Thương hiệu mainboard, VGA và gaming gear hàng đầu'),
    ('GIGABYTE', NULL, 'Nhà sản xuất mainboard và VGA uy tín từ Đài Loan'),
    ('MSI', NULL, 'Thương hiệu gaming gear và linh kiện cao cấp'),
    ('CORSAIR', NULL, 'Chuyên RAM, PSU, tản nhiệt và gaming gear'),
    ('Kingston', NULL, 'Nhà sản xuất RAM và SSD phổ biến toàn cầu'),
    ('Samsung', NULL, 'Tập đoàn điện tử — SSD và RAM hàng đầu'),
    ('Western Digital', NULL, 'Nhà sản xuất ổ cứng và SSD uy tín'),
    ('NZXT', NULL, 'Thương hiệu case và tản nhiệt thiết kế hiện đại'),
    ('Cooler Master', NULL, 'Chuyên case, tản nhiệt và PSU chất lượng'),
    ('Seasonic', NULL, 'Nhà sản xuất PSU cao cấp hàng đầu thế giới'),
    ('G.Skill', NULL, 'Chuyên RAM hiệu năng cao cho gaming và workstation'),
    ('Noctua', NULL, 'Tản nhiệt khí cao cấp — thiết kế Áo — yên tĩnh nhất'),
    ('be quiet!', NULL, 'Thương hiệu Đức — PSU và tản nhiệt yên tĩnh');

-- =============================================
-- 3. ATTRIBUTES (EAV per category)
-- =============================================

-- CPU Attributes
INSERT INTO attribute (name, category_id) VALUES
    ('Socket', (SELECT id FROM category WHERE name = 'CPU')),
    ('Số nhân', (SELECT id FROM category WHERE name = 'CPU')),
    ('Số luồng', (SELECT id FROM category WHERE name = 'CPU')),
    ('Xung nhịp cơ bản', (SELECT id FROM category WHERE name = 'CPU')),
    ('Xung nhịp boost', (SELECT id FROM category WHERE name = 'CPU')),
    ('TDP', (SELECT id FROM category WHERE name = 'CPU'));

-- Mainboard Attributes
INSERT INTO attribute (name, category_id) VALUES
    ('Socket', (SELECT id FROM category WHERE name = 'Mainboard')),
    ('Chipset', (SELECT id FROM category WHERE name = 'Mainboard')),
    ('Form Factor', (SELECT id FROM category WHERE name = 'Mainboard')),
    ('Khe RAM', (SELECT id FROM category WHERE name = 'Mainboard')),
    ('Loại RAM', (SELECT id FROM category WHERE name = 'Mainboard'));

-- RAM Attributes
INSERT INTO attribute (name, category_id) VALUES
    ('Loại RAM', (SELECT id FROM category WHERE name = 'RAM')),
    ('Dung lượng', (SELECT id FROM category WHERE name = 'RAM')),
    ('Bus Speed', (SELECT id FROM category WHERE name = 'RAM')),
    ('CAS Latency', (SELECT id FROM category WHERE name = 'RAM'));

-- SSD Attributes
INSERT INTO attribute (name, category_id) VALUES
    ('Giao tiếp', (SELECT id FROM category WHERE name = 'SSD')),
    ('Dung lượng', (SELECT id FROM category WHERE name = 'SSD')),
    ('Tốc độ đọc', (SELECT id FROM category WHERE name = 'SSD')),
    ('Tốc độ ghi', (SELECT id FROM category WHERE name = 'SSD'));

-- HDD Attributes
INSERT INTO attribute (name, category_id) VALUES
    ('Dung lượng', (SELECT id FROM category WHERE name = 'HDD')),
    ('Tốc độ quay', (SELECT id FROM category WHERE name = 'HDD')),
    ('Cache', (SELECT id FROM category WHERE name = 'HDD')),
    ('Giao tiếp', (SELECT id FROM category WHERE name = 'HDD'));

-- VGA Attributes
INSERT INTO attribute (name, category_id) VALUES
    ('GPU Chip', (SELECT id FROM category WHERE name = 'VGA')),
    ('VRAM', (SELECT id FROM category WHERE name = 'VGA')),
    ('Loại bộ nhớ', (SELECT id FROM category WHERE name = 'VGA')),
    ('Yêu cầu nguồn', (SELECT id FROM category WHERE name = 'VGA'));

-- PSU Attributes
INSERT INTO attribute (name, category_id) VALUES
    ('Công suất', (SELECT id FROM category WHERE name = 'PSU')),
    ('Hiệu suất', (SELECT id FROM category WHERE name = 'PSU')),
    ('Modular', (SELECT id FROM category WHERE name = 'PSU'));

-- Case Attributes
INSERT INTO attribute (name, category_id) VALUES
    ('Form Factor hỗ trợ', (SELECT id FROM category WHERE name = 'Case')),
    ('Chất liệu', (SELECT id FROM category WHERE name = 'Case')),
    ('Số khe quạt', (SELECT id FROM category WHERE name = 'Case'));

-- Cooling Attributes
INSERT INTO attribute (name, category_id) VALUES
    ('Loại tản nhiệt', (SELECT id FROM category WHERE name = 'Cooling')),
    ('Kích thước quạt/Radiator', (SELECT id FROM category WHERE name = 'Cooling')),
    ('TDP hỗ trợ', (SELECT id FROM category WHERE name = 'Cooling'));

-- =============================================
-- 4. ATTRIBUTE VALUES
-- =============================================

-- CPU Socket values
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('LGA 1700'), ('LGA 1200'), ('AM5'), ('AM4')) AS t(val)
WHERE a.name = 'Socket' AND a.category_id = (SELECT id FROM category WHERE name = 'CPU');

-- CPU Cores values
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('6'), ('8'), ('10'), ('12'), ('14'), ('16'), ('24')) AS t(val)
WHERE a.name = 'Số nhân' AND a.category_id = (SELECT id FROM category WHERE name = 'CPU');

-- CPU Threads values
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('12'), ('16'), ('20'), ('24'), ('28'), ('32')) AS t(val)
WHERE a.name = 'Số luồng' AND a.category_id = (SELECT id FROM category WHERE name = 'CPU');

-- CPU Base Clock
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('2.5 GHz'), ('3.0 GHz'), ('3.4 GHz'), ('3.5 GHz'), ('3.6 GHz'), ('3.8 GHz'), ('4.2 GHz'), ('4.7 GHz')) AS t(val)
WHERE a.name = 'Xung nhịp cơ bản' AND a.category_id = (SELECT id FROM category WHERE name = 'CPU');

-- CPU Boost Clock
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('4.5 GHz'), ('4.7 GHz'), ('4.9 GHz'), ('5.0 GHz'), ('5.1 GHz'), ('5.2 GHz'), ('5.4 GHz'), ('5.6 GHz'), ('5.8 GHz')) AS t(val)
WHERE a.name = 'Xung nhịp boost' AND a.category_id = (SELECT id FROM category WHERE name = 'CPU');

-- CPU TDP
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('65W'), ('105W'), ('125W'), ('170W'), ('253W')) AS t(val)
WHERE a.name = 'TDP' AND a.category_id = (SELECT id FROM category WHERE name = 'CPU');

-- Mainboard Socket
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('LGA 1700'), ('LGA 1200'), ('AM5'), ('AM4')) AS t(val)
WHERE a.name = 'Socket' AND a.category_id = (SELECT id FROM category WHERE name = 'Mainboard');

-- Mainboard Chipset
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('Z790'), ('B760'), ('H770'), ('X670E'), ('B650'), ('B550'), ('X570')) AS t(val)
WHERE a.name = 'Chipset' AND a.category_id = (SELECT id FROM category WHERE name = 'Mainboard');

-- Mainboard Form Factor
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('ATX'), ('Micro-ATX'), ('Mini-ITX')) AS t(val)
WHERE a.name = 'Form Factor' AND a.category_id = (SELECT id FROM category WHERE name = 'Mainboard');

-- Mainboard RAM Slots
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('2'), ('4')) AS t(val)
WHERE a.name = 'Khe RAM' AND a.category_id = (SELECT id FROM category WHERE name = 'Mainboard');

-- Mainboard RAM Type
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('DDR4'), ('DDR5')) AS t(val)
WHERE a.name = 'Loại RAM' AND a.category_id = (SELECT id FROM category WHERE name = 'Mainboard');

-- RAM Type
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('DDR4'), ('DDR5')) AS t(val)
WHERE a.name = 'Loại RAM' AND a.category_id = (SELECT id FROM category WHERE name = 'RAM');

-- RAM Capacity
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('8GB'), ('16GB'), ('32GB'), ('64GB'), ('16GB (2x8GB)'), ('32GB (2x16GB)'), ('64GB (2x32GB)')) AS t(val)
WHERE a.name = 'Dung lượng' AND a.category_id = (SELECT id FROM category WHERE name = 'RAM');

-- RAM Bus Speed
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('3200 MHz'), ('3600 MHz'), ('4800 MHz'), ('5200 MHz'), ('5600 MHz'), ('6000 MHz'), ('6400 MHz')) AS t(val)
WHERE a.name = 'Bus Speed' AND a.category_id = (SELECT id FROM category WHERE name = 'RAM');

-- RAM CAS Latency
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('CL16'), ('CL18'), ('CL30'), ('CL32'), ('CL36'), ('CL40')) AS t(val)
WHERE a.name = 'CAS Latency' AND a.category_id = (SELECT id FROM category WHERE name = 'RAM');

-- SSD Interface
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('NVMe PCIe Gen 4'), ('NVMe PCIe Gen 3'), ('SATA III'), ('NVMe PCIe Gen 5')) AS t(val)
WHERE a.name = 'Giao tiếp' AND a.category_id = (SELECT id FROM category WHERE name = 'SSD');

-- SSD Capacity
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('250GB'), ('500GB'), ('1TB'), ('2TB'), ('4TB')) AS t(val)
WHERE a.name = 'Dung lượng' AND a.category_id = (SELECT id FROM category WHERE name = 'SSD');

-- SSD Read Speed
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('560 MB/s'), ('2100 MB/s'), ('3500 MB/s'), ('5000 MB/s'), ('7000 MB/s'), ('7450 MB/s')) AS t(val)
WHERE a.name = 'Tốc độ đọc' AND a.category_id = (SELECT id FROM category WHERE name = 'SSD');

-- SSD Write Speed
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('530 MB/s'), ('1700 MB/s'), ('3000 MB/s'), ('4100 MB/s'), ('5000 MB/s'), ('6500 MB/s'), ('6900 MB/s')) AS t(val)
WHERE a.name = 'Tốc độ ghi' AND a.category_id = (SELECT id FROM category WHERE name = 'SSD');

-- HDD Capacity
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('500GB'), ('1TB'), ('2TB'), ('4TB'), ('6TB'), ('8TB'), ('10TB'), ('12TB'), ('14TB'), ('16TB'), ('18TB'), ('20TB'), ('22TB'), ('24TB')) AS t(val)
WHERE a.name = 'Dung lượng' AND a.category_id = (SELECT id FROM category WHERE name = 'HDD');

-- HDD RPM
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('5400 RPM'), ('7200 RPM'), ('10000 RPM'), ('15000 RPM')) AS t(val)
WHERE a.name = 'Tốc độ quay' AND a.category_id = (SELECT id FROM category WHERE name = 'HDD');

-- HDD Cache
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('32MB'), ('64MB'), ('128MB'), ('256MB'), ('512MB')) AS t(val)
WHERE a.name = 'Cache' AND a.category_id = (SELECT id FROM category WHERE name = 'HDD');

-- HDD Interface
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('SATA III'), ('SAS')) AS t(val)
WHERE a.name = 'Giao tiếp' AND a.category_id = (SELECT id FROM category WHERE name = 'HDD');

-- VGA GPU Chip
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('RTX 4060'), ('RTX 4060 Ti'), ('RTX 4070'), ('RTX 4070 Ti'), ('RTX 4070 Ti SUPER'), ('RTX 4080 SUPER'), ('RTX 4090'), ('RX 7600'), ('RX 7800 XT'), ('RX 7900 XTX')) AS t(val)
WHERE a.name = 'GPU Chip' AND a.category_id = (SELECT id FROM category WHERE name = 'VGA');

-- VGA VRAM
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('8GB'), ('12GB'), ('16GB'), ('24GB')) AS t(val)
WHERE a.name = 'VRAM' AND a.category_id = (SELECT id FROM category WHERE name = 'VGA');

-- VGA Memory Type
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('GDDR6'), ('GDDR6X')) AS t(val)
WHERE a.name = 'Loại bộ nhớ' AND a.category_id = (SELECT id FROM category WHERE name = 'VGA');

-- VGA Power Requirement
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('550W'), ('600W'), ('650W'), ('700W'), ('750W'), ('850W')) AS t(val)
WHERE a.name = 'Yêu cầu nguồn' AND a.category_id = (SELECT id FROM category WHERE name = 'VGA');

-- PSU Wattage
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('550W'), ('650W'), ('750W'), ('850W'), ('1000W'), ('1200W')) AS t(val)
WHERE a.name = 'Công suất' AND a.category_id = (SELECT id FROM category WHERE name = 'PSU');

-- PSU Efficiency
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('80+ Bronze'), ('80+ Gold'), ('80+ Platinum'), ('80+ Titanium')) AS t(val)
WHERE a.name = 'Hiệu suất' AND a.category_id = (SELECT id FROM category WHERE name = 'PSU');

-- PSU Modular
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('Non-Modular'), ('Semi-Modular'), ('Full Modular')) AS t(val)
WHERE a.name = 'Modular' AND a.category_id = (SELECT id FROM category WHERE name = 'PSU');

-- Case Form Factor Support
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('ATX / Micro-ATX / Mini-ITX'), ('Micro-ATX / Mini-ITX'), ('Mini-ITX')) AS t(val)
WHERE a.name = 'Form Factor hỗ trợ' AND a.category_id = (SELECT id FROM category WHERE name = 'Case');

-- Case Material
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('Thép + Kính cường lực'), ('Thép'), ('Nhôm + Kính cường lực')) AS t(val)
WHERE a.name = 'Chất liệu' AND a.category_id = (SELECT id FROM category WHERE name = 'Case');

-- Case Fan Slots
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('4'), ('6'), ('7'), ('10')) AS t(val)
WHERE a.name = 'Số khe quạt' AND a.category_id = (SELECT id FROM category WHERE name = 'Case');

-- Cooling Type
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('Tản khí (Air Cooler)'), ('Tản nước AIO 240mm'), ('Tản nước AIO 280mm'), ('Tản nước AIO 360mm')) AS t(val)
WHERE a.name = 'Loại tản nhiệt' AND a.category_id = (SELECT id FROM category WHERE name = 'Cooling');

-- Cooling Fan/Radiator Size
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('120mm'), ('140mm'), ('2x 120mm'), ('2x 140mm'), ('3x 120mm')) AS t(val)
WHERE a.name = 'Kích thước quạt/Radiator' AND a.category_id = (SELECT id FROM category WHERE name = 'Cooling');

-- Cooling TDP Support
INSERT INTO attribute_value (attribute_id, value)
SELECT a.id, t.val
FROM attribute a, (VALUES ('150W'), ('200W'), ('250W'), ('300W'), ('350W')) AS t(val)
WHERE a.name = 'TDP hỗ trợ' AND a.category_id = (SELECT id FROM category WHERE name = 'Cooling');

-- =============================================
-- 5. PRODUCTS — moved to V14 (generated from backup data)
-- =============================================
-- All product data (9,867 products, images, attributes, inventory)
-- is now generated from data/transform_backup_data.py and inserted
-- via V14__additional_categories_and_attributes.sql

-- =============================================
-- 6. SUPPLIERS
-- =============================================
INSERT INTO supplier (name, contact_person, phone, email, address) VALUES
    ('Phong Vũ Technology JSC', 'Nguyễn Văn Phong', '02873006060', 'sales@phongvu.vn', '117-119-121 Nguyễn Du, Q.1, TP.HCM'),
    ('An Phát Computer', 'Trần Minh An', '02462920920', 'info@anphatpc.com.vn', '78 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội'),
    ('Hanoicomputer JSC', 'Lê Quốc Hưng', '02432126688', 'sales@hanoicomputer.vn', '131 Lê Thanh Nghị, Q. Hai Bà Trưng, Hà Nội'),
    ('Memoryzone', 'Phạm Đình Tùng', '02838362060', 'sales@memoryzone.com.vn', '271 Nguyễn Trãi, Q.1, TP.HCM');


-- =============================================
-- 8. COUPONS (3 sample discount codes)
-- =============================================
INSERT INTO coupon (code, discount_type, discount_value, min_order_value, max_discount, max_uses, used_count, start_date, end_date) VALUES
    ('WELCOME10', 'PERCENTAGE', 10.00, 1000000, 500000, 1000, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
    ('PCBUILD5', 'PERCENTAGE', 5.00, 5000000, 1000000, 500, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
    ('VIP20', 'FIXED', 2000000.00, 20000000, NULL, 100, 0, '2026-01-01 00:00:00', '2026-06-30 23:59:59');

-- =============================================
-- 9. ACCOUNT CREATION — VIA SCRIPT
-- =============================================
-- NOTE: All test accounts (ADMIN, SALES, WAREHOUSE, CUSTOMER) are created
-- via the bin/seed-data script instead of SQL migration.
--
-- Lý do: Password hash phụ thuộc vào BCryptPasswordEncoder config và .env.
-- Mỗi môi trường (dev/staging/prod) sẽ có hash khác nhau.
-- Hardcode hash trong SQL sẽ dẫn đến không đăng nhập được.
--
-- Xem: bin/seed-data
