-- Issue #7: Add functional indexes for LOWER() keyword search performance
-- These indexes support the LOWER(name) LIKE and LOWER(sku) LIKE patterns used in
-- ProductSpecification and ProductRepository.searchByKeyword()

CREATE INDEX IF NOT EXISTS idx_product_name_lower ON product (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_product_sku_lower ON product (LOWER(sku));
