import { api, apiClient } from './api';
import type { OrderStatus } from '../types/order.types';

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
};

export interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_phone: string;
  // linked user info (may be absent)
  user_id?: number;
  user_name?: string; // full name
  user_username?: string;
  user_email?: string;
  user_phone?: string;
  payment_method: string;
  status: OrderStatus;
  total_amount: number;
  notes?: string;
  promotion_id?: number;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_phone: string;
  payment_method: string;
  notes?: string;
  promotion_id?: number;
}

export interface OrderListResponse {
  content: Order[];
  totalElements: number;
  totalPages: number;
}

export const orderService = {
  /**
   * Get all orders with pagination - GET /api/v1/orders (ADMIN/STAFF only)
   */
  getOrders: async (opts?: {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    category?: number | string;
    sort?: string; // e.g. "createdAt,desc"
  }): Promise<Page<Order>> => {
    try {
      console.log('📦 Order Service: Đang lấy danh sách đơn hàng...');
  const { page = 0, size = 10, status, search, sort, category } = opts || {};
  const params: any = { page, size };
    // support optional category filter (category id or slug)
    if (category !== undefined && category !== null && category !== '') params.category = category;
      if (status) params.status = status;
      if (search) params.search = search;
  // Prefer server-side sort; default to createdAt,desc if not provided
  params.sort = sort || 'createdAt,desc';

      let resp: any;
      try {
        resp = await api.get('/orders', { params });
      } catch (err: any) {
        // If the generic endpoint fails and a status filter is present, try the status-specific endpoint
        const statusProvided = !!status;
        // Log detailed axios-style error information for easier debugging
        console.error('❌ Order Service: api.get(/orders) failed', {
          message: err?.message,
          status: err?.response?.status,
          responseData: err?.response?.data,
          config: err?.config,
        });
        if (statusProvided) {
          try {
            console.warn('⚠️ Order Service: Falling back to getOrdersByStatus due to /orders failure');
            return await (orderService as any).getOrdersByStatus(status as string, { page, size, sort: params.sort });
          } catch (innerErr: any) {
            console.error('❌ Order Service: Fallback getOrdersByStatus also failed', innerErr);
            // Normalize and rethrow the original error where possible
            const payload = innerErr?.response?.data ?? err?.response?.data ?? innerErr?.message ?? err?.message ?? innerErr;
            throw new Error(typeof payload === 'string' ? payload : JSON.stringify(payload));
          }
        }
        const payload = err?.response?.data ?? err?.message ?? err;
        throw new Error(typeof payload === 'string' ? payload : JSON.stringify(payload));
      }

      // api.get returns ApiResponse-like object or raw payload. Normalize both snake_case and camelCase page shapes.
      const raw = resp && (resp as any).data ? (resp as any).data : resp;

      // If server returned a plain array
      if (Array.isArray(raw)) {
        return { content: raw as Order[], totalElements: raw.length, totalPages: 1 } as Page<Order>;
      }

      // Attempt to extract page object from common wrappers
      const pageObj = raw?.content ? raw : raw?.data ? raw.data : raw;

      let content = (pageObj?.content ?? pageObj?.items ?? pageObj) as Order[];
      const totalElements = pageObj?.totalElements ?? pageObj?.total_elements ?? pageObj?.total ?? (Array.isArray(content) ? content.length : 0);
      const totalPages = pageObj?.totalPages ?? pageObj?.total_pages ?? pageObj?.totalPages ?? 0;

      // Ensure content is an array (if not, wrap or fallback to empty)
      const normalizedContent = Array.isArray(content) ? content : (Array.isArray(pageObj) ? pageObj : []);
      // Client-side fallback sort by createdAt desc if server didn't sort
      content = [...(normalizedContent as Order[])].sort((a: any, b: any) => {
        const da = new Date((a as any).created_at ?? (a as any).createdAt ?? 0).getTime();
        const db = new Date((b as any).created_at ?? (b as any).createdAt ?? 0).getTime();
        if (db !== da) return db - da;
        return ((b as any).id ?? 0) - ((a as any).id ?? 0);
      });

      return {
        content: content as Order[],
        totalElements: Number(totalElements ?? 0),
        totalPages: Number(totalPages ?? 0),
      } as Page<Order>;
    } catch (error: any) {
      console.error('❌ Order Service: Lỗi lấy danh sách đơn hàng:', error);
      throw error;
    }
  },

  /**
   * Lấy đơn hàng của người dùng:
   *  - Khách hàng xem chính mình: GET /api/v1/orders/my-orders (userId từ JWT).
   *  - ADMIN/STAFF xem đơn của user khác: POST /api/v1/orders/by-user { user_id }.
   *  - Fallback legacy (nếu backend cũ có): GET /api/v1/orders/user/{userId}.
   */
  getUserOrders: async (userId: number, opts?: { page?: number; size?: number; status?: string }): Promise<Page<Order>> => {
    try {
      const { page = 0, size = 10, status } = opts || {};
      const params: any = { page, size };
      if (status) params.status = status;

      let resp: any;
      // Thử endpoint mới dành cho người dùng hiện tại
      try {
        resp = await api.get(`/orders/my-orders`, { params });
      } catch (e: any) {
        const code = e?.response?.status;
        // Nếu không được (403 hoặc 404) -> thử admin/staff endpoint hoặc legacy
        if ([403, 404].includes(Number(code))) {
          try {
            resp = await api.post(`/orders/by-user`, { user_id: userId }, { params });
          } catch (inner: any) {
            // Thử legacy endpoint cuối cùng
            resp = await api.get(`/orders/user/${userId}`, { params });
          }
        } else {
          throw e;
        }
      }

      const raw = resp?.data?.data ?? resp?.data ?? resp;
      const pageObj = raw?.content ? raw : raw?.data ? raw.data : raw;
      const content = (pageObj?.content ?? pageObj?.items ?? (Array.isArray(pageObj) ? pageObj : [])) as Order[];
      const totalElements = pageObj?.totalElements ?? pageObj?.total_elements ?? pageObj?.total ?? (Array.isArray(content) ? content.length : 0);
      const totalPages = pageObj?.totalPages ?? pageObj?.total_pages ?? 0;
      return {
        content: Array.isArray(content) ? content : [],
        totalElements: Number(totalElements || 0),
        totalPages: Number(totalPages || 0)
      };
    } catch (error: any) {
      console.error('❌ Order Service: Lỗi lấy đơn hàng người dùng:', error);
      throw error;
    }
  },

  /**
   * Get order by ID - GET /api/v1/orders/{id}
   */
  getOrderById: async (id: number): Promise<Order> => {
    try {
      console.log(`📦 Order Service: Đang lấy thông tin đơn hàng ${id}...`);
      const resp: any = await api.get(`/orders/${id}`);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return payload;
    } catch (error: any) {
      console.error('❌ Order Service: Lỗi lấy thông tin đơn hàng:', error);
      throw error;
    }
  },

  /**
   * Get order by code - GET /api/v1/orders/code/{code}
   */
  getOrderByCode: async (code: string): Promise<Order> => {
    try {
      console.log(`📦 Order Service: Đang lấy đơn hàng theo mã ${code}...`);
      const resp: any = await api.get(`/orders/code/${code}`);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      return payload;
    } catch (error: any) {
      console.error('❌ Order Service: Lỗi lấy đơn hàng theo mã:', error);
      throw error;
    }
  },

  /**
   * Get orders by status - GET /api/v1/orders/status/{status} (ADMIN/STAFF only)
   */
  getOrdersByStatus: async (status: string, opts?: {
    page?: number;
    size?: number;
    sort?: string; // e.g. "createdAt,desc"
  }): Promise<Page<Order>> => {
    try {
      console.log(`📦 Order Service: Đang lấy đơn hàng theo trạng thái ${status}...`);
  const { page = 0, size = 10, sort } = opts || {};
  const params: any = { page, size, sort: sort || 'createdAt,desc' };

      const resp: any = await api.get(`/orders/status/${status}`, { params });
      const raw = resp && (resp as any).data ? (resp as any).data : resp;
      if (Array.isArray(raw)) {
        return { content: raw as Order[], totalElements: raw.length, totalPages: 1 } as Page<Order>;
      }

      const pageObj = raw?.content ? raw : raw?.data ? raw.data : raw;
      let content = (pageObj?.content ?? pageObj?.items ?? pageObj) as Order[];
      const totalElements = pageObj?.totalElements ?? pageObj?.total_elements ?? pageObj?.total ?? (Array.isArray(content) ? content.length : 0);
      const totalPages = pageObj?.totalPages ?? pageObj?.total_pages ?? 0;

      const normalizedContent = Array.isArray(content) ? content : (Array.isArray(pageObj) ? pageObj : []);
      content = [...(normalizedContent as Order[])].sort((a: any, b: any) => {
        const da = new Date((a as any).created_at ?? (a as any).createdAt ?? 0).getTime();
        const db = new Date((b as any).created_at ?? (b as any).createdAt ?? 0).getTime();
        if (db !== da) return db - da;
        return ((b as any).id ?? 0) - ((a as any).id ?? 0);
      });

      return {
        content: content as Order[],
        totalElements: Number(totalElements ?? 0),
        totalPages: Number(totalPages ?? 0),
      } as Page<Order>;
    } catch (error: any) {
      console.error('❌ Order Service: Lỗi lấy đơn hàng theo trạng thái:', error);
      throw error;
    }
  },

  /**
   * Tạo đơn hàng từ giỏ hàng.
   * Backend chuẩn hiện tại: POST /api/v1/orders/from-cart (userId lấy từ JWT).
   * Trước đây frontend dùng endpoint cũ dạng /orders/user/{userId}/from-cart gây 404.
   * Hàm này thử endpoint mới trước, nếu backend (ví dụ môi trường cũ) thiếu thì fallback.
   */
  createOrderFromCart: async (userId: number, orderData: CreateOrderRequest): Promise<Order> => {
    try {
      console.log(`📦 Order Service: Đang tạo đơn hàng từ giỏ hàng (userId=${userId})...`);
      let resp: any;

      // Thử endpoint chuẩn (không cần userId trong URL)
      try {
        resp = await api.post(`/orders/from-cart`, orderData);
      } catch (e: any) {
        // Chỉ fallback nếu có userId và lỗi là 404/400/405 (not found / bad request / method not allowed)
        const status = e?.response?.status;
        if (userId && [400, 404, 405].includes(Number(status))) {
          console.warn('⚠️ Order Service: Fallback sang endpoint cũ /orders/user/{id}/from-cart do lỗi:', status);
          try {
            resp = await api.post(`/orders/user/${userId}/from-cart`, orderData);
          } catch (inner: any) {
            // Nếu fallback cũng fail -> ném lỗi cuối
            throw inner;
          }
        } else {
          throw e;
        }
      }

      const payload = resp?.data?.data ?? resp?.data ?? resp;
      console.log('✅ Order Service: Tạo đơn hàng thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Order Service: Lỗi tạo đơn hàng:', error);
      throw error;
    }
  },

  /**
   * Update order status - PATCH /api/v1/orders/{id}/status (ADMIN/STAFF only)
   */
  updateOrderStatus: async (id: number, status: string): Promise<Order> => {
    try {
      const statusUpper = (status || '').toUpperCase();
      console.log(`📦 Order Service: Đang cập nhật trạng thái đơn hàng ${id} thành ${statusUpper}...`);
      const url = `/orders/${id}/status`;

      // Try sequence of formats to be robust against backend binding differences.
      const attempts: Array<() => Promise<any>> = [];

      // Prefer POST first (Azure/backend controller uses @PostMapping)
      // 1) POST with query param only (exactly matches @RequestParam)
      attempts.push(() => api.post(url, null, { params: { status: statusUpper } }));
      // 2) POST with JSON body + query (tolerant)
      attempts.push(() => api.post(url, { status: statusUpper }, { params: { status: statusUpper } }));
      // 3) POST form-urlencoded
      attempts.push(() => apiClient.post(url, new URLSearchParams({ status: statusUpper }).toString(), {
        params: {},
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }));

      // 4) PUT fallback variants
      attempts.push(() => api.put(url, null, { params: { status: statusUpper } }));
      attempts.push(() => api.put(url, { status: statusUpper }, { params: { status: statusUpper } }));

      // 5) PATCH variants last (in case some envs do support PATCH)
      attempts.push(() => api.patch(url, null, { params: { status: statusUpper } }));
      attempts.push(() => api.patch(url, { status: statusUpper }, { params: { status: statusUpper } }));
      attempts.push(() => apiClient.patch(url, new URLSearchParams({ status: statusUpper }).toString(), {
        params: {},
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }));

      let lastError: any = null;
      for (const attempt of attempts) {
        try {
          const resp: any = await attempt();
          // Robust unwrap: axios response -> resp.data, api wrapper -> ApiResponse; inner data -> resp.data.data
          const payload = resp?.data?.data ?? resp?.data ?? resp;
          console.log('✅ Order Service: Cập nhật trạng thái đơn hàng thành công', { methodResult: payload });
          return payload;
        } catch (err: any) {
          lastError = err;
          console.warn('⚠️ Order Service: Attempt to update status failed, trying next format...', err?.message || err);
        }
      }

      console.error('❌ Order Service: Tất cả phương thức cập nhật trạng thái đã thất bại', lastError);
      throw lastError;
    } catch (error: any) {
      console.error('❌ Order Service: Lỗi cập nhật trạng thái đơn hàng:', error);
      throw error;
    }
  },

  /**
   * Cancel order - PATCH /api/v1/orders/{id}/cancel
   */
  cancelOrder: async (id: number): Promise<Order> => {
    try {
      console.log(`📦 Order Service: Đang hủy đơn hàng ${id}...`);
      const url = `/orders/${id}/cancel`;

      const attempts: Array<() => Promise<any>> = [];
      // 1) PATCH (spec-compliant)
      attempts.push(() => api.patch(url));
      // 2) POST fallback
      attempts.push(() => api.post(url));
      // 3) PUT fallback
      attempts.push(() => api.put(url));

      let lastError: any = null;
      for (const attempt of attempts) {
        try {
          const resp: any = await attempt();
          const payload = resp?.data?.data ?? resp?.data ?? resp;
          console.log('✅ Order Service: Hủy đơn hàng thành công');
          return payload;
        } catch (err: any) {
          lastError = err;
          console.warn('⚠️ Order Service: Attempt to cancel failed, trying next method...', err?.message || err);
        }
      }

      console.error('❌ Order Service: Tất cả phương thức hủy đơn đã thất bại', lastError);
      throw lastError;
    } catch (error: any) {
      console.error('❌ Order Service: Lỗi hủy đơn hàng:', error);
      throw error;
    }
  },

  /**
   * Get order statistics - GET /api/v1/orders/stats (ADMIN only)
   * Note: This endpoint may not exist in all backend versions
   */
  getOrderStats: async (): Promise<{
    total_orders: number;
    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    total_revenue: number;
  }> => {
    try {
      console.log('📦 Order Service: Đang lấy thống kê đơn hàng...');
      const resp: any = await api.get('/orders/stats');
      // Normalize ApiResponse wrapper: { statusCode, message, data }
      const raw = resp && resp.data ? resp.data : resp;
      const payload = raw?.data ?? raw;
      // Ensure we return an object with expected numeric fields
      return {
        total_orders: Number(payload?.total_orders ?? payload?.total_orders_count ?? 0),
        pending_orders: Number(payload?.pending_orders ?? payload?.pending ?? 0),
        processing_orders: Number(payload?.processing_orders ?? payload?.processing ?? 0),
        shipped_orders: Number(payload?.shipped_orders ?? payload?.shipped ?? 0),
        delivered_orders: Number(payload?.delivered_orders ?? payload?.delivered ?? 0),
        cancelled_orders: Number(payload?.cancelled_orders ?? payload?.cancelled ?? 0),
        total_revenue: Number(payload?.total_revenue ?? payload?.revenue ?? 0),
      };
    } catch (error: any) {
      console.error('❌ Order Service: Lỗi lấy thống kê đơn hàng:', error);
      // Return default stats if endpoint doesn't exist
      return {
        total_orders: 0,
        pending_orders: 0,
        processing_orders: 0,
        shipped_orders: 0,
        delivered_orders: 0,
        cancelled_orders: 0,
        total_revenue: 0
      };
    }
  }
};

export default orderService;
