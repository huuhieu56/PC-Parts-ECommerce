/**
 * 📦 SERVICES INDEX - Computer Shop E-commerce
 * 
 * Centralized export of all API services
 * All services are properly typed and connected to backend APIs
 */

// Core API client
export { api } from './api';

// Authentication & User Management
export { authService } from './auth.service';
export { userService } from './user.service';
export type { 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserListResponse 
} from './user.service';

// Product & Category Management
export { productService } from './product.service';
export { categoryService } from './category.service';
export type { CategoryTree } from './category.service';

// Inventory Management
export { inventoryService } from './inventory.service';
export type { 
  InventoryProduct,
  LowStockSummary,
  StockAdjustmentRequest,
  PagedResponse,
  StockReserveRequest,
  StockReleaseRequest,
  InventoryLog
} from './inventory.service';

// Order Management
export { orderService } from './order.service';
export type { 
  Order,
  OrderItem,
  CreateOrderRequest,
  OrderListResponse
} from './order.service';

// Shopping Cart
export { cartService } from './cart.service';

// Comments & Reviews
export { commentService } from './comment.service';

// Promotions & Discounts
export { promotionService } from './promotion.service';

// Admin Dashboard
export { adminDashboardService } from './admin.service';
export type { 
  DashboardStats,
  RecentActivity
} from './admin.service';

// Re-export commonly used types
export type { 
  ApiResponse,
  ApiErrorResponse,
  PaginationParams
} from '../types/api.types';

export type { 
  UserResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UpdateProfileRequest
} from '../types/auth.types';

export type { 
  Product,
  Category,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilter
} from '../types/product.types';
