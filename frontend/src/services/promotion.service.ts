import { api } from './api';

type Page<T> = { content: T[]; totalElements: number; totalPages: number };

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface DiscountResult {
  promotionId: number;
  amount: number;
}

export const promotionService = {
  /**
   * Get all promotions with pagination - GET /api/v1/promotions (ADMIN only)
   */
  getPromotions: async (opts?: { page?: number; size?: number; status?: string; discountType?: string; search?: string; isActive?: boolean }) => {
    try {
      console.log('🎯 Promotion Service: Đang lấy danh sách khuyến mãi...');
      const params: any = { page: opts?.page ?? 0, size: opts?.size ?? 20 };
      // send query params using snake_case to match backend expectations
      // support both `status` (legacy) and `isActive` (preferred boolean flag)
      if (opts?.status) params.status = opts.status;
      if (typeof opts?.isActive === 'boolean') params.is_active = opts?.isActive;
      if (opts?.discountType) params.discount_type = opts.discountType;
      if (opts?.search) params.search = opts.search;
      const resp: any = await api.get('/promotions', { params });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      if (payload && payload.content !== undefined) return payload as Page<any>;
      if (Array.isArray(payload)) return { content: payload, totalElements: payload.length, totalPages: 1 } as Page<any>;
      return { content: [], totalElements: 0, totalPages: 0 } as Page<any>;
    } catch (error: any) {
      console.error('❌ Promotion Service: Lỗi lấy danh sách khuyến mãi:', error);
      throw error;
    }
  },

  /**
   * Get active promotions - GET /api/v1/promotions/active (Public)
   */
  getActivePromotions: async (): Promise<Promotion[]> => {
    try {
      console.log('🎯 Promotion Service: Đang lấy khuyến mãi đang hoạt động...');
      const resp: any = await api.get('/promotions/active');
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Promotion Service: Đã lấy khuyến mãi đang hoạt động thành công');
      return Array.isArray(payload) ? payload : [];
    } catch (error: any) {
      console.error('❌ Promotion Service: Lỗi lấy khuyến mãi đang hoạt động:', error);
      throw error;
    }
  },

  /**
   * Get applicable promotions - GET /api/v1/promotions/applicable (Public)
   */
  getApplicablePromotions: async (price: number): Promise<Promotion[]> => {
    try {
      console.log(`🎯 Promotion Service: Đang lấy khuyến mãi áp dụng được cho giá ${price}...`);
      const resp: any = await api.get('/promotions/applicable', { params: { price } });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Promotion Service: Đã lấy khuyến mãi áp dụng được thành công');
      return Array.isArray(payload) ? payload : [];
    } catch (error: any) {
      console.error('❌ Promotion Service: Lỗi lấy khuyến mãi áp dụng được:', error);
      throw error;
    }
  },

  /**
   * Get best promotion - GET /api/v1/promotions/best (Public)
   * Adapter: keep legacy name `getBest` used by older consumers which pass (ids, price)
   */
  getBestPromotion: async (price: number): Promise<Promotion | null> => {
    try {
      console.log(`🎯 Promotion Service: Đang lấy khuyến mãi tốt nhất cho giá ${price}...`);
      const resp: any = await api.get('/promotions/best', { params: { price } });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Promotion Service: Đã lấy khuyến mãi tốt nhất thành công');
      return payload || null;
    } catch (error: any) {
      console.error('❌ Promotion Service: Lỗi lấy khuyến mãi tốt nhất:', error);
      throw error;
    }
  },

  // Backwards-compatible adapter used by build-pc hooks: getBest(ids, price)
  getBest: async (_ids: number[], price: number): Promise<Promotion | null> => {
    // Current backend selects best promotion based on price; ids are accepted but unused here
    return await promotionService.getBestPromotion(price);
  },

  /**
   * Calculate discount - GET /api/v1/promotions/{id}/calculate-discount (Public)
   * Supports two calling conventions for backward compatibility:
   *  - calculateDiscount(promotionId, originalPrice)
   *  - calculateDiscount(promotionId, idsArray, originalPrice)
   */
  calculateDiscount: async (
    promotionId: number,
    idsOrOriginalPrice: number | number[],
    maybeOriginalPrice?: number
  ): Promise<DiscountResult> => {
    try {
      const originalPrice = Array.isArray(idsOrOriginalPrice) ? (maybeOriginalPrice ?? 0) : (idsOrOriginalPrice as number);
      console.log(`🎯 Promotion Service: Đang tính toán giảm giá cho khuyến mãi ${promotionId}...`);
      const resp: any = await api.get(`/promotions/${promotionId}/calculate-discount`, {
        params: { originalPrice }
      });
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Promotion Service: Đã tính toán giảm giá thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Promotion Service: Lỗi tính toán giảm giá:', error);
      throw error;
    }
  },

  /**
   * Get promotion by ID - GET /api/v1/promotions/{id} (Public)
   */
  getPromotionById: async (id: number): Promise<Promotion> => {
    try {
      console.log(`🎯 Promotion Service: Đang lấy thông tin khuyến mãi ${id}...`);
      const resp: any = await api.get(`/promotions/${id}`);
      const payload = resp && (resp as any).data ? (resp as any).data : resp;
      console.log('✅ Promotion Service: Đã lấy thông tin khuyến mãi thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Promotion Service: Lỗi lấy thông tin khuyến mãi:', error);
      throw error;
    }
  },

  /**
   * Create promotion - POST /api/v1/promotions (ADMIN only)
   */
  createPromotion: async (promotionData: any): Promise<Promotion> => {
    try {
      console.log('🎯 Promotion Service: Đang tạo khuyến mãi mới...');
      // Defensive sanitization & normalization before sending to backend
      const clone = (obj: any) => (obj && typeof obj === 'object' ? JSON.parse(JSON.stringify(obj)) : obj);
      const sanitized = clone(promotionData) || {};

      // Coerce numeric fields that may arrive as strings
      const numericFields = [
        'discountValue',
        'discount_value',
        'minOrderValue',
        'min_order_value',
        'minimumOrderAmount',
        'minimum_order_amount',
      ];
      for (const k of numericFields) {
        if (sanitized[k] !== undefined && sanitized[k] !== null && typeof sanitized[k] === 'string') {
          const n = sanitized[k].trim();
          if (n === '') delete sanitized[k];
          else {
            const parsed = Number(n);
            if (!Number.isNaN(parsed)) sanitized[k] = parsed;
          }
        }
      }

      // Normalize dates: if Date objects provided, convert to ISO (no milliseconds)
      const dateFields = ['startDate', 'start_date', 'endDate', 'end_date'];
      for (const df of dateFields) {
        const v = sanitized[df];
        if (v instanceof Date) sanitized[df] = v.toISOString().replace(/\.\d{3}Z$/, '');
        else if (typeof v === 'string' && v && !v.includes('T')) {
          const d = new Date(v);
          if (!Number.isNaN(d.getTime())) sanitized[df] = d.toISOString().replace(/\.\d{3}Z$/, '');
        }
      }

      // Coerce boolean
      if (sanitized.isActive !== undefined && typeof sanitized.isActive !== 'boolean') sanitized.isActive = !!sanitized.isActive;

      // remove empty-string values recursively (many backend endpoints reject empty strings)
      const removeEmptyStrings = (obj: any): any => {
        if (obj == null) return obj;
        if (Array.isArray(obj)) return obj.map(removeEmptyStrings);
        if (typeof obj !== 'object') return obj;
        const out: any = {};
        for (const k of Object.keys(obj)) {
          const v = (obj as any)[k];
          if (v === '') continue; // drop empty strings
          if (v == null) continue;
          if (typeof v === 'object') {
            const cleaned = removeEmptyStrings(v);
            // skip objects that became empty
            if (cleaned == null) continue;
            if (typeof cleaned === 'object' && Object.keys(cleaned).length === 0) continue;
            out[k] = cleaned;
          } else {
            out[k] = v;
          }
        }
        return out;
      };

      // toSnakeCase helper
      const toSnakeCase = (obj: any): any => {
        if (obj == null) return obj;
        if (Array.isArray(obj)) return obj.map(toSnakeCase);
        if (typeof obj !== 'object') return obj;
        const out: any = {};
        for (const k of Object.keys(obj)) {
          const v = (obj as any)[k];
          const snake = k.replace(/([A-Z])/g, (m) => '_' + m.toLowerCase());
          out[snake] = toSnakeCase(v);
        }
        return out;
      };

      // remove any empty-string fields (like start_date: "") which cause server errors
      const cleaned = removeEmptyStrings(sanitized);
      const body = toSnakeCase(cleaned);

      // Log sanitized body for debugging (avoid printing tokens)
      try {
        console.log('📤 Promotion Service: Request body (sanitized):', JSON.stringify(body));
      } catch (e) {
        console.log('📤 Promotion Service: Request body prepared');
      }

      const res: any = await api.post('/promotions', body);
      const raw = res && (res as any).data ? (res as any).data : res;
      // ApiResponse wrapper: { status_code, message, data }
      if (raw && typeof raw === 'object' && (raw.status_code !== undefined || raw.message !== undefined)) {
        // treat non-success status codes as errors
        const code = raw.status_code ?? (res && res.status) ?? 200;
        if (!(code >= 200 && code < 300)) {
          console.error('❌ Promotion Service: Server returned error wrapper:', raw);
          throw raw;
        }
        const payload = (raw as any).data ?? raw;
        console.log('✅ Promotion Service: Tạo khuyến mãi thành công');
        return payload;
      }

      const payload = (raw as any).data ?? raw;
      console.log('✅ Promotion Service: Tạo khuyến mãi thành công');
      return payload;
    } catch (error: any) {
      // Provide detailed logging and normalize common API error shapes
      const respData = error?.response?.data ?? error?.data ?? error;
      try {
        console.error('❌ Promotion Service: Lỗi tạo khuyến mãi (raw):', JSON.stringify(respData, null, 2));
      } catch (e) {
        console.error('❌ Promotion Service: Lỗi tạo khuyến mãi (raw):', respData);
      }

      // If server returned structured info, extract validation errors into a readable message
      const serverMsg = respData?.message ?? respData?.error ?? error?.message ?? null;
      const statusCode = respData?.status_code ?? error?.response?.status ?? null;
      const errors = respData?.errors ?? null;
      let human = serverMsg ?? 'Lỗi tạo khuyến mãi';
      if (Array.isArray(errors) && errors.length) {
        try {
          const parts = errors.map((e: any) => {
            if (typeof e === 'string') return e;
            if (e?.field && e?.message) return `${e.field}: ${e.message}`;
            return JSON.stringify(e);
          });
          human += ' - ' + parts.join(' ; ');
        } catch (ex) {
          human += ' - validation errors present';
        }
      }

      const detail = { statusCode, message: human, raw: respData };
      throw new Error(JSON.stringify(detail));
    }
  },

  /**
   * Update promotion - PUT /api/v1/promotions/{id} (ADMIN only)
   */
  updatePromotion: async (id: number, promotionData: any): Promise<Promotion> => {
    try {
      console.log(`🎯 Promotion Service: Đang cập nhật khuyến mãi ${id}...`);
      // Reuse the same sanitization as create
      const clone = (obj: any) => (obj && typeof obj === 'object' ? JSON.parse(JSON.stringify(obj)) : obj);
      const sanitized = clone(promotionData) || {};

      const numericFields = [
        'discountValue',
        'discount_value',
        'minOrderValue',
        'min_order_value',
        'minimumOrderAmount',
        'minimum_order_amount',
      ];
      for (const k of numericFields) {
        if (sanitized[k] !== undefined && sanitized[k] !== null && typeof sanitized[k] === 'string') {
          const n = sanitized[k].trim();
          if (n === '') delete sanitized[k];
          else {
            const parsed = Number(n);
            if (!Number.isNaN(parsed)) sanitized[k] = parsed;
          }
        }
      }

      const dateFields = ['startDate', 'start_date', 'endDate', 'end_date'];
      for (const df of dateFields) {
        const v = sanitized[df];
        if (v instanceof Date) sanitized[df] = v.toISOString().replace(/\.\d{3}Z$/, '');
        else if (typeof v === 'string' && v && !v.includes('T')) {
          const d = new Date(v);
          if (!Number.isNaN(d.getTime())) sanitized[df] = d.toISOString().replace(/\.\d{3}Z$/, '');
        }
      }

      if (sanitized.isActive !== undefined && typeof sanitized.isActive !== 'boolean') sanitized.isActive = !!sanitized.isActive;

      const removeEmptyStrings = (obj: any): any => {
        if (obj == null) return obj;
        if (Array.isArray(obj)) return obj.map(removeEmptyStrings);
        if (typeof obj !== 'object') return obj;
        const out: any = {};
        for (const k of Object.keys(obj)) {
          const v = (obj as any)[k];
          if (v === '' || v == null) continue;
          if (typeof v === 'object') {
            const cleaned = removeEmptyStrings(v);
            if (cleaned && (typeof cleaned !== 'object' || Object.keys(cleaned).length > 0)) out[k] = cleaned;
          } else out[k] = v;
        }
        return out;
      };

      const toSnakeCase = (obj: any): any => {
        if (obj == null) return obj;
        if (Array.isArray(obj)) return obj.map(toSnakeCase);
        if (typeof obj !== 'object') return obj;
        const out: any = {};
        for (const k of Object.keys(obj)) {
          const v = (obj as any)[k];
          const snake = k.replace(/([A-Z])/g, (m) => '_' + m.toLowerCase());
          out[snake] = toSnakeCase(v);
        }
        return out;
      };

      const cleaned = removeEmptyStrings(sanitized);
      const body = toSnakeCase(cleaned);

      try { console.log('📤 Promotion Service: Update body (sanitized):', JSON.stringify(body)); } catch { }

      const res: any = await api.put(`/promotions/${id}`, body);
      const raw = res && (res as any).data ? (res as any).data : res;
      if (raw && typeof raw === 'object' && (raw.status_code !== undefined || raw.message !== undefined)) {
        const code = raw.status_code ?? (res && res.status) ?? 200;
        if (!(code >= 200 && code < 300)) {
          console.error('❌ Promotion Service: Server returned error wrapper (update):', raw);
          throw raw;
        }
        const payload = (raw as any).data ?? raw;
        console.log('✅ Promotion Service: Cập nhật khuyến mãi thành công');
        return payload;
      }
      const payload = (raw as any).data ?? raw;
      console.log('✅ Promotion Service: Cập nhật khuyến mãi thành công');
      return payload;
    } catch (error: any) {
      const respData = error?.response?.data ?? error?.data ?? error;
      try { console.error('❌ Promotion Service: Lỗi cập nhật khuyến mãi (raw):', JSON.stringify(respData, null, 2)); } catch { console.error('❌ Promotion Service: Lỗi cập nhật khuyến mãi (raw):', respData); }
      const serverMsg = respData?.message ?? respData?.error ?? error?.message ?? null;
      const statusCode = respData?.status_code ?? error?.response?.status ?? null;
      const errors = respData?.errors ?? null;
      let human = serverMsg ?? 'Lỗi cập nhật khuyến mãi';
      if (Array.isArray(errors) && errors.length) {
        try {
          const parts = errors.map((e: any) => (typeof e === 'string' ? e : (e?.field && e?.message ? `${e.field}: ${e.message}` : JSON.stringify(e))));
          human += ' - ' + parts.join(' ; ');
        } catch { }
      }
      const detail = { statusCode, message: human, raw: respData };
      throw new Error(JSON.stringify(detail));
    }
  },

  /**
   * Delete promotion - DELETE /api/v1/promotions/{id} (ADMIN only)
   */
  deletePromotion: async (id: number): Promise<void> => {
    try {
      console.log(`🎯 Promotion Service: Đang xóa khuyến mãi ${id}...`);
      await api.delete(`/promotions/${id}`);
      console.log('✅ Promotion Service: Xóa khuyến mãi thành công');
    } catch (error: any) {
      console.error('❌ Promotion Service: Lỗi xóa khuyến mãi:', error);
      throw error;
    }
  },

  /**
   * Activate promotion - PUT /api/v1/promotions/{id}/activate (ADMIN only)
   */
  activatePromotion: async (id: number): Promise<Promotion> => {
    try {
      console.log(`🎯 Promotion Service: Đang kích hoạt khuyến mãi ${id}...`);
      const resp: any = await api.put(`/promotions/${id}/activate`);
      const payload = resp && resp.data ? resp.data : resp;
      console.log('✅ Promotion Service: Kích hoạt khuyến mãi thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Promotion Service: Lỗi kích hoạt khuyến mãi:', error);
      throw error;
    }
  },

  /**
   * Deactivate promotion - PUT /api/v1/promotions/{id}/deactivate (ADMIN only)
   */
  deactivatePromotion: async (id: number): Promise<Promotion> => {
    try {
      console.log(`🎯 Promotion Service: Đang vô hiệu hóa khuyến mãi ${id}...`);
      const resp: any = await api.put(`/promotions/${id}/deactivate`);
      const payload = resp && resp.data ? resp.data : resp;
      console.log('✅ Promotion Service: Vô hiệu hóa khuyến mãi thành công');
      return payload;
    } catch (error: any) {
      console.error('❌ Promotion Service: Lỗi vô hiệu hóa khuyến mãi:', error);
      throw error;
    }
  },

  /**
   * Toggle promotion status (legacy method for backward compatibility)
   */
  togglePromotionStatus: async (id: number, activate: boolean): Promise<Promotion> => {
    if (activate) {
      return await promotionService.activatePromotion(id);
    } else {
      return await promotionService.deactivatePromotion(id);
    }
  }
};

export default promotionService;
