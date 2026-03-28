-- V12: Seed product_attribute data — link products to their attribute values
-- This enables dynamic category-specific filtering in the product listing

-- ================================================================
-- CPU products (IDs 1-7)
-- ================================================================

-- 1: Intel Core i5-13600K — LGA 1700, 14 cores, 20 threads, 3.5 GHz base, 5.1 GHz boost, 125W TDP
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(1, 1, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 1 AND av.value = 'LGA 1700')),
(1, 2, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 2 AND av.value = '14')),
(1, 3, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 3 AND av.value = '20')),
(1, 4, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 4 AND av.value = '3.5 GHz')),
(1, 5, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 5 AND av.value = '5.1 GHz')),
(1, 6, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 6 AND av.value = '125W'));

-- 2: Intel Core i7-13700K — LGA 1700, 16 cores, 24 threads, 3.4 GHz base, 5.4 GHz boost, 125W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(2, 1, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 1 AND av.value = 'LGA 1700')),
(2, 2, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 2 AND av.value = '16')),
(2, 3, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 3 AND av.value = '24')),
(2, 4, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 4 AND av.value = '3.4 GHz')),
(2, 5, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 5 AND av.value = '5.4 GHz')),
(2, 6, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 6 AND av.value = '125W'));

-- 3: Intel Core i9-13900K — LGA 1700, 24 cores, 32 threads, 3.0 GHz base, 5.8 GHz boost, 253W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(3, 1, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 1 AND av.value = 'LGA 1700')),
(3, 2, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 2 AND av.value = '24')),
(3, 3, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 3 AND av.value = '32')),
(3, 4, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 4 AND av.value = '3.0 GHz')),
(3, 5, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 5 AND av.value = '5.8 GHz')),
(3, 6, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 6 AND av.value = '253W'));

-- 4: AMD Ryzen 5 5600X — AM4, 6 cores, 12 threads, 3.6 GHz base, 4.5 GHz boost, 65W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(4, 1, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 1 AND av.value = 'AM4')),
(4, 2, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 2 AND av.value = '6')),
(4, 3, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 3 AND av.value = '12')),
(4, 4, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 4 AND av.value = '3.6 GHz')),
(4, 5, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 5 AND av.value = '4.5 GHz')),
(4, 6, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 6 AND av.value = '65W'));

-- 5: AMD Ryzen 7 5800X — AM4, 8 cores, 16 threads, 3.8 GHz base, 4.7 GHz boost, 105W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(5, 1, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 1 AND av.value = 'AM4')),
(5, 2, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 2 AND av.value = '8')),
(5, 3, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 3 AND av.value = '16')),
(5, 4, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 4 AND av.value = '3.8 GHz')),
(5, 5, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 5 AND av.value = '4.7 GHz')),
(5, 6, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 6 AND av.value = '105W'));

-- 6: AMD Ryzen 9 7950X — AM5, 16 cores, 32 threads, 4.2 GHz base, 5.6 GHz boost, 170W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(6, 1, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 1 AND av.value = 'AM5')),
(6, 2, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 2 AND av.value = '16')),
(6, 3, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 3 AND av.value = '32')),
(6, 4, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 4 AND av.value = '4.2 GHz')),
(6, 5, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 5 AND av.value = '5.6 GHz')),
(6, 6, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 6 AND av.value = '170W'));

-- 7: Intel Core i5-12400F — LGA 1700, 6 cores, 12 threads, 2.5 GHz base, 4.5 GHz boost, 65W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(7, 1, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 1 AND av.value = 'LGA 1700')),
(7, 2, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 2 AND av.value = '6')),
(7, 3, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 3 AND av.value = '12')),
(7, 4, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 4 AND av.value = '2.5 GHz')),
(7, 5, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 5 AND av.value = '4.5 GHz')),
(7, 6, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 6 AND av.value = '65W'));

-- ================================================================
-- Mainboard products (IDs 8-12)
-- Attrs: 7=Socket, 8=Chipset, 9=Form Factor, 10=Khe RAM, 11=Loại RAM
-- ================================================================

-- 8: ASUS ROG STRIX Z790-A — LGA 1700, Z790, ATX, 4 slots, DDR5
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(8, 7, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 7 AND av.value = 'LGA 1700')),
(8, 8, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 8 AND av.value = 'Z790')),
(8, 9, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 9 AND av.value = 'ATX')),
(8, 10, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 10 AND av.value = '4')),
(8, 11, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 11 AND av.value = 'DDR5'));

-- 9: GIGABYTE B760M AORUS ELITE AX — LGA 1700, B760, Micro-ATX, 2 slots, DDR5
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(9, 7, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 7 AND av.value = 'LGA 1700')),
(9, 8, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 8 AND av.value = 'B760')),
(9, 9, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 9 AND av.value = 'Micro-ATX')),
(9, 10, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 10 AND av.value = '2')),
(9, 11, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 11 AND av.value = 'DDR5'));

