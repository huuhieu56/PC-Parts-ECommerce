-- =============================================
-- V11: Comprehensive Seed Data
-- Categories, Brands, Attributes, Products, Inventory, Suppliers, Coupons, Customer
-- =============================================

-- =============================================
-- 1. CATEGORIES (8 root categories)
-- =============================================
INSERT INTO category (name, description, parent_id, level) VALUES
    ('CPU', 'Bộ vi xử lý - Processor', NULL, 0),
    ('Mainboard', 'Bo mạch chủ - Motherboard', NULL, 0),
    ('RAM', 'Bộ nhớ trong - Memory', NULL, 0),
    ('SSD', 'Ổ cứng thể rắn - Solid State Drive', NULL, 0),
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
-- 5. PRODUCTS (40+ products)
-- =============================================

-- === CPU Products ===
INSERT INTO product (name, sku, slug, original_price, selling_price, description, category_id, brand_id, condition, status) VALUES
('Intel Core i5-13600K', 'CPU-I5-13600K', 'intel-core-i5-13600k', 8190000, 6990000, 'Bộ vi xử lý Intel Core i5-13600K thế hệ 13, 14 nhân (6P+8E), 20 luồng, xung boost 5.1 GHz. Hiệu năng mạnh mẽ cho gaming và đa nhiệm. Socket LGA 1700, hỗ trợ DDR4/DDR5.', (SELECT id FROM category WHERE name = 'CPU'), (SELECT id FROM brand WHERE name = 'Intel'), 'NEW', 'ACTIVE'),
('Intel Core i7-13700K', 'CPU-I7-13700K', 'intel-core-i7-13700k', 11990000, 10490000, 'Bộ vi xử lý Intel Core i7-13700K thế hệ 13, 16 nhân (8P+8E), 24 luồng, xung boost 5.4 GHz. Lựa chọn hoàn hảo cho gaming cao cấp và content creation. Socket LGA 1700.', (SELECT id FROM category WHERE name = 'CPU'), (SELECT id FROM brand WHERE name = 'Intel'), 'NEW', 'ACTIVE'),
('Intel Core i9-13900K', 'CPU-I9-13900K', 'intel-core-i9-13900k', 15990000, 14490000, 'Bộ vi xử lý Intel Core i9-13900K thế hệ 13, 24 nhân (8P+16E), 32 luồng, xung boost 5.8 GHz. Flagship hiệu năng cao nhất cho gaming và workstation. Socket LGA 1700, TDP 253W.', (SELECT id FROM category WHERE name = 'CPU'), (SELECT id FROM brand WHERE name = 'Intel'), 'NEW', 'ACTIVE'),
('AMD Ryzen 5 5600X', 'CPU-R5-5600X', 'amd-ryzen-5-5600x', 5490000, 3990000, 'Bộ vi xử lý AMD Ryzen 5 5600X, 6 nhân 12 luồng, xung boost 4.6 GHz. Hiệu năng gaming xuất sắc với mức giá hợp lý. Socket AM4, TDP 65W.', (SELECT id FROM category WHERE name = 'CPU'), (SELECT id FROM brand WHERE name = 'AMD'), 'NEW', 'ACTIVE'),
('AMD Ryzen 7 5800X', 'CPU-R7-5800X', 'amd-ryzen-7-5800x', 8990000, 6490000, 'Bộ vi xử lý AMD Ryzen 7 5800X, 8 nhân 16 luồng, xung boost 4.7 GHz. Mạnh mẽ cho cả gaming và công việc sáng tạo nội dung. Socket AM4, TDP 105W.', (SELECT id FROM category WHERE name = 'CPU'), (SELECT id FROM brand WHERE name = 'AMD'), 'NEW', 'ACTIVE'),
('AMD Ryzen 9 7950X', 'CPU-R9-7950X', 'amd-ryzen-9-7950x', 18990000, 16490000, 'Bộ vi xử lý AMD Ryzen 9 7950X, 16 nhân 32 luồng, xung boost 5.7 GHz. Nền tảng AM5 mới nhất, hỗ trợ DDR5 và PCIe Gen 5. TDP 170W.', (SELECT id FROM category WHERE name = 'CPU'), (SELECT id FROM brand WHERE name = 'AMD'), 'NEW', 'ACTIVE'),
('Intel Core i5-12400F', 'CPU-I5-12400F', 'intel-core-i5-12400f', 4690000, 3490000, 'Bộ vi xử lý Intel Core i5-12400F thế hệ 12, 6 nhân 12 luồng, xung boost 4.4 GHz. Lựa chọn tiết kiệm cho gaming 1080p. Không có GPU tích hợp. Socket LGA 1700, TDP 65W.', (SELECT id FROM category WHERE name = 'CPU'), (SELECT id FROM brand WHERE name = 'Intel'), 'NEW', 'ACTIVE');

