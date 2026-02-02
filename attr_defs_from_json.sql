-- Auto-generated from attribute_category.json
-- CPU
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["AMD", "Intel"]'),
    ('series', 'Dòng sản phẩm', 'string', 'select', NULL, 2, '["Core i3", "Core i5", "Core i7", "Core i9", "Core Ultra 5", "Core Ultra 7", "Core Ultra 9", "Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9", "Ryzen AI 300"]'),
    ('generation', 'Thế hệ CPU', 'string', 'select', NULL, 3, '["Intel 13th Gen", "Intel 14th Gen", "Intel 15th Gen (Arrow Lake)", "AMD Zen 5", "AMD Zen 6"]'),
    ('socket', 'Socket', 'string', 'select', NULL, 4, '["AM5", "LGA 1700", "LGA 1851", "LGA 1954"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'CPU'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Video Card
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["NVIDIA", "AMD", "Intel", "ASUS", "MSI", "Gigabyte", "Zotac", "EVGA", "Sapphire"]'),
    ('memory_type', 'Loại bộ nhớ', 'string', 'select', NULL, 2, '["GDDR5", "GDDR6", "GDDR6X", "GDDR7"]'),
    ('memory_size', 'Dung lượng bộ nhớ', 'number', 'select', 'GB', 3, '[2, 4, 6, 8, 12, 16, 24]'),
    ('memory_bus', 'Giao diện bộ nhớ', 'string', 'select', '-bit', 4, '["64-bit", "96-bit", "128-bit", "192-bit", "256-bit", "320-bit", "384-bit"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Video Card'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Memory
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Corsair", "Kingston", "G.Skill", "Crucial", "Samsung", "TeamGroup", "ADATA", "Patriot"]'),
    ('type', 'Loại RAM', 'string', 'select', NULL, 2, '["DDR3", "DDR4", "DDR5"]'),
    ('capacity', 'Dung lượng', 'number', 'select', 'GB', 3, '[4, 8, 16, 32, 64, 128]'),
    ('bus_speed', 'Bus RAM', 'string', 'select', 'MHz', 4, '["DDR3 1600MHz", "DDR4 2666MHz", "DDR4 3200MHz", "DDR4 3600MHz", "DDR5 4800MHz", "DDR5 5200MHz", "DDR5 5600MHz", "DDR5 6000MHz", "DDR5 6400MHz", "DDR5 7200MHz"]'),
    ('ecc', 'Tự sửa lỗi', 'string', 'select', NULL, 5, '["RAM ECC", "RAM Non-ECC"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Memory'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Motherboard
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["ASUS", "MSI", "Gigabyte", "ASRock", "EVGA", "Biostar"]'),
    ('socket', 'Socket', 'string', 'select', NULL, 2, '["LGA 1851", "LGA 1200", "LGA 1700", "AM5", "LGA 1954"]'),
    ('form_factor', 'Kích cỡ (Form Factor)', 'string', 'select', NULL, 3, '["Mini ITX", "M-ATX", "ATX", "E-ATX"]'),
    ('chipset', 'Chipset', 'string', 'select', NULL, 4, '["Intel H610", "Intel H510", "Intel Z590", "AMD B840", "AMD X870", "AMD B850", "AMD X670", "Intel Z890", "Intel B860", "Intel H810"]'),
    ('ram_slots', 'Số khe cắm Ram', 'number', 'select', 'khe', 5, '[2, 4, 8]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Motherboard'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Power Supply
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Corsair", "EVGA", "Seasonic", "be quiet!", "Cooler Master", "MSI", "Fractal", "FSP", "XPG"]'),
    ('wattage', 'Công suất', 'number', 'select', NULL, 2, '[400, 500, 550, 650, 750, 850, 1000]'),
    ('efficiency', 'Chuẩn nguồn', 'string', 'select', NULL, 3, '["Không", "80 Plus", "80 Plus Bronze", "80 Plus Silver", "80 Plus Gold", "80 Plus Platinum", "80 Plus Titanium"]'),
    ('modular', 'Kiểu dây nguồn', 'string', 'select', NULL, 4, '["Non Modular", "Semi Modular", "Full Modular"]'),
    ('form_factor', 'Kích cỡ nguồn', 'string', 'select', NULL, 5, '["FLEX ATX", "SFX", "ATX"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Power Supply'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Case
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Corsair", "NZXT", "Lian Li", "Fractal Design", "Cooler Master", "Phanteks", "Thermaltake", "Silverstone"]'),
    ('type', 'Loại', 'string', 'select', NULL, 2, '["Open Air", "Full Tower", "Mid Tower", "Mini Tower", "Mini ITX"]'),
    ('motherboard_support', 'Kích cỡ mainboard', 'string', 'select', NULL, 3, '["Mini-ITX", "M-ATX", "ATX", "E-ATX", "CEB", "EEB"]'),
    ('color', 'Màu sắc', 'string', 'select', NULL, 4, '["Pink", "Gray", "Green", "Silver", "White", "Red", "Black", "Blue"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Case'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Monitor
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["ASUS", "MSI", "Dell", "LG", "Samsung", "Acer", "BenQ", "Alienware"]'),
    ('size', 'Kích thước', 'number', 'select', 'inch', 2, '[15, 19.5, 21.5, 23.8, 24, 27, 32, 34]'),
    ('resolution', 'Độ phân giải', 'string', 'select', NULL, 3, '["HD", "HD+", "Full HD", "WUXGA", "UWHD", "2K QHD", "4K UHD", "5K"]'),
    ('refresh_rate', 'Tần số quét', 'number', 'select', 'Hz', 4, '[60, 75, 100, 120, 144, 165, 240, 360]'),
    ('response_time', 'Thời gian đáp ứng', 'number', 'select', 'ms', 5, '[0.1, 0.3, 0.5, 1, 4, 5, 8]'),
    ('brightness', 'Độ sáng', 'number', 'select', 'cd/m²', 6, '[200, 220, 240, 250, 270, 300, 320, 350, 400]'),
    ('connectivity', 'Kết nối', 'string', 'select', NULL, 7, '["Display Port", "HDMI", "VGA", "USB-C"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Monitor'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Keyboard
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Razer", "Corsair", "Logitech", "Keychron", "Dygma", "Kinesis"]'),
    ('layout', 'Bố cục', 'string', 'select', NULL, 2, '["Full-size", "TKL", "60%", "65%", "75%", "80%", "Compact"]'),
    ('switch_type', 'Loại switch', 'string', 'select', NULL, 3, '["Mechanical", "Membrane", "Optical", "Magnetic", "Cherry MX Red", "Cherry MX Blue", "Cherry MX Brown", "Gateron", "Kailh"]'),
    ('connection', 'Kết nối', 'string', 'select', NULL, 4, '["Wired", "Wireless", "Bluetooth"]'),
    ('backlit', 'Đèn nền', 'string', 'select', NULL, 5, '["RGB", "Single Color", "None"]'),
    ('hot_swap', 'Hỗ trợ hot-swap', 'boolean', 'checkbox', NULL, 6, NULL),
    ('media_keys', 'Phím media', 'boolean', 'checkbox', NULL, 7, NULL),
    ('color', 'Màu sắc', 'string', 'select', NULL, 8, '["Black", "White", "Pink", "Gray"]'),
    ('tenkeyless', 'Bố cục Tenkeyless', 'boolean', 'checkbox', NULL, 9, NULL)
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Keyboard'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Mouse
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Logitech", "Razer", "Corsair", "SteelSeries", "Zowie"]'),
    ('sensor_type', 'Loại cảm biến', 'string', 'select', NULL, 2, '["Optical", "Laser"]'),
    ('max_dpi', 'Độ nhạy DPI', 'number', 'range', NULL, 3, NULL),
    ('buttons', 'Số nút', 'number', 'select', NULL, 4, '[2, 3, 5, 6, 8]'),
    ('connection', 'Kết nối', 'string', 'select', NULL, 5, '["Wired", "Wireless", "Bluetooth"]'),
    ('hand_orientation', 'Kiểu cầm', 'string', 'select', NULL, 6, '["Right", "Left", "Ambidextrous"]'),
    ('free_scroll', 'Cuộn tự do', 'boolean', 'checkbox', NULL, 7, NULL),
    ('color', 'Màu sắc', 'string', 'select', NULL, 8, '["Black", "White", "Red", "Blue"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Mouse'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Headphones
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Sony", "Bose", "Sennheiser", "Audio-Technica", "Beats"]'),
    ('type', 'Loại', 'string', 'select', NULL, 2, '["Over-ear", "On-ear", "In-ear", "Earbuds"]'),
    ('connection', 'Kết nối', 'string', 'select', NULL, 3, '["Wired", "Wireless", "Bluetooth"]'),
    ('microphone', 'Micro', 'boolean', 'checkbox', NULL, 4, NULL),
    ('noise_cancelling', 'Khử ồn', 'boolean', 'checkbox', NULL, 5, NULL),
    ('frequency_response', 'Dải tần', 'string', 'select', NULL, 6, '["20-20kHz", "10-40kHz"]'),
    ('enclosure_type', 'Kiểu buồng âm', 'string', 'select', NULL, 7, '["Open-back", "Closed-back"]'),
    ('color', 'Màu sắc', 'string', 'select', NULL, 8, '["Black", "White", "Silver", "Red"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Headphones'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Operating System
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Microsoft Windows", "Ubuntu", "Fedora", "Linux Mint", "Arch Linux", "Debian"]'),
    ('version', 'Phiên bản', 'string', 'select', NULL, 2, '["Windows 10", "Windows 11", "Ubuntu 22.04", "Fedora 40", "Ubuntu 24.04", "Fedora 41"]'),
    ('architecture', 'Kiến trúc', 'string', 'select', NULL, 3, '["32-bit", "64-bit"]'),
    ('license_type', 'Loại giấy phép', 'string', 'select', NULL, 4, '["Home", "Pro", "Enterprise", "OEM", "Retail"]'),
    ('product_type', 'Loại sản phẩm', 'string', 'select', NULL, 5, '["USB", "CD/DVD", "Key Code", "Digital Download"]'),
    ('max_memory', 'Hỗ trợ RAM tối đa', 'string', 'select', 'GB', 6, '["4GB", "128GB", "2TB"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Operating System'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Sound Card
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Creative", "ASUS", "EVGA", "Realtek"]'),
    ('channels', 'Số kênh', 'string', 'select', NULL, 2, '["2.0", "5.1", "7.1", "8.0"]'),
    ('interface', 'Giao tiếp', 'string', 'select', NULL, 3, '["PCIe", "USB", "External"]'),
    ('sample_rate', 'Tần số lấy mẫu', 'string', 'select', 'kHz', 4, '["44.1kHz", "48kHz", "96kHz", "192kHz"]'),
    ('bit_depth', 'Độ sâu bit', 'number', 'select', 'bit', 5, '[16, 24, 32]'),
    ('snr', 'Tỷ lệ SNR', 'number', 'range', 'dB', 6, NULL),
    ('chipset', 'Chipset', 'string', 'select', NULL, 7, '["Realtek", "Creative", "ASUS"]'),
    ('ports', 'Số cổng', 'number', 'select', 'cổng', 8, '[3, 5, 7]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Sound Card'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Speakers
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Bose", "JBL", "Sony", "Logitech", "Harman Kardon"]'),
    ('configuration', 'Cấu hình', 'string', 'select', NULL, 2, '["2.0", "2.1", "5.1", "7.1"]'),
    ('power', 'Công suất', 'number', 'range', 'W', 3, NULL),
    ('connection', 'Kết nối', 'string', 'select', NULL, 4, '["Wired", "Wireless", "Bluetooth", "USB"]'),
    ('frequency_response', 'Dải tần', 'string', 'select', NULL, 5, '["50-20kHz", "40-20kHz"]'),
    ('color', 'Màu sắc', 'string', 'select', NULL, 6, '["Black", "White", "Silver"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Speakers'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- UPS
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["APC", "CyberPower", "Eaton", "Tripp Lite", "Vertiv"]'),
    ('capacity_va', 'Dung lượng', 'number', 'select', 'VA', 2, '[500, 600, 800, 1000, 1500]'),
    ('capacity_w', 'Công suất (W)', 'number', 'select', 'W', 3, '[300, 360, 480, 600, 900]'),
    ('battery_runtime', 'Thời lượng pin', 'number', 'range', 'phút', 4, NULL),
    ('outlets', 'Số ổ cắm', 'number', 'select', 'cổng', 5, '[4, 6, 8, 10]'),
    ('type', 'Loại', 'string', 'select', NULL, 6, '["Standby", "Line-interactive", "Online Double-conversion"]'),
    ('surge_protection', 'Chống sét', 'boolean', 'checkbox', NULL, 7, NULL)
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'UPS'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Webcam
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Logitech", "Razer", "Elgato", "OBSBOT", "Insta360"]'),
    ('resolution', 'Độ phân giải', 'string', 'select', NULL, 2, '["720p", "1080p", "2K", "4K"]'),
    ('frame_rate', 'Tốc độ khung hình', 'number', 'select', 'fps', 3, '[30, 60, 120]'),
    ('connection', 'Kết nối', 'string', 'select', NULL, 4, '["USB 2.0", "USB 3.0", "USB-C"]'),
    ('fov', 'Góc nhìn (FOV)', 'number', 'select', '°', 5, '[60, 78, 90, 120]'),
    ('focus_type', 'Kiểu lấy nét', 'string', 'select', NULL, 6, '["Auto", "Manual", "Fixed"]'),
    ('os_support', 'Hệ điều hành hỗ trợ', 'string', 'select', NULL, 7, '["Windows", "macOS", "Linux"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Webcam'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Wired Network Card
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Intel", "Realtek", "TP-Link", "Broadcom"]'),
    ('speed', 'Tốc độ', 'string', 'select', NULL, 2, '["10/100Mbps", "1Gbps", "2.5Gbps", "5Gbps", "10Gbps"]'),
    ('interface', 'Giao tiếp', 'string', 'select', NULL, 3, '["PCIe x1", "PCIe x4", "USB 3.0", "USB-C"]'),
    ('chipset', 'Chipset', 'string', 'select', NULL, 4, '["Realtek", "Intel", "Aquantia"]'),
    ('color', 'Màu sắc', 'string', 'select', NULL, 5, '["Black", "Silver"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Wired Network Card'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Wireless Network Card
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Intel", "MSI", "Gigabyte", "Cudy", "OKN"]'),
    ('standard', 'Tiêu chuẩn', 'string', 'select', NULL, 2, '["Wi-Fi 4", "Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"]'),
    ('speed', 'Tốc độ', 'string', 'select', 'Mbps', 3, '["300Mbps", "600Mbps", "1200Mbps", "2400Mbps", "5400Mbps"]'),
    ('interface', 'Giao tiếp', 'string', 'select', NULL, 4, '["PCIe", "M.2", "USB"]'),
    ('bluetooth', 'Kết nối Bluetooth', 'string', 'select', NULL, 5, '["Yes (4.0)", "Yes (5.0)", "Yes (5.2)", "Yes (5.3)", "Yes (5.4)", "No"]'),
    ('color', 'Màu sắc', 'string', 'select', NULL, 6, '["Black", "White"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Wireless Network Card'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Case Accessory
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Lian Li", "Corsair", "Phanteks", "NZXT"]'),
    ('type', 'Loại', 'string', 'select', NULL, 2, '["Fan Controller", "RGB Hub", "Cable Management Kit", "Vertical GPU Mount", "Dust Filter", "Riser Cable"]'),
    ('form_factor', 'Kích cỡ (Form Factor)', 'string', 'select', NULL, 3, '["Internal", "5.25\" Bay", "PCIe Slot"]'),
    ('compatibility', 'Tương thích', 'string', 'select', NULL, 4, '["Specific Cases", "Motherboards"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Case Accessory'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Case Fan
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Noctua", "Corsair", "Arctic", "Be Quiet!", "Thermalright"]'),
    ('size', 'Kích thước', 'number', 'select', 'mm', 2, '[80, 92, 120, 140, 200]'),
    ('rpm', 'Tốc độ quay (RPM)', 'string', 'select', 'RPM', 3, '["800RPM", "1200RPM", "1500RPM", "2000RPM"]'),
    ('airflow', 'Lưu lượng gió', 'string', 'select', 'CFM', 4, '["30CFM", "50CFM", "70CFM"]'),
    ('noise_level', 'Độ ồn', 'string', 'select', 'dBA', 5, '["15dBA", "20dBA", "25dBA"]'),
    ('pwm', 'PWM', 'boolean', 'checkbox', NULL, 6, NULL),
    ('bearing_type', 'Loại vòng bi', 'string', 'select', NULL, 7, '["Sleeve", "Ball", "Fluid Dynamic"]'),
    ('rgb', 'RGB/LED', 'string', 'select', NULL, 8, '["Yes (ARGB)", "Yes (Single Color)", "No"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Case Fan'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- CPU Cooler
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Noctua", "Thermalright", "ID-Cooling", "Arctic", "Corsair"]'),
    ('type', 'Loại', 'string', 'select', NULL, 2, '["Air Cooler", "AIO Liquid", "Passive"]'),
    ('socket_compatibility', 'Tương thích socket', 'string', 'select', NULL, 3, '["AM4", "AM5", "LGA1700", "LGA1200", "LGA1851"]'),
    ('radiator_size', 'Kích thước radiator', 'number', 'select', 'mm', 4, '[120, 240, 280, 360]'),
    ('fan_size', 'Kích thước quạt', 'number', 'select', 'mm', 5, '[92, 120, 140]'),
    ('height', 'Chiều cao', 'number', 'select', 'mm', 6, '[120, 150, 160]'),
    ('tdp_rating', 'Chỉ số TDP', 'number', 'select', 'W', 7, '[150, 200, 250]'),
    ('noise_level', 'Độ ồn', 'string', 'select', 'dBA', 8, '["20dBA", "25dBA", "30dBA", "35dBA"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'CPU Cooler'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- External Hard Drive
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["WD", "Seagate", "Samsung", "LaCie"]'),
    ('capacity', 'Dung lượng', 'string', 'select', NULL, 2, '["500GB", "1TB", "2TB", "4TB", "8TB"]'),
    ('type', 'Loại', 'string', 'select', NULL, 3, '["HDD", "SSD"]'),
    ('interface', 'Giao tiếp', 'string', 'select', NULL, 4, '["USB 2.0", "USB 3.0", "USB 3.1", "USB-C", "Thunderbolt"]'),
    ('portable', 'Tính di động', 'boolean', 'checkbox', NULL, 5, NULL),
    ('price_per_gb', 'Giá mỗi GB', 'number', 'range', 'USD/GB', 6, NULL),
    ('color', 'Màu sắc', 'string', 'select', NULL, 7, '["Black", "Silver", "Red"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'External Hard Drive'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Internal Hard Drive
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Seagate", "WD", "Toshiba", "Samsung"]'),
    ('capacity', 'Dung lượng', 'string', 'select', NULL, 2, '["500GB", "1TB", "2TB", "4TB", "8TB", "16TB"]'),
    ('type', 'Loại', 'string', 'select', NULL, 3, '["HDD (5400RPM)", "HDD (7200RPM)", "SSD"]'),
    ('form_factor', 'Kích cỡ (Form Factor)', 'string', 'select', NULL, 4, '["2.5\"", "3.5\"", "M.2 2280"]'),
    ('interface', 'Giao tiếp', 'string', 'select', NULL, 5, '["SATA 6Gb/s", "NVMe PCIe 3.0", "PCIe 4.0"]'),
    ('cache', 'Bộ nhớ đệm', 'number', 'select', 'MB', 6, '[64, 128, 256]'),
    ('price_per_gb', 'Giá mỗi GB', 'number', 'range', 'USD/GB', 7, NULL)
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Internal Hard Drive'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Optical Drive
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Pioneer", "ASUS", "LG"]'),
    ('type', 'Loại', 'string', 'select', NULL, 2, '["DVD-ROM", "DVD-RW", "Blu-ray Reader", "Blu-ray Writer"]'),
    ('read_speeds', 'Tốc độ đọc', 'string', 'select', NULL, 3, '["CD x48", "DVD x16", "BD x12"]'),
    ('write_speeds', 'Tốc độ ghi', 'string', 'select', NULL, 4, '["CD x24", "DVD x8", "BD x6"]'),
    ('interface', 'Giao tiếp', 'string', 'select', NULL, 5, '["SATA", "USB", "External"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Optical Drive'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Fan Controller
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Corsair", "NZXT", "Cooler Master", "Noctua", "DEEPCOOL"]'),
    ('channels', 'Số kênh', 'number', 'select', NULL, 2, '[4, 6, 8]'),
    ('channel_wattage', 'Công suất mỗi kênh', 'number', 'select', 'W', 3, '[10, 15, 20]'),
    ('pwm_support', 'Hỗ trợ PWM', 'boolean', 'checkbox', NULL, 4, NULL),
    ('form_factor', 'Kích cỡ (Form Factor)', 'string', 'select', NULL, 5, '["5.25\" Bay", "Internal", "PCIe Card"]'),
    ('display', 'Màn hình hiển thị', 'boolean', 'checkbox', NULL, 6, NULL),
    ('color', 'Màu sắc', 'string', 'select', NULL, 7, '["Black", "Silver"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Fan Controller'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;

-- Thermal Paste
INSERT INTO attribute_definitions (category_id, code, display_name, data_type, input_type, unit, sort_order, options)
SELECT c.id, attr.code, attr.display_name, attr.data_type, attr.input_type, attr.unit, attr.sort_order, attr.options::jsonb
FROM categories c
CROSS JOIN (VALUES
    ('manufacturer', 'Thương hiệu', 'string', 'select', NULL, 1, '["Thermal Grizzly", "Arctic", "Noctua", "Corsair"]'),
    ('amount', 'Khối lượng', 'number', 'select', 'g', 2, '[1, 2, 4, 8]'),
    ('conductivity', 'Độ dẫn nhiệt', 'number', 'range', 'W/mK', 3, NULL),
    ('type', 'Loại', 'string', 'select', NULL, 4, '["Non-conductive", "Conductive", "Liquid Metal"]'),
    ('application_method', 'Phương pháp bôi', 'string', 'select', NULL, 5, '["Syringe", "Pad"]')
) AS attr(code, display_name, data_type, input_type, unit, sort_order, options)
WHERE c.name = 'Thermal Paste'
ON CONFLICT (category_id, code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    data_type = EXCLUDED.data_type,
    input_type = EXCLUDED.input_type,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    options = EXCLUDED.options;
