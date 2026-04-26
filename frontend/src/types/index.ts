/**
 * TypeScript types matching backend DTOs.
 */

// --- API Response ---
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// --- Auth ---
export interface LoginRequest {
  email: string;
  password: string;
  sessionId?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  role: "ADMIN" | "SALES" | "WAREHOUSE" | "CUSTOMER";
  permissions: string[];
}

// --- Address ---
export interface Address {
  id: number;
  label: string | null;
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

// --- Product ---
export interface Product {
  id: number;
  name: string;
  sku: string;
  slug: string;
  originalPrice: number;
  sellingPrice: number;
  description: string | null;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  condition: "NEW" | "BOX" | "TRAY" | "SECOND_HAND";
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  images: ProductImage[];
  attributes: ProductAttribute[];
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductAttribute {
  attributeId: number;
  attributeName: string;
  value: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  level: number;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  logoUrl: string | null;
  description: string | null;
}

// --- Cart ---
export interface CartDto {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  sellingPrice: number;
  quantity: number;
}

export interface CartItemRequest {
  productId: number;
  quantity: number;
}

// --- Wishlist ---
export interface WishlistItem {
  productId: number;
  productName: string;
  productImage: string;
  sellingPrice: number;
  addedAt: string;
}

// --- Order ---
export interface Order {
  id: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
  note: string | null;
  createdAt: string;
  items: OrderDetail[];
}

export interface OrderDetail {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CreateOrderRequest {
  addressId: number;
  note?: string;
  couponCode?: string;
  paymentMethod: "COD" | "MOMO";
}

// --- Coupon ---
export interface Coupon {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  usedCount: number;
  startDate: string;
  endDate: string;
}

// --- Inventory ---
export interface InventoryDto {
  productId: number;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface StockRequest {
  quantity: number;
  reason: string;
}

// --- Review ---
export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// --- Build PC ---
export interface PcBuild {
  id: number;
  name: string;
  totalPrice: number;
  status: "DRAFT" | "SAVED" | "ORDERED";
  components: PcBuildComponent[];
  createdAt: string;
}

export interface PcBuildComponent {
  id: number;
  slotType: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// --- Warranty ---
export interface WarrantyTicket {
  id: number;
  orderId: number;
  productName: string;
  issueDescription: string;
  status: "RECEIVED" | "INSPECTING" | "RESOLVED" | "REJECTED";
  createdAt: string;
}