-- === Mainboard Products ===
INSERT INTO product (name, sku, slug, original_price, selling_price, description, category_id, brand_id, condition, status) VALUES
('ASUS ROG STRIX Z790-A GAMING WIFI', 'MB-ASUS-Z790-A', 'asus-rog-strix-z790-a-gaming-wifi', 10990000, 8990000, 'Bo mạch chủ ASUS ROG STRIX Z790-A GAMING WIFI, chipset Z790, socket LGA 1700. Hỗ trợ DDR5, PCIe Gen 5, WiFi 6E. Form Factor ATX, 4 khe RAM DDR5.', (SELECT id FROM category WHERE name = 'Mainboard'), (SELECT id FROM brand WHERE name = 'ASUS'), 'NEW', 'ACTIVE'),
('GIGABYTE B760M AORUS ELITE AX', 'MB-GIG-B760M-AE', 'gigabyte-b760m-aorus-elite-ax', 4990000, 4290000, 'Bo mạch chủ GIGABYTE B760M AORUS ELITE AX, chipset B760, socket LGA 1700. Hỗ trợ DDR5, WiFi 6E. Form Factor Micro-ATX, 2 khe M.2, 4 khe RAM.', (SELECT id FROM category WHERE name = 'Mainboard'), (SELECT id FROM brand WHERE name = 'GIGABYTE'), 'NEW', 'ACTIVE'),
('MSI MAG B550 TOMAHAWK', 'MB-MSI-B550-TH', 'msi-mag-b550-tomahawk', 4490000, 3490000, 'Bo mạch chủ MSI MAG B550 TOMAHAWK, chipset B550, socket AM4. Hỗ trợ DDR4, PCIe Gen 4. Form Factor ATX, 4 khe RAM DDR4. Tản nhiệt VRM chất lượng cao.', (SELECT id FROM category WHERE name = 'Mainboard'), (SELECT id FROM brand WHERE name = 'MSI'), 'NEW', 'ACTIVE'),
('ASUS TUF GAMING B650-PLUS WIFI', 'MB-ASUS-B650-TUF', 'asus-tuf-gaming-b650-plus-wifi', 6290000, 5490000, 'Bo mạch chủ ASUS TUF GAMING B650-PLUS WIFI, chipset B650, socket AM5. Hỗ trợ DDR5, PCIe Gen 5, WiFi 6. Form Factor ATX, 4 khe RAM DDR5.', (SELECT id FROM category WHERE name = 'Mainboard'), (SELECT id FROM brand WHERE name = 'ASUS'), 'NEW', 'ACTIVE'),
('GIGABYTE B650M DS3H', 'MB-GIG-B650M-DS3H', 'gigabyte-b650m-ds3h', 3990000, 3290000, 'Bo mạch chủ GIGABYTE B650M DS3H, chipset B650, socket AM5. Hỗ trợ DDR5, PCIe Gen 4. Form Factor Micro-ATX, giá hợp lý cho nền tảng AM5.', (SELECT id FROM category WHERE name = 'Mainboard'), (SELECT id FROM brand WHERE name = 'GIGABYTE'), 'NEW', 'ACTIVE');