-- 10: MSI MAG B550 TOMAHAWK — AM4, B550, ATX, 4 slots, DDR4
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(10, 7, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 7 AND av.value = 'AM4')),
(10, 8, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 8 AND av.value = 'B550')),
(10, 9, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 9 AND av.value = 'ATX')),
(10, 10, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 10 AND av.value = '4')),
(10, 11, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 11 AND av.value = 'DDR4'));

-- 11: ASUS TUF GAMING B650-PLUS WIFI — AM5, B650, ATX, 4 slots, DDR5
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(11, 7, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 7 AND av.value = 'AM5')),
(11, 8, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 8 AND av.value = 'B650')),
(11, 9, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 9 AND av.value = 'ATX')),
(11, 10, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 10 AND av.value = '4')),
(11, 11, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 11 AND av.value = 'DDR5'));

-- 12: GIGABYTE B650M DS3H — AM5, B650, Micro-ATX, 2 slots, DDR5
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(12, 7, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 7 AND av.value = 'AM5')),
(12, 8, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 8 AND av.value = 'B650')),
(12, 9, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 9 AND av.value = 'Micro-ATX')),
(12, 10, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 10 AND av.value = '2')),
(12, 11, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 11 AND av.value = 'DDR5'));

-- ================================================================
-- RAM products (IDs 13-17)
-- Attrs: 12=Loại RAM, 13=Dung lượng, 14=Bus Speed, 15=CAS Latency
-- ================================================================

-- 13: CORSAIR Vengeance DDR5 32GB 5600MHz — DDR5, 32GB (2x16GB), 5600 MHz, CL36
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(13, 12, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 12 AND av.value = 'DDR5')),
(13, 13, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 13 AND av.value = '32GB (2x16GB)')),
(13, 14, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 14 AND av.value = '5600 MHz')),
(13, 15, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 15 AND av.value = 'CL36'));

-- 14: Kingston FURY Beast DDR4 16GB 3200MHz — DDR4, 16GB (2x8GB), 3200 MHz, CL16
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(14, 12, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 12 AND av.value = 'DDR4')),
(14, 13, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 13 AND av.value = '16GB (2x8GB)')),
(14, 14, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 14 AND av.value = '3200 MHz')),
(14, 15, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 15 AND av.value = 'CL16'));

-- 15: G.Skill Trident Z5 RGB DDR5 32GB 6000MHz — DDR5, 32GB (2x16GB), 6000 MHz, CL36
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(15, 12, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 12 AND av.value = 'DDR5')),
(15, 13, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 13 AND av.value = '32GB (2x16GB)')),
(15, 14, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 14 AND av.value = '6000 MHz')),
(15, 15, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 15 AND av.value = 'CL36'));

-- 16: CORSAIR Vengeance LPX DDR4 32GB 3600MHz — DDR4, 32GB (2x16GB), 3600 MHz, CL18
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(16, 12, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 12 AND av.value = 'DDR4')),
(16, 13, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 13 AND av.value = '32GB (2x16GB)')),
(16, 14, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 14 AND av.value = '3600 MHz')),
(16, 15, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 15 AND av.value = 'CL18'));

-- 17: Kingston FURY Beast DDR5 32GB 5200MHz — DDR5, 32GB (2x16GB), 5200 MHz, CL40
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(17, 12, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 12 AND av.value = 'DDR5')),
(17, 13, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 13 AND av.value = '32GB (2x16GB)')),
(17, 14, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 14 AND av.value = '5200 MHz')),
(17, 15, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 15 AND av.value = 'CL40'));

-- ================================================================
-- SSD products (IDs 18-22)
-- Attrs: 16=Giao tiếp, 17=Dung lượng, 18=Tốc độ đọc, 19=Tốc độ ghi
-- ================================================================

-- 18: Samsung 990 PRO 1TB NVMe Gen 4 — NVMe Gen 4, 1TB, 7450 MB/s read, 6900 MB/s write
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(18, 16, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 16 AND av.value = 'NVMe PCIe Gen 4')),
(18, 17, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 17 AND av.value = '1TB')),
(18, 18, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 18 AND av.value = '7450 MB/s')),
(18, 19, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 19 AND av.value = '6900 MB/s'));

-- 19: WD Black SN850X 1TB — NVMe Gen 4, 1TB, 7000 MB/s read, 5000 MB/s write
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(19, 16, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 16 AND av.value = 'NVMe PCIe Gen 4')),
(19, 17, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 17 AND av.value = '1TB')),
(19, 18, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 18 AND av.value = '7000 MB/s')),
(19, 19, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 19 AND av.value = '5000 MB/s'));

