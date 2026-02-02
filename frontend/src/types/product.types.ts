// ===== MAIN PRODUCT INTERFACES (Backend DTOs - ProductResponse.java) =====

// Product Response DTO - exact match với backend ProductResponse.java
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  low_stock_threshold: number;
  image_url?: string;

  images?: Array<{
    id: number;
    file_path: string;
    is_primary: boolean;
  }>;
  category: Category;
  specifications: Record<string, any>;
  // Dynamic per-category attributes (JSONB in backend)
  attributes?: Record<string, any>;
  is_active: boolean;
  is_low_stock?: boolean;
  created_at: string;
  updated_at: string;
}

// Category Response DTO - exact match với backend CategoryResponse.java
export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  parent_category_id?: number;
  parent_category_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Creation/Update Requests
export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  specifications: Record<string, any>;
  category_id: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock_quantity?: number;
  image_url?: string;
  specifications?: Record<string, any>;
  category_id?: number;
}

// Category Creation/Update Requests - match với backend API
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parent_category_id?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  parent_category_id?: number;
}

// Product Filtering and Search
export interface ProductFilter {
  category_ids?: number[];
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  search?: string;
  brands?: string[];
  specifications?: Record<string, any>;
}

// Attribute Definition from backend (AttributeDefinitionResponse.java)
export interface AttributeDefinition {
  id: number;
  category_id: number;
  code: string; // key used in attributes JSON (e.g., brand, generation)
  display_name: string;
  data_type: string;   // string | number | boolean
  input_type: string;  // select | multi-select | range | checkbox
  unit?: string | null;
  sort_order?: number;
  options?: any;       // JSON payload (array or object) for predefined values
  is_active?: boolean;
}

export interface AttributeDefinitionPayload {
  code: string;
  display_name: string;
  data_type: string;
  input_type: string;
  unit?: string | null;
  sort_order?: number | null;
  options?: any;
  is_active?: boolean;
}

// Product State
export interface ProductState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
  filters: ProductFilter;
}

// Inventory Management
export interface InventoryUpdate {
  product_id: number;
  quantity_change: number;
  reason: string;
}