-- === RAM Products ===
INSERT INTO product (name, sku, slug, original_price, selling_price, description, category_id, brand_id, condition, status) VALUES
('CORSAIR Vengeance DDR5 32GB (2x16GB) 5600MHz', 'RAM-COR-V-DDR5-32', 'corsair-vengeance-ddr5-32gb-5600mhz', 3490000, 2890000, 'RAM CORSAIR Vengeance DDR5 32GB (2x16GB) Bus 5600MHz, CL36. Hỗ trợ Intel XMP 3.0. Thiết kế tản nhiệt nhôm mỏng, tương thích nhiều case.', (SELECT id FROM category WHERE name = 'RAM'), (SELECT id FROM brand WHERE name = 'CORSAIR'), 'NEW', 'ACTIVE'),
('Kingston FURY Beast DDR4 16GB (2x8GB) 3200MHz', 'RAM-KIN-FB-DDR4-16', 'kingston-fury-beast-ddr4-16gb-3200mhz', 1290000, 990000, 'RAM Kingston FURY Beast DDR4 16GB (2x8GB) Bus 3200MHz, CL16. Plug N Play với XMP tự động. Tản nhiệt nhôm cao cấp.', (SELECT id FROM category WHERE name = 'RAM'), (SELECT id FROM brand WHERE name = 'Kingston'), 'NEW', 'ACTIVE'),
('G.Skill Trident Z5 RGB DDR5 32GB (2x16GB) 6000MHz', 'RAM-GS-TZ5-DDR5-32', 'gskill-trident-z5-rgb-ddr5-32gb-6000mhz', 4990000, 3990000, 'RAM G.Skill Trident Z5 RGB DDR5 32GB (2x16GB) Bus 6000MHz, CL30. LED RGB 2 mặt rực rỡ. Hiệu năng DDR5 cao cấp cho gaming và workstation.', (SELECT id FROM category WHERE name = 'RAM'), (SELECT id FROM brand WHERE name = 'G.Skill'), 'NEW', 'ACTIVE'),
('CORSAIR Vengeance LPX DDR4 32GB (2x16GB) 3600MHz', 'RAM-COR-LPX-DDR4-32', 'corsair-vengeance-lpx-ddr4-32gb-3600mhz', 2890000, 2290000, 'RAM CORSAIR Vengeance LPX DDR4 32GB (2x16GB) Bus 3600MHz, CL18. Tản nhiệt nhôm mỏng, tương thích cao. Hỗ trợ XMP 2.0.', (SELECT id FROM category WHERE name = 'RAM'), (SELECT id FROM brand WHERE name = 'CORSAIR'), 'NEW', 'ACTIVE'),
('Kingston FURY Beast DDR5 32GB (2x16GB) 5200MHz', 'RAM-KIN-FB-DDR5-32', 'kingston-fury-beast-ddr5-32gb-5200mhz', 2990000, 2490000, 'RAM Kingston FURY Beast DDR5 32GB (2x16GB) Bus 5200MHz, CL40. Thiết kế tản nhiệt mới cho DDR5. Hỗ trợ Intel XMP 3.0 và AMD EXPO.', (SELECT id FROM category WHERE name = 'RAM'), (SELECT id FROM brand WHERE name = 'Kingston'), 'NEW', 'ACTIVE');

-- === SSD Products ===
INSERT INTO product (name, sku, slug, original_price, selling_price, description, category_id, brand_id, condition, status) VALUES
('Samsung 990 PRO 1TB NVMe PCIe Gen 4', 'SSD-SAM-990PRO-1TB', 'samsung-990-pro-1tb-nvme', 3790000, 3290000, 'SSD Samsung 990 PRO 1TB M.2 NVMe PCIe Gen 4. Tốc độ đọc 7.450 MB/s, ghi 6.900 MB/s. Controller Samsung Pascal, V-NAND TLC. Bảo hành 5 năm.', (SELECT id FROM category WHERE name = 'SSD'), (SELECT id FROM brand WHERE name = 'Samsung'), 'NEW', 'ACTIVE'),
('WD Black SN850X 1TB NVMe PCIe Gen 4', 'SSD-WD-SN850X-1TB', 'wd-black-sn850x-1tb-nvme', 3490000, 2990000, 'SSD WD Black SN850X 1TB M.2 NVMe PCIe Gen 4. Tốc độ đọc 7.300 MB/s, ghi 6.300 MB/s. Tối ưu cho gaming với Game Mode 2.0.', (SELECT id FROM category WHERE name = 'SSD'), (SELECT id FROM brand WHERE name = 'Western Digital'), 'NEW', 'ACTIVE'),
('Kingston NV2 1TB NVMe PCIe Gen 4', 'SSD-KIN-NV2-1TB', 'kingston-nv2-1tb-nvme', 1990000, 1490000, 'SSD Kingston NV2 1TB M.2 NVMe PCIe Gen 4x4. Tốc độ đọc 3.500 MB/s, ghi 2.100 MB/s. Giá tốt cho nâng cấp từ SATA sang NVMe.', (SELECT id FROM category WHERE name = 'SSD'), (SELECT id FROM brand WHERE name = 'Kingston'), 'NEW', 'ACTIVE'),
('Samsung 870 EVO 500GB SATA III', 'SSD-SAM-870EVO-500', 'samsung-870-evo-500gb-sata', 1890000, 1490000, 'SSD Samsung 870 EVO 500GB SATA III 2.5 inch. Tốc độ đọc 560 MB/s, ghi 530 MB/s. V-NAND TLC, độ bền lên đến 300 TBW. Bảo hành 5 năm.', (SELECT id FROM category WHERE name = 'SSD'), (SELECT id FROM brand WHERE name = 'Samsung'), 'NEW', 'ACTIVE'),
('Samsung 990 PRO 2TB NVMe PCIe Gen 4', 'SSD-SAM-990PRO-2TB', 'samsung-990-pro-2tb-nvme', 6490000, 5490000, 'SSD Samsung 990 PRO 2TB M.2 NVMe PCIe Gen 4. Tốc độ đọc 7.450 MB/s, ghi 6.900 MB/s. Dung lượng lớn cho game thủ và nhà sáng tạo.', (SELECT id FROM category WHERE name = 'SSD'), (SELECT id FROM brand WHERE name = 'Samsung'), 'NEW', 'ACTIVE');

