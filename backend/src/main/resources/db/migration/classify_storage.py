#!/usr/bin/env python3
"""
Script to classify Internal Hard Drive products into HDD or SSD categories
and update the V14 migration file.
"""

import re

# HDD product patterns (mechanical hard drives)
HDD_PATTERNS = [
    # Seagate HDD lines
    r'Seagate Exos',
    r'Seagate IronWolf',
    r'Seagate SkyHawk',
    r'Seagate BarraCuda(?! SSD)',  # BarraCuda without SSD suffix
    r'Seagate Constellation',
    r'Seagate Savvio',
    r'Seagate Cheetah',
    r'Seagate Archive',
    r'Seagate Surveillance',
    r'Seagate Enterprise',
    r'Seagate Desktop',
    r'Seagate Pulsar',  # Old enterprise, could be SSD - check

    # WD HDD lines
    r'Western Digital Gold',
    r'Western Digital Red Pro',
    r'Western Digital Purple Pro',
    r'Western Digital Purple(?! SN)',
    r'Western Digital Ultrastar',
    r'Western Digital WD Red Pro',
    r'Western Digital WD Red(?! SN)',
    r'Western Digital WD Blue(?! SN)',
    r'Western Digital WD Black(?! SN)',
    r'Western Digital WD Purple',
    r'Western Digital WD Gold',
    r'Western Digital Se',
    r'Western Digital Re',
    r'Western Digital AV',
    r'Western Digital Caviar',

    # Toshiba HDD lines
    r'Toshiba MG\d',
    r'Toshiba X300',
    r'Toshiba N300',
    r'Toshiba P300',
    r'Toshiba S300',
    r'Toshiba L200',
    r'Toshiba DT\d',
    r'Toshiba MQ\d',
    r'Toshiba MD\d',
    r'Toshiba MK',
    r'Toshiba Enterprise',

    # Hitachi - all HDD
    r'Hitachi',

    # HGST - all HDD
    r'HGST',

    # IBM traditional
    r'IBM',

    # Specific model patterns for HDD
    r'IHD-.*-Ultrastar',
    r'IHD-.*-Deskstar',
    r'IHD-.*-Travelstar',
]

# SSD product patterns (solid state drives)
SSD_PATTERNS = [
    # Explicit SSD in name
    r'SSD',
    r'NVMe',
    r'Optane',
    r'M\.2',
    r'PCIe',

    # Samsung SSD lines
    r'Samsung \d{3}',  # 850, 860, 870, 980, 990
    r'Samsung PM',
    r'Samsung MZ-',
    r'Samsung 9\d00',  # 9100, 9500, etc.

    # Intel SSD lines
    r'Intel 750',
    r'Intel 730',
    r'Intel 710',
    r'Intel 660',
    r'Intel 670',
    r'Intel DC S',
    r'Intel D3-S',
    r'Intel Pro',
    r'Intel X25',

    # Crucial SSD
    r'Crucial P\d',
    r'Crucial T\d',
    r'Crucial MX',
    r'Crucial BX',

    # Kingston SSD
    r'Kingston A\d{3}',
    r'Kingston KC',
    r'Kingston DC',
    r'Kingston NV',
    r'Kingston FURY',

    # Corsair SSD
    r'Corsair MP\d',
    r'Corsair Force',
    r'Corsair CSSD',

    # WD SSD lines
    r'Western Digital.*SN\d',
    r'Western Digital WD_BLACK SN',
    r'Western Digital WD_Black SN',
    r'Western Digital Blue SN',
    r'Western Digital Black AN',

    # Sabrent - all SSD
    r'Sabrent',

    # ADATA SSD
    r'ADATA XPG',
    r'ADATA MARS',
    r'ADATA Swordfish',
    r'ADATA Falcon',
    r'ADATA Legend',
    r'ADATA SX',

    # Seagate SSD
    r'Seagate FireCuda(?! Gaming HDD)',
    r'Seagate Nytro',
    r'Seagate BarraCuda SSD',
    r'Seagate Game Drive.*SSD',

    # Other SSD-only brands
    r'Plextor',
    r'Mushkin',
    r'OWC',
    r'GOODRAM',
    r'Lexar',
    r'Transcend',
    r'PNY',
    r'MSI SPATIUM',
    r'Gigabyte AORUS',
    r'TEAMGROUP',
    r'Nextorage',
    r'Kioxia',
    r'Silicon Power',
    r'Patriot',
    r'Micron',
    r'SK hynix',
    r'Oyen',
    r'Solidigm',
    r'Seagate Game Drive(?!.*HDD)',
    r'Lenovo.*SSD',
]

# Brands that are primarily SSD manufacturers
SSD_BRANDS = [
    'Plextor', 'Mushkin', 'OWC', 'GOODRAM', 'Lexar', 'Transcend', 'PNY',
    'Sabrent', 'Nextorage', 'Kioxia', 'Silicon Power', 'Patriot',
    'SK hynix', 'Oyen', 'Solidigm', 'Micron', 'TEAMGROUP'
]

def classify_product(product_name):
    """Classify a product as HDD or SSD based on its name."""

    # First check for explicit SSD patterns
    for pattern in SSD_PATTERNS:
        if re.search(pattern, product_name, re.IGNORECASE):
            return 'SSD'

    # Check for HDD patterns
    for pattern in HDD_PATTERNS:
        if re.search(pattern, product_name, re.IGNORECASE):
            return 'HDD'

    # Check brand-based classification for SSD brands
    for brand in SSD_BRANDS:
        if brand.lower() in product_name.lower():
            return 'SSD'

    # Default to SSD for unclassified (most modern storage is SSD)
    return 'SSD'

def process_file(input_path, output_path):
    """Process the V14 migration file and update category references."""

    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Track statistics
    stats = {'SSD': 0, 'HDD': 0, 'other': 0}

    # Pattern to match product INSERT statements with Internal Hard Drive
    product_pattern = r"INSERT INTO product \(name, sku, slug, original_price, selling_price, description, category_id, brand_id, condition, status\) VALUES \('([^']+)',"

    lines = content.split('\n')
    new_lines = []

    for line in lines:
        if "Internal Hard Drive" in line and "INSERT INTO product" in line:
            # Extract product name
            match = re.search(product_pattern, line)
            if match:
                product_name = match.group(1)
                category = classify_product(product_name)
                stats[category] = stats.get(category, 0) + 1

                # Replace category reference
                new_line = line.replace(
                    "category WHERE name = 'Internal Hard Drive'",
                    f"category WHERE name = '{category}'"
                )
                # Also update description
                new_line = new_line.replace(
                    "Danh mục: Internal Hard Drive",
                    f"Danh mục: {category}"
                )
                new_lines.append(new_line)
            else:
                new_lines.append(line)
        elif "Internal Hard Drive" in line and "INSERT INTO product_attribute" in line:
            # Skip or update product_attribute for Internal Hard Drive
            # These will need to be reassigned based on product category
            new_lines.append(line.replace("Internal Hard Drive", "SSD"))  # Default
        else:
            new_lines.append(line)

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

    print(f"Classification stats: {stats}")
    print(f"Total products classified: {sum(stats.values())}")

if __name__ == '__main__':
    import sys
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'V14__additional_categories_and_attributes.sql'
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file + '.updated'
    process_file(input_file, output_file)
