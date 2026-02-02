import { api, apiClient } from './api';
import { getBackendBaseUrl } from '../utils/urlHelpers';
import { productService } from './product.service';

type Page<T> = { content: T[]; totalElements: number; totalPages: number };

export interface PagedResponse<T> {
  content: T[];
  page_number: number;
  page_size: number;
  total_elements: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  is_first?: boolean;
  is_last?: boolean;
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface InventoryProduct {
  id: number;
  name: string;
  quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  category?: {
    id: number;
    name: string;
  };
  updated_at: string;
}

export interface LowStockSummary {
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  products: InventoryProduct[];
}

export interface StockAdjustmentRequest {
  change_type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  performed_by_id: number;
}

export interface StockReserveRequest {
  quantity: number;
  reserved_for: string;
}

export interface StockReleaseRequest {
  quantity: number;
  reason: string;
}

export interface InventoryLog {
  id: number;
  product_id: number;
  change_type: string;
  quantity_change: number;
  reason: string;
  performed_by: number;
  created_at: string;
  product_name?: string;
  productId?: number;
  productName?: string;
  changeType?: string;
  quantityChange?: number;
  performed_by_username?: string;
  performedByUsername?: string;
  performed_by_id?: number;
  performedById?: number;
  performedBy?: number;
  createdAt?: string;
}

export const inventoryService = {
  /**
   * Get all inventory products with pagination - GET /api/v1/inventory/products
   */
  getInventory: async (opts?: { 
    page?: number; 
    size?: number; 
    status?: string; 
    search?: string 
  }): Promise<Page<InventoryProduct>> => {
    // Prepare params outside try so fallback attempts can reuse
    const params: any = { page: opts?.page ?? 0, size: opts?.size ?? 20 };
    if (opts?.status) params.status = opts.status;
    if (opts?.search) params.search = opts.search;

    try {
      console.log('📦 Inventory Service: Đang lấy danh sách tồn kho...');
      
      const resp: any = await api.get('/inventory/products', { params });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      
      if (payload && payload.content !== undefined) return payload as Page<InventoryProduct>;
      if (Array.isArray(payload)) return { content: payload, totalElements: payload.length, totalPages: 1 } as Page<InventoryProduct>;
      return { content: [], totalElements: 0, totalPages: 0 } as Page<InventoryProduct>;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy danh sách tồn kho:', error);

      // Some deployments (Azure static site + functions) may return 500 with message "No static resource ..."
      // Try a few fallback URL variants (absolute) to handle different hosting prefixes (only frontend-side retries).
      try {
        const serverMsg = (error && (error as any).errors) || (error && (error as any).message) || '';
        if (typeof serverMsg === 'string' && serverMsg.includes('No static resource')) {
          console.warn('📦 Inventory Service: detected "No static resource" error, attempting fallbacks');
          const baseFromEnv = getBackendBaseUrl();
          const candidates: string[] = [];

          // Use window origin as a fallback base
          const origin = typeof window !== 'undefined' ? window.location.origin : '';

          // If env provides absolute base, use it as origin candidate
          if (baseFromEnv && (baseFromEnv.startsWith('http://') || baseFromEnv.startsWith('https://'))) {
            const normalized = baseFromEnv.replace(/\/$/, '');
            candidates.push(`${normalized}/inventory/products`);
            candidates.push(`${normalized}/api/inventory/products`);
            candidates.push(`${normalized}/api/v1/inventory/products`);
          }

          if (origin) {
            candidates.push(`${origin}/api/v1/inventory/products`);
            candidates.push(`${origin}/api/inventory/products`);
            candidates.push(`${origin}/inventory/products`);
          }

          // Deduplicate
          const uniq = Array.from(new Set(candidates));

          for (const url of uniq) {
            try {
              console.log(`📦 Inventory Service: trying fallback URL ${url}`);
              const r: any = await apiClient.get(url, { params });
              const p = r && r.data ? r.data : r;
              if (p && (p.content !== undefined || Array.isArray(p))) {
                // Normalize similar to above
                if (p && p.content !== undefined) return p as Page<InventoryProduct>;
                if (Array.isArray(p)) return { content: p, totalElements: p.length, totalPages: 1 } as Page<InventoryProduct>;
              }
            } catch (inner) {
              console.warn('📦 Inventory Service: fallback URL failed:', url, (inner as any)?.message ?? inner);
              // try next
            }
          }
        }
      } catch (retryErr) {
        console.warn('📦 Inventory Service: error during fallback attempts', retryErr);
      }

      // Final frontend-only compatibility fallback: derive inventory from products list
      try {
        const page = Number(params.page ?? 0);
        const size = Number(params.size ?? 20);

        let productPage: { content: any[]; totalElements: number; totalPages: number };
        if (params.search) {
          const r = await productService.searchProducts(String(params.search), { page, size });
          productPage = r;
        } else {
          const r = await productService.getAllProducts({ page, size, sort: 'name,asc' } as any);
          productPage = r as any;
        }

        const mapped = (productPage.content || []).map((prod: any) => {
          const qty = Number(prod.quantity ?? 0);
          const thr = Number(prod.low_stock_threshold ?? 0);
          const out = qty <= 0;
          const low = !out && thr > 0 && qty <= thr;
          return {
            id: prod.id,
            name: prod.name,
            quantity: qty,
            low_stock_threshold: thr,
            is_low_stock: Boolean(prod.is_low_stock ?? low),
            is_out_of_stock: Boolean(prod.is_out_of_stock ?? out),
            category: prod.category ? { id: prod.category.id, name: prod.category.name } : undefined,
            updated_at: prod.updated_at ?? prod.updatedAt ?? '',
            price: prod.price ?? 0,
          } as InventoryProduct & { price?: number };
        });

        // Apply status filter if provided
        let filtered = mapped;
        const status = (opts?.status || '').toUpperCase();
        if (status === 'OUT_OF_STOCK') filtered = mapped.filter((m: any) => m.is_out_of_stock);
        else if (status === 'LOW_STOCK') filtered = mapped.filter((m: any) => !m.is_out_of_stock && m.is_low_stock);
        else if (status === 'IN_STOCK') filtered = mapped.filter((m: any) => !m.is_out_of_stock && !m.is_low_stock);

        return {
          content: filtered,
          totalElements: Number(productPage.totalElements ?? filtered.length ?? 0),
          totalPages: Number(productPage.totalPages ?? Math.max(1, Math.ceil((filtered.length || 1) / (size || 1))))
        } as Page<InventoryProduct>;
      } catch (productFallbackError) {
        console.warn('📦 Inventory Service: product-based fallback failed:', (productFallbackError as any)?.message ?? productFallbackError);
      }

      throw error;
    }
  },

  /**
   * Get product inventory details - GET /api/v1/inventory/products/{id}
   */
  getProductInventory: async (productId: number): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang lấy thông tin tồn kho sản phẩm ${productId}...`);
      const resp: any = await api.get(`/inventory/products/${productId}`);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy thông tin tồn kho sản phẩm:', error);
      throw error;
    }
  },

  /**
   * Get low stock products - GET /api/v1/inventory/low-stock
   * Note: This endpoint may not exist in all backend versions
   */
  getLowStock: async (threshold = 10): Promise<LowStockSummary | InventoryProduct[]> => {
    try {
      console.log(`📦 Inventory Service: Đang lấy sản phẩm sắp hết hàng (ngưỡng: ${threshold})...`);
      const resp: any = await api.get(`/inventory/low-stock?threshold=${threshold}`);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      
      // payload.data may be LowStockSummaryResponse or list
      if (Array.isArray(payload)) return payload;
      return payload?.data || payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy sản phẩm sắp hết hàng:', error);
      // Return empty array if endpoint doesn't exist
      return [];
    }
  },

  /**
   * Get out of stock products - GET /api/v1/inventory/out-of-stock
   * Note: This endpoint may not exist in all backend versions
   */
  getOutOfStock: async (): Promise<InventoryProduct[]> => {
    try {
      console.log('📦 Inventory Service: Đang lấy sản phẩm hết hàng...');
      const resp: any = await api.get('/inventory/out-of-stock');
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return Array.isArray(payload) ? payload : [];
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy sản phẩm hết hàng:', error);
      // Return empty array if endpoint doesn't exist
      return [];
    }
  },

  /**
   * Get products that need restock - GET /api/v1/inventory/need-restock
   * Note: This endpoint may not exist in all backend versions
   */
  getProductsNeedRestock: async (): Promise<InventoryProduct[]> => {
    try {
      console.log('📦 Inventory Service: Đang lấy sản phẩm cần nhập hàng...');
      const resp: any = await api.get('/inventory/need-restock');
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return Array.isArray(payload) ? payload : [];
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy sản phẩm cần nhập hàng:', error);
      // Return empty array if endpoint doesn't exist
      return [];
    }
  },

  /**
   * Adjust product stock - POST /api/v1/inventory/products/{id}/adjust
   */
  adjustInventory: async (productId: number, adjustment: StockAdjustmentRequest): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang điều chỉnh tồn kho sản phẩm ${productId}...`);
      const resp: any = await api.post(`/inventory/products/${productId}/adjust`, adjustment);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Inventory Service: Điều chỉnh tồn kho thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi điều chỉnh tồn kho:', error);
      throw error;
    }
  },

  /**
   * Update stock threshold - PUT /api/v1/inventory/products/{id}/threshold
   */
  updateStockThreshold: async (productId: number, threshold: number): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang cập nhật ngưỡng tồn kho sản phẩm ${productId}...`);
      const resp: any = await api.put(`/inventory/products/${productId}/threshold`, {
        low_stock_threshold: threshold
      });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Inventory Service: Cập nhật ngưỡng tồn kho thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi cập nhật ngưỡng tồn kho:', error);
      throw error;
    }
  },

  /**
   * Reserve stock - POST /api/v1/inventory/products/{id}/reserve
   */
  reserveStock: async (productId: number, reserveRequest: StockReserveRequest): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang đặt trước hàng sản phẩm ${productId}...`);
      const resp: any = await api.post(`/inventory/products/${productId}/reserve`, reserveRequest);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Inventory Service: Đặt trước hàng thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi đặt trước hàng:', error);
      throw error;
    }
  },

  /**
   * Release reserved stock - POST /api/v1/inventory/products/{id}/release
   */
  releaseReservedStock: async (productId: number, releaseRequest: StockReleaseRequest): Promise<InventoryProduct> => {
    try {
      console.log(`📦 Inventory Service: Đang giải phóng hàng đặt trước sản phẩm ${productId}...`);
      const resp: any = await api.post(`/inventory/products/${productId}/release`, releaseRequest);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Inventory Service: Giải phóng hàng đặt trước thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi giải phóng hàng đặt trước:', error);
      throw error;
    }
  },

  /**
   * Get inventory logs - GET /api/v1/inventory/logs
   * Note: This endpoint may not exist in all backend versions
  */
  getInventoryLogs: async (opts?: { page?: number; size?: number; changeType?: string; dateFrom?: string; dateTo?: string; search?: string }): Promise<PagedResponse<InventoryLog>> => {
    try {
      console.log('📦 Inventory Service: Đang lấy lịch sử tồn kho...');
      const params: any = { page: opts?.page ?? 0, size: opts?.size ?? 20 };
      if (opts?.changeType) params.change_type = opts.changeType;
      if (opts?.dateFrom) params.date_from = opts.dateFrom;
      if (opts?.dateTo) params.date_to = opts.dateTo;
      if (opts?.search) params.search = opts.search;
      const resp: any = await api.get('/inventory/logs', { params });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;

      if (payload && payload.content !== undefined) {
        const content = Array.isArray(payload.content) ? payload.content : [];
        return {
          content,
          page_number: typeof payload.page_number === 'number' ? payload.page_number : payload.pageNumber ?? params.page,
          page_size: typeof payload.page_size === 'number' ? payload.page_size : payload.pageSize ?? params.size,
          total_elements: typeof payload.total_elements === 'number' ? payload.total_elements : payload.totalElements ?? content.length,
          total_pages: typeof payload.total_pages === 'number' ? payload.total_pages : payload.totalPages ?? 0,
          has_next: typeof payload.has_next === 'boolean' ? payload.has_next : payload.hasNext ?? false,
          has_previous: typeof payload.has_previous === 'boolean' ? payload.has_previous : payload.hasPrevious ?? false,
          is_first: typeof payload.is_first === 'boolean' ? payload.is_first : payload.isFirst,
          is_last: typeof payload.is_last === 'boolean' ? payload.is_last : payload.isLast
        };
      }

      if (Array.isArray(payload)) {
        return {
          content: payload,
          page_number: params.page,
          page_size: params.size,
          total_elements: payload.length,
          total_pages: payload.length > 0 && params.size > 0 ? Math.ceil(payload.length / params.size) : 0,
          has_next: false,
          has_previous: params.page > 0,
          is_first: params.page === 0,
          is_last: true
        };
      }

      return {
        content: [],
        page_number: params.page,
        page_size: params.size,
        total_elements: 0,
        total_pages: 0,
        has_next: false,
        has_previous: params.page > 0,
        is_first: params.page === 0,
        is_last: true
      };
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy lịch sử tồn kho:', error);
      return {
        content: [],
        page_number: opts?.page ?? 0,
        page_size: opts?.size ?? 0,
        total_elements: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false,
        is_first: true,
        is_last: true
      };
    }
  },

  /**
   * Get product inventory logs - GET /api/v1/inventory/products/{id}/logs
   * Note: This endpoint may not exist in all backend versions
   */
  getProductInventoryLogs: async (productId: number, opts?: { page?: number; size?: number }): Promise<PagedResponse<InventoryLog>> => {
    try {
      console.log(`📦 Inventory Service: Đang lấy lịch sử tồn kho sản phẩm ${productId}...`);
      const params: any = { page: opts?.page ?? 0, size: opts?.size ?? 10 };
      const resp: any = await api.get(`/inventory/products/${productId}/logs`, { params });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;

      if (payload && payload.content !== undefined) {
        const content = Array.isArray(payload.content) ? payload.content : [];
        return {
          content,
          page_number: typeof payload.page_number === 'number' ? payload.page_number : payload.pageNumber ?? params.page,
          page_size: typeof payload.page_size === 'number' ? payload.page_size : payload.pageSize ?? params.size,
          total_elements: typeof payload.total_elements === 'number' ? payload.total_elements : payload.totalElements ?? content.length,
          total_pages: typeof payload.total_pages === 'number' ? payload.total_pages : payload.totalPages ?? 0,
          has_next: typeof payload.has_next === 'boolean' ? payload.has_next : payload.hasNext ?? false,
          has_previous: typeof payload.has_previous === 'boolean' ? payload.has_previous : payload.hasPrevious ?? false,
          is_first: typeof payload.is_first === 'boolean' ? payload.is_first : payload.isFirst,
          is_last: typeof payload.is_last === 'boolean' ? payload.is_last : payload.isLast
        };
      }

      if (Array.isArray(payload)) {
        return {
          content: payload,
          page_number: params.page,
          page_size: params.size,
          total_elements: payload.length,
          total_pages: payload.length > 0 && params.size > 0 ? Math.ceil(payload.length / params.size) : 0,
          has_next: false,
          has_previous: params.page > 0,
          is_first: params.page === 0,
          is_last: true
        };
      }

      return {
        content: [],
        page_number: params.page,
        page_size: params.size,
        total_elements: 0,
        total_pages: 0,
        has_next: false,
        has_previous: params.page > 0,
        is_first: params.page === 0,
        is_last: true
      };
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi lấy lịch sử tồn kho sản phẩm:', error);
      return {
        content: [],
        page_number: opts?.page ?? 0,
        page_size: opts?.size ?? 0,
        total_elements: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false,
        is_first: true,
        is_last: true
      };
    }
  },

  /**
   * Check stock availability - GET /api/v1/inventory/products/{id}/availability
   * Note: This endpoint may not exist in all backend versions
   */
  checkStockAvailability: async (productId: number): Promise<{ available: number; reserved: number; total: number }> => {
    try {
      console.log(`📦 Inventory Service: Đang kiểm tra khả năng tồn kho sản phẩm ${productId}...`);
      const resp: any = await api.get(`/inventory/products/${productId}/availability`);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return payload;
    } catch (error: any) {
      console.error('❌ Inventory Service: Lỗi kiểm tra khả năng tồn kho:', error);
      // Return default values if endpoint doesn't exist
      return { available: 0, reserved: 0, total: 0 };
    }
  }
};

export default inventoryService;