-- === VGA Products ===
INSERT INTO product (name, sku, slug, original_price, selling_price, description, category_id, brand_id, condition, status) VALUES
('MSI GeForce RTX 4060 VENTUS 2X BLACK 8G OC', 'VGA-MSI-4060-V2X', 'msi-geforce-rtx-4060-ventus-2x-black-8g-oc', 9490000, 8490000, 'Card đồ hoạ MSI GeForce RTX 4060 VENTUS 2X BLACK 8G OC. GPU AD107, 8GB GDDR6, Bus 128-bit. Hỗ trợ DLSS 3, Ray Tracing. Yêu cầu nguồn 550W.', (SELECT id FROM category WHERE name = 'VGA'), (SELECT id FROM brand WHERE name = 'MSI'), 'NEW', 'ACTIVE'),
('ASUS TUF Gaming GeForce RTX 4070 Ti OC 12GB', 'VGA-ASUS-4070TI-TUF', 'asus-tuf-gaming-rtx-4070-ti-oc-12gb', 22990000, 19990000, 'Card đồ hoạ ASUS TUF Gaming RTX 4070 Ti OC 12GB GDDR6X. GPU AD104, Bus 192-bit. Tản nhiệt TUF 3 fan, chất lượng quân sự. Yêu cầu nguồn 700W.', (SELECT id FROM category WHERE name = 'VGA'), (SELECT id FROM brand WHERE name = 'ASUS'), 'NEW', 'ACTIVE'),
('GIGABYTE GeForce RTX 4080 SUPER GAMING OC 16G', 'VGA-GIG-4080S-GOC', 'gigabyte-rtx-4080-super-gaming-oc-16g', 32990000, 29990000, 'Card đồ hoạ GIGABYTE RTX 4080 SUPER GAMING OC 16GB GDDR6X. GPU AD103, Bus 256-bit. WINDFORCE cooling 3 fan, RGB Fusion. Yêu cầu nguồn 750W.', (SELECT id FROM category WHERE name = 'VGA'), (SELECT id FROM brand WHERE name = 'GIGABYTE'), 'NEW', 'ACTIVE'),
('MSI GeForce RTX 4070 VENTUS 3X 12G OC', 'VGA-MSI-4070-V3X', 'msi-rtx-4070-ventus-3x-12g-oc', 16990000, 14990000, 'Card đồ hoạ MSI RTX 4070 VENTUS 3X 12G OC. GPU AD104, 12GB GDDR6X, Bus 192-bit. Tản nhiệt 3 quạt TORX Fan 4.0. Yêu cầu nguồn 650W.', (SELECT id FROM category WHERE name = 'VGA'), (SELECT id FROM brand WHERE name = 'MSI'), 'NEW', 'ACTIVE'),
('ASUS Dual GeForce RTX 4060 Ti OC 8GB', 'VGA-ASUS-4060TI-DUAL', 'asus-dual-rtx-4060-ti-oc-8gb', 12990000, 11490000, 'Card đồ hoạ ASUS Dual RTX 4060 Ti OC 8GB GDDR6. GPU AD106, Bus 128-bit. Tản nhiệt Axial-tech 2 fan. Yêu cầu nguồn 550W.', (SELECT id FROM category WHERE name = 'VGA'), (SELECT id FROM brand WHERE name = 'ASUS'), 'NEW', 'ACTIVE');

