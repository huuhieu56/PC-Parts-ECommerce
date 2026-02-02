import type { Product } from './product.types';

// Cart Item Interface
export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

// Guest Cart Item (for local storage)
export interface GuestCartItem {
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  added_at: string;
}

// Cart Summary
export interface CartSummary {
  total_items: number;
  total_quantity: number;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  // Discount and promotion support
  discount_amount?: number; // amount subtracted from subtotal (default 0)
  promotion?: {
    id?: number;
    code?: string;
    name?: string;
  } | null;
  // Final amount after tax, shipping and discount
  total_amount: number;
  final_amount?: number;
}

// Cart Operations
export interface AddToCartRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cart_item_id: number;
  quantity: number;
}

export interface CartMergeRequest {
  guest_cart_items: {
    product_id: number;
    quantity: number;
  }[];
}

// Cart State
export interface CartState {
  items: CartItem[];
  guest_items: GuestCartItem[];
  summary: CartSummary;
  loading: boolean;
  error: string | null;
  is_guest_mode: boolean;
}

// PC Builder Cart Item (Frontend-only feature)
export interface PCBuilderItem {
  id: string;
  component_type: ComponentType;
  product: Product;
  quantity: number;
  is_required: boolean;
}

export type ComponentType = 
  | 'cpu' 
  | 'motherboard' 
  | 'ram' 
  | 'gpu' 
  | 'storage' 
  | 'psu' 
  | 'case' 
  | 'cooling';

export interface PCBuild {
  id: string;
  name: string;
  components: PCBuilderItem[];
  total_price: number;
  created_at: string;
  last_modified: string;
}

// PC Builder State
export interface PCBuilderState {
  current_build: PCBuild | null;
  saved_builds: PCBuild[];
  component_compatibility: Record<ComponentType, boolean>;
  total_wattage: number;
  estimated_performance: {
    gaming_score: number;
    productivity_score: number;
  };
}