-- 20: Kingston NV2 1TB — NVMe Gen 4, 1TB, 3500 MB/s read, 3000 MB/s write
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(20, 16, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 16 AND av.value = 'NVMe PCIe Gen 4')),
(20, 17, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 17 AND av.value = '1TB')),
(20, 18, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 18 AND av.value = '3500 MB/s')),
(20, 19, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 19 AND av.value = '3000 MB/s'));

-- 21: Samsung 870 EVO 500GB — SATA III, 500GB, 560 MB/s read, 530 MB/s write
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(21, 16, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 16 AND av.value = 'SATA III')),
(21, 17, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 17 AND av.value = '500GB')),
(21, 18, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 18 AND av.value = '560 MB/s')),
(21, 19, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 19 AND av.value = '530 MB/s'));

-- 22: Samsung 990 PRO 2TB — NVMe Gen 4, 2TB, 7450 MB/s read, 6900 MB/s write
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(22, 16, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 16 AND av.value = 'NVMe PCIe Gen 4')),
(22, 17, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 17 AND av.value = '2TB')),
(22, 18, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 18 AND av.value = '7450 MB/s')),
(22, 19, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 19 AND av.value = '6900 MB/s'));

-- ================================================================
-- VGA products (IDs 23-27)
-- Attrs: 20=GPU Chip, 21=VRAM, 22=Loại bộ nhớ, 23=Yêu cầu nguồn
-- ================================================================

-- 23: MSI RTX 4060 VENTUS 2X 8G OC — RTX 4060, 8GB, GDDR6, 550W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(23, 20, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 20 AND av.value = 'RTX 4060')),
(23, 21, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 21 AND av.value = '8GB')),
(23, 22, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 22 AND av.value = 'GDDR6')),
(23, 23, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 23 AND av.value = '550W'));

-- 24: ASUS TUF RTX 4070 Ti OC 12GB — RTX 4070 Ti, 12GB, GDDR6X, 700W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(24, 20, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 20 AND av.value = 'RTX 4070 Ti')),
(24, 21, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 21 AND av.value = '12GB')),
(24, 22, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 22 AND av.value = 'GDDR6X')),
(24, 23, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 23 AND av.value = '700W'));

-- 25: GIGABYTE RTX 4080 SUPER GAMING OC 16G — RTX 4080 SUPER, 16GB, GDDR6X, 750W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(25, 20, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 20 AND av.value = 'RTX 4080 SUPER')),
(25, 21, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 21 AND av.value = '16GB')),
(25, 22, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 22 AND av.value = 'GDDR6X')),
(25, 23, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 23 AND av.value = '750W'));

-- 26: MSI RTX 4070 VENTUS 3X 12G OC — RTX 4070, 12GB, GDDR6X, 650W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(26, 20, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 20 AND av.value = 'RTX 4070')),
(26, 21, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 21 AND av.value = '12GB')),
(26, 22, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 22 AND av.value = 'GDDR6X')),
(26, 23, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 23 AND av.value = '650W'));

-- 27: ASUS Dual RTX 4060 Ti OC 8GB — RTX 4060 Ti, 8GB, GDDR6, 550W
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(27, 20, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 20 AND av.value = 'RTX 4060 Ti')),
(27, 21, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 21 AND av.value = '8GB')),
(27, 22, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 22 AND av.value = 'GDDR6')),
(27, 23, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 23 AND av.value = '550W'));

-- ================================================================
-- PSU products (IDs 28-31)
-- Attrs: 24=Công suất, 25=Hiệu suất, 26=Modular
-- ================================================================

-- 28: CORSAIR RM850x 850W — 850W, 80+ Gold, Full Modular
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(28, 24, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 24 AND av.value = '850W')),
(28, 25, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 25 AND av.value = '80+ Gold')),
(28, 26, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 26 AND av.value = 'Full Modular'));

-- 29: Seasonic Focus GX-750 — 750W, 80+ Gold, Full Modular
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(29, 24, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 24 AND av.value = '750W')),
(29, 25, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 25 AND av.value = '80+ Gold')),
(29, 26, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 26 AND av.value = 'Full Modular'));

-- 30: Cooler Master V850 Gold V2 — 850W, 80+ Gold, Full Modular
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(30, 24, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 24 AND av.value = '850W')),
(30, 25, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 25 AND av.value = '80+ Gold')),
(30, 26, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 26 AND av.value = 'Full Modular'));

-- 31: CORSAIR RM650 650W — 650W, 80+ Gold, Full Modular
INSERT INTO product_attribute (product_id, attribute_id, attribute_value_id) VALUES
(31, 24, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 24 AND av.value = '650W')),
(31, 25, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 25 AND av.value = '80+ Gold')),
(31, 26, (SELECT av.id FROM attribute_value av WHERE av.attribute_id = 26 AND av.value = 'Full Modular'));