-- === PSU Products ===
INSERT INTO product (name, sku, slug, original_price, selling_price, description, category_id, brand_id, condition, status) VALUES
('CORSAIR RM850x 850W 80+ Gold Full Modular', 'PSU-COR-RM850X', 'corsair-rm850x-850w-80plus-gold', 3490000, 2990000, 'Nguồn CORSAIR RM850x 850W, 80+ Gold, Full Modular. Quạt 135mm Zero RPM Mode. Cáp dẹt dễ đi dây. Bảo hành 10 năm.', (SELECT id FROM category WHERE name = 'PSU'), (SELECT id FROM brand WHERE name = 'CORSAIR'), 'NEW', 'ACTIVE'),
('Seasonic Focus GX-750 750W 80+ Gold Full Modular', 'PSU-SEA-GX750', 'seasonic-focus-gx-750-80plus-gold', 2990000, 2490000, 'Nguồn Seasonic Focus GX-750 750W, 80+ Gold, Full Modular. Quạt Fluid Dynamic Bearing 120mm. Hybrid Fan Control. Bảo hành 10 năm.', (SELECT id FROM category WHERE name = 'PSU'), (SELECT id FROM brand WHERE name = 'Seasonic'), 'NEW', 'ACTIVE'),
('Cooler Master V850 Gold V2 850W Full Modular', 'PSU-CM-V850-G2', 'cooler-master-v850-gold-v2-850w', 3290000, 2690000, 'Nguồn Cooler Master V850 Gold V2 850W, 80+ Gold, Full Modular. Quạt 135mm FDB, chế độ Semi-Fanless. Bảo hành 10 năm.', (SELECT id FROM category WHERE name = 'PSU'), (SELECT id FROM brand WHERE name = 'Cooler Master'), 'NEW', 'ACTIVE'),
('CORSAIR RM650 650W 80+ Gold Full Modular', 'PSU-COR-RM650', 'corsair-rm650-650w-80plus-gold', 2490000, 1990000, 'Nguồn CORSAIR RM650 650W, 80+ Gold, Full Modular. Quạt 120mm Zero RPM Mode. Lý tưởng cho hệ thống mid-range. Bảo hành 10 năm.', (SELECT id FROM category WHERE name = 'PSU'), (SELECT id FROM brand WHERE name = 'CORSAIR'), 'NEW', 'ACTIVE');

-- === Case Products ===
INSERT INTO product (name, sku, slug, original_price, selling_price, description, category_id, brand_id, condition, status) VALUES
('NZXT H5 Flow Black', 'CASE-NZXT-H5-BK', 'nzxt-h5-flow-black', 2490000, 1990000, 'Vỏ case NZXT H5 Flow màu đen. Mid-Tower ATX, lưới mặt trước thông thoáng. Kính cường lực hông, 2 quạt 120mm đi kèm. Hỗ trợ radiator 360mm.', (SELECT id FROM category WHERE name = 'Case'), (SELECT id FROM brand WHERE name = 'NZXT'), 'NEW', 'ACTIVE'),
('CORSAIR 4000D Airflow White', 'CASE-COR-4000D-WH', 'corsair-4000d-airflow-white', 2890000, 2290000, 'Vỏ case CORSAIR 4000D Airflow màu trắng. Mid-Tower ATX, lưới mặt trước airflow cao. Kính cường lực hông, 2 quạt 120mm. Hỗ trợ radiator 360mm.', (SELECT id FROM category WHERE name = 'Case'), (SELECT id FROM brand WHERE name = 'CORSAIR'), 'NEW', 'ACTIVE'),
('Cooler Master MasterBox TD500 Mesh V2', 'CASE-CM-TD500-V2', 'cooler-master-masterbox-td500-mesh-v2', 2290000, 1790000, 'Vỏ case Cooler Master MasterBox TD500 Mesh V2. Mid-Tower ATX, thiết kế mesh polygonal. 3 quạt ARGB 120mm đi kèm. Kính cường lực hông.', (SELECT id FROM category WHERE name = 'Case'), (SELECT id FROM brand WHERE name = 'Cooler Master'), 'NEW', 'ACTIVE'),
('NZXT H9 Flow White', 'CASE-NZXT-H9-WH', 'nzxt-h9-flow-white', 4290000, 3790000, 'Vỏ case NZXT H9 Flow màu trắng. Full-Tower ATX, thiết kế dual-chamber. Kính cường lực 3 mặt, 4 quạt 120mm đi kèm. Hỗ trợ radiator 360mm top+side.', (SELECT id FROM category WHERE name = 'Case'), (SELECT id FROM brand WHERE name = 'NZXT'), 'NEW', 'ACTIVE');

