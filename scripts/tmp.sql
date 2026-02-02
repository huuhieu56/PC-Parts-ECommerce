-- ============================================
-- Generated product data
-- Generated on 2025-11-17T22:08:11
-- ============================================
BEGIN;

-- ===== cpu (CPU) =====
INSERT INTO products (name, description, price, quantity, low_stock_threshold, category_id, specifications, attributes) SELECT 'AMD Ryzen 7 9800X3D', '8C/4.7GHz Zen 5', 11288000.00, 20, 5, (SELECT id FROM categories WHERE name = 'CPU'), '{"name":"AMD Ryzen 7 9800X3D","price":451.5,"core_count":8,"core_clock":4.7,"boost_clock":5.2,"microarchitecture":"Zen 5","tdp":120,"graphics":"Radeon","brand":"AMD","source_file":"cpu.jsonl","source_category":"CPU"}'::jsonb, '{"manufacturer":"AMD","series":"AMD Ryzen 7","generation":"AMD Zen 5","socket":"AM5"}'::jsonb WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = 'AMD Ryzen 7 9800X3D' AND p.category_id = (SELECT id FROM categories WHERE name = 'CPU'));

COMMIT;