-- === Cooling Products ===
INSERT INTO product (name, sku, slug, original_price, selling_price, description, category_id, brand_id, condition, status) VALUES
('CORSAIR iCUE H150i ELITE CAPELLIX XT 360mm', 'COOL-COR-H150I-XT', 'corsair-icue-h150i-elite-capellix-xt-360mm', 5490000, 4490000, 'Tản nước AIO CORSAIR iCUE H150i ELITE CAPELLIX XT 360mm. Bơm đồng hiệu năng cao, 3 quạt AF120 RGB ELITE. Hỗ trợ LGA 1700/AM5. TDP tản tới 350W.', (SELECT id FROM category WHERE name = 'Cooling'), (SELECT id FROM brand WHERE name = 'CORSAIR'), 'NEW', 'ACTIVE'),
('Noctua NH-D15 chromax.black', 'COOL-NOC-NHD15-BK', 'noctua-nh-d15-chromax-black', 3290000, 2890000, 'Tản khí Noctua NH-D15 chromax.black. Dual-tower, 2 quạt NF-A15 140mm. TDP tản tới 250W. Yên tĩnh nhất phân khúc. Hỗ trợ LGA 1700/AM5.', (SELECT id FROM category WHERE name = 'Cooling'), (SELECT id FROM brand WHERE name = 'Noctua'), 'NEW', 'ACTIVE'),
('Cooler Master Hyper 212 Spectrum V3', 'COOL-CM-HYPER212-V3', 'cooler-master-hyper-212-spectrum-v3', 990000, 790000, 'Tản khí Cooler Master Hyper 212 Spectrum V3. Single-tower, quạt 120mm ARGB. 4 ống dẫn nhiệt đồng. TDP tản tới 150W. Hỗ trợ LGA 1700/AM5.', (SELECT id FROM category WHERE name = 'Cooling'), (SELECT id FROM brand WHERE name = 'Cooler Master'), 'NEW', 'ACTIVE'),
('CORSAIR iCUE H100i RGB ELITE 240mm', 'COOL-COR-H100I-ELITE', 'corsair-icue-h100i-rgb-elite-240mm', 3490000, 2790000, 'Tản nước AIO CORSAIR iCUE H100i RGB ELITE 240mm. Bơm đồng hiệu năng cao, 2 quạt AF120 RGB ELITE. Hỗ trợ LGA 1700/AM5. TDP tản tới 300W.', (SELECT id FROM category WHERE name = 'Cooling'), (SELECT id FROM brand WHERE name = 'CORSAIR'), 'NEW', 'ACTIVE'),
('be quiet! Dark Rock Pro 5', 'COOL-BQ-DRP5', 'be-quiet-dark-rock-pro-5', 2690000, 2290000, 'Tản khí be quiet! Dark Rock Pro 5. Dual-tower, 2 quạt Silent Wings 4 (1x 120mm + 1x 135mm). TDP tản tới 270W. Gần như không tiếng ồn. Hỗ trợ LGA 1700/AM5.', (SELECT id FROM category WHERE name = 'Cooling'), (SELECT id FROM brand WHERE name = 'be quiet!'), 'NEW', 'ACTIVE');

-- =============================================
-- 6. SUPPLIERS
-- =============================================
INSERT INTO supplier (name, contact_person, phone, email, address) VALUES
    ('Phong Vũ Technology JSC', 'Nguyễn Văn Phong', '02873006060', 'sales@phongvu.vn', '117-119-121 Nguyễn Du, Q.1, TP.HCM'),
    ('An Phát Computer', 'Trần Minh An', '02462920920', 'info@anphatpc.com.vn', '78 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội'),
    ('Hanoicomputer JSC', 'Lê Quốc Hưng', '02432126688', 'sales@hanoicomputer.vn', '131 Lê Thanh Nghị, Q. Hai Bà Trưng, Hà Nội'),
    ('Memoryzone', 'Phạm Đình Tùng', '02838362060', 'sales@memoryzone.com.vn', '271 Nguyễn Trãi, Q.1, TP.HCM');

-- =============================================
-- 7. INVENTORY (all products with stock)
-- =============================================
INSERT INTO inventory (product_id, quantity, low_stock_threshold, supplier_id)
SELECT p.id,
    CASE
        WHEN p.selling_price > 20000000 THEN 30
        WHEN p.selling_price > 10000000 THEN 50
        WHEN p.selling_price > 5000000 THEN 80
        ELSE 120
    END,
    10,
    (SELECT id FROM supplier WHERE name = 'Phong Vũ Technology JSC')
FROM product p WHERE p.status = 'ACTIVE';

-- =============================================
-- 8. COUPONS (3 sample discount codes)
-- =============================================
INSERT INTO coupon (code, discount_type, discount_value, min_order_value, max_discount, max_uses, used_count, start_date, end_date) VALUES
    ('WELCOME10', 'PERCENTAGE', 10.00, 1000000, 500000, 1000, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
    ('PCBUILD5', 'PERCENTAGE', 5.00, 5000000, 1000000, 500, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
    ('VIP20', 'FIXED', 2000000.00, 20000000, NULL, 100, 0, '2026-01-01 00:00:00', '2026-06-30 23:59:59');

-- =============================================
-- 9. SAMPLE CUSTOMER ACCOUNT
-- =============================================
-- Password: Customer@123
INSERT INTO account (email, password_hash, is_active, is_verified, role_id)
SELECT 'customer@test.com', '$2a$12$LJ3m4yst.VBJvGQHvke/PeXHBNMj6JfOLSpiPPuROBb0BNfMbx6Lq', true, true, r.id
FROM role r WHERE r.name = 'CUSTOMER';

INSERT INTO user_profile (account_id, full_name, phone)
SELECT a.id, 'Nguyễn Văn Khách', '0909123456'
FROM account a WHERE a.email = 'customer@test.com';

-- Address for customer
INSERT INTO address (user_id, label, receiver_name, receiver_phone, province, district, ward, street, is_default)
SELECT up.id, 'Nhà', 'Nguyễn Văn Khách', '0909123456', 'TP. Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', '123 Nguyễn Huệ', true
FROM user_profile up
JOIN account a ON up.account_id = a.id
WHERE a.email = 'customer@test.com';

-- =============================================
-- 10. SAMPLE SALES STAFF ACCOUNT
-- =============================================
-- Password: Sales@123
INSERT INTO account (email, password_hash, is_active, is_verified, role_id)
SELECT 'sales@pcparts.vn', '$2a$12$LJ3m4yst.VBJvGQHvke/PeXHBNMj6JfOLSpiPPuROBb0BNfMbx6Lq', true, true, r.id
FROM role r WHERE r.name = 'SALES';

INSERT INTO user_profile (account_id, full_name, phone)
SELECT a.id, 'Trần Thị Bán Hàng', '0909987654'
FROM account a WHERE a.email = 'sales@pcparts.vn';

-- =============================================
-- 11. SAMPLE WAREHOUSE STAFF ACCOUNT
-- =============================================
-- Password: Warehouse@123
INSERT INTO account (email, password_hash, is_active, is_verified, role_id)
SELECT 'warehouse@pcparts.vn', '$2a$12$LJ3m4yst.VBJvGQHvke/PeXHBNMj6JfOLSpiPPuROBb0BNfMbx6Lq', true, true, r.id
FROM role r WHERE r.name = 'WAREHOUSE';

INSERT INTO user_profile (account_id, full_name, phone)
SELECT a.id, 'Lê Văn Kho', '0909654321'
FROM account a WHERE a.email = 'warehouse@pcparts.vn';
