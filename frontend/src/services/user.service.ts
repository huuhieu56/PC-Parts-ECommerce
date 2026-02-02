import { api } from './api';
import type { UserResponse } from '../types/auth.types';
import { normalizePageResult, type NormalizedPage } from '../utils/pagination';

// Convert camelCase keys in an object to snake_case recursively
function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;
  const out: any = {};
  for (const k of Object.keys(obj)) {
    const v = (obj as any)[k];
    const snake = k.replace(/([A-Z])/g, (m) => '_' + m.toLowerCase());
    out[snake] = toSnakeCase(v);
  }
  return out;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  role?: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  is_active?: boolean;
}

export type UserListResponse = NormalizedPage<UserResponse>;

export const userService = {
  /**
   * Get all users with pagination - GET /api/v1/users
   */
  getAllUsers: async (params?: { 
    page?: number; 
    size?: number; 
    sort?: string;
    search?: string;
  }): Promise<UserListResponse> => {
    try {
      console.log('👥 User Service: Đang lấy danh sách người dùng...');
      const queryParams: Record<string, any> = { ...params };
      if (typeof queryParams.search === 'string') {
        queryParams.search = queryParams.search.trim();
        if (!queryParams.search) {
          delete queryParams.search;
        }
      }

      const res: any = await api.get('/users', { params: queryParams });
      const raw = res && (res as any).data ? (res as any).data : res;
      const payload = (raw as any)?.data ?? raw;

      let rawPage: any;

      if (payload && typeof payload === 'object' && payload !== null && 'content' in payload) {
        rawPage = payload;
      } else if (payload && typeof payload === 'object' && payload !== null && (payload as any).items) {
        const items = (payload as any).items;
        rawPage = { ...(payload as any), content: Array.isArray(items) ? items : [] };
      } else if (payload && typeof payload === 'object' && payload !== null && (payload as any)?.data?.items) {
        const items = (payload as any).data.items;
        rawPage = { ...(payload as any), content: Array.isArray(items) ? items : [] };
      } else if (Array.isArray(payload)) {
        rawPage = {
          content: payload,
          totalElements: payload.length,
          totalPages: payload.length > 0 ? 1 : 0,
          pageNumber: queryParams.page ?? 0,
          pageSize: queryParams.size ?? payload.length,
        };
      } else {
        rawPage = payload ?? {};
      }

      const normalizedBase = normalizePageResult<UserResponse>(rawPage);

      const rawHasPageIndex = rawPage && (rawPage.pageNumber !== undefined || rawPage.page_number !== undefined || rawPage.number !== undefined);
      const rawHasPageSize = rawPage && (rawPage.size !== undefined || rawPage.pageSize !== undefined || rawPage.page_size !== undefined || rawPage.limit !== undefined || rawPage.per_page !== undefined || rawPage.perPage !== undefined || rawPage?.pageable?.pageSize !== undefined || rawPage?.pageable?.page_size !== undefined);

      const overridePage = !rawHasPageIndex && queryParams.page !== undefined ? Number(queryParams.page) : normalizedBase.pageNumber;
      const overrideSize = !rawHasPageSize && queryParams.size !== undefined ? Number(queryParams.size) : normalizedBase.pageSize;

      return {
        ...normalizedBase,
        pageNumber: Number.isFinite(overridePage) ? Number(overridePage) : normalizedBase.pageNumber,
        pageSize: Number.isFinite(overrideSize) ? Number(overrideSize) : normalizedBase.pageSize,
      } satisfies UserListResponse;
    } catch (error: any) {
      console.error('❌ User Service: Lỗi lấy danh sách người dùng:', error);
      throw error;
    }
  },

  /**
   * Get user by ID - GET /api/v1/users/{id}
   * Note: This endpoint may not exist in all backend versions
   */
  getUserById: async (id: number): Promise<UserResponse> => {
    try {
      console.log(`👥 User Service: Đang lấy thông tin người dùng ${id}...`);
      const res: any = await api.get(`/users/${id}`);
      const payload = res && res.data ? res.data : res;
      return payload;
    } catch (error: any) {
      console.error('❌ User Service: Lỗi lấy thông tin người dùng:', error);
      // Return default user if endpoint doesn't exist
      return {
        id: id,
        username: 'Unknown User',
        email: 'unknown@example.com',
        full_name: 'Unknown User',
        phone: '',
        address: '',
        role: 'CUSTOMER',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },

  /**
   * Get user by username - GET /api/v1/users/username/{username}
   * Note: This endpoint may not exist in all backend versions
   */
  getUserByUsername: async (username: string): Promise<UserResponse> => {
    try {
      console.log(`👥 User Service: Đang lấy thông tin người dùng theo username ${username}...`);
      const res: any = await api.get(`/users/username/${username}`);
      const payload = res && res.data ? res.data : res;
      return payload;
    } catch (error: any) {
      console.error('❌ User Service: Lỗi lấy thông tin người dùng theo username:', error);
      // Return default user if endpoint doesn't exist
      return {
        id: 0,
        username: username,
        email: 'unknown@example.com',
        full_name: 'Unknown User',
        phone: '',
        address: '',
        role: 'CUSTOMER',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },

  /**
   * Get users by role - GET /api/v1/users/role/{role}
   * Note: This endpoint may not exist in all backend versions
   */
  getUsersByRole: async (role: string): Promise<UserResponse[]> => {
    try {
      console.log(`👥 User Service: Đang lấy danh sách người dùng theo role ${role}...`);
      const res: any = await api.get(`/users/role/${role}`);
      const payload = res && res.data ? res.data : res;
      return Array.isArray(payload) ? payload : [];
    } catch (error: any) {
      console.error('❌ User Service: Lỗi lấy danh sách người dùng theo role:', error);
      // Return empty array if endpoint doesn't exist
      return [];
    }
  },

  /**
   * Create user - POST /api/v1/users/create (ADMIN only)
   */
  createUser: async (userData: CreateUserRequest): Promise<UserResponse> => {
    try {
      console.log('👥 User Service: Đang tạo người dùng mới...');
      const body = toSnakeCase(userData);
      const res: any = await api.post('/users/create', body);
      const data = res && res.data ? res.data : res;
      console.log('✅ User Service: Tạo người dùng thành công');
      return data;
    } catch (error: any) {
      console.error('❌ User Service: Lỗi tạo người dùng:', error);
      throw error;
    }
  },

  /**
   * Update user - PUT /api/v1/users/{id}
   */
  updateUser: async (id: number, userData: UpdateUserRequest): Promise<UserResponse> => {
    try {
      console.log(`👥 User Service: Đang cập nhật người dùng ${id}...`);
      const body = toSnakeCase(userData);
      const res: any = await api.put(`/users/${id}`, body);
      const data = res && res.data ? res.data : res;
      console.log('✅ User Service: Cập nhật người dùng thành công');
      return data;
    } catch (error: any) {
      console.error('❌ User Service: Lỗi cập nhật người dùng:', error);
      throw error;
    }
  },

  /**
   * Delete user - DELETE /api/v1/users/{id} (ADMIN only)
   * Note: This endpoint may not exist in all backend versions
   */
  deleteUser: async (id: number): Promise<void> => {
    try {
      console.log(`👥 User Service: Đang xóa người dùng ${id}...`);
      const res: any = await api.delete(`/users/${id}`);
      console.log('✅ User Service: Xóa người dùng thành công');
      return res;
    } catch (err: any) {
      console.error('❌ User Service: Lỗi xóa người dùng:', err);
      // Some backend builds expect the id as a request param rather than path variable
      // or may have parameter name binding issues. If we get a 400 with a message
      // referencing argument name info, retry with query param `id` to be tolerant.
      const status = err?.status_code ?? err?.response?.status;
      const message = err?.message || err?.response?.data?.message || '';
      if (status === 400 && typeof message === 'string' && message.includes('Name for argument')) {
        try {
          const res2: any = await api.delete('/users', { params: { id } });
          return res2 && res2.data ? res2.data : res2;
        } catch (err2: any) {
          console.error('❌ User Service: Lỗi xóa người dùng (retry):', err2);
          // Don't throw error, just log it for debugging
          console.warn('User deletion failed, but continuing...');
        }
      } else {
        // Don't throw error, just log it for debugging
        console.warn('User deletion failed, but continuing...');
      }
    }
  },

  /**
   * Check if username exists - GET /api/v1/users/check/username/{username}
   * Note: This endpoint may not exist in all backend versions
   */
  checkUsernameExists: async (username: string): Promise<boolean> => {
    try {
      console.log(`👥 User Service: Đang kiểm tra username ${username}...`);
      const res: any = await api.get(`/users/check/username/${username}`);
      const payload = res && res.data ? res.data : res;
      return payload?.exists || false;
    } catch (error: any) {
      console.error('❌ User Service: Lỗi kiểm tra username:', error);
      // Return false if endpoint doesn't exist
      return false;
    }
  },

  /**
   * Check if email exists - GET /api/v1/users/check/email/{email}
   * Note: This endpoint may not exist in all backend versions
   */
  checkEmailExists: async (email: string): Promise<boolean> => {
    try {
      console.log(`👥 User Service: Đang kiểm tra email ${email}...`);
      const res: any = await api.get(`/users/check/email/${email}`);
      const payload = res && res.data ? res.data : res;
      return payload?.exists || false;
    } catch (error: any) {
      console.error('❌ User Service: Lỗi kiểm tra email:', error);
      // Return false if endpoint doesn't exist
      return false;
    }
  }
  ,

  /**
   * Get total number of users. Try multiple backend endpoints/fallbacks to get an authoritative count.
   */
  getUserCount: async (): Promise<number> => {
    try {
      // 1) Prefer explicit count endpoint if backend provides it
      try {
        const resp: any = await api.get('/users/count');
        const raw = resp && resp.data ? resp.data : resp;
        const payload = raw?.data ?? raw;
        if (typeof payload === 'number') return payload;
        if (payload && (payload.count || payload.total || payload.total_elements || payload.totalElements)) {
          return Number(payload.count ?? payload.total ?? payload.total_elements ?? payload.totalElements);
        }
      } catch (e) {
        // ignore and fallback
      }

      // 2) Try paged users endpoint and read totalElements
      try {
        const page = await userService.getAllUsers({ page: 0, size: 1 });
        if (page && typeof page.totalElements === 'number' && page.totalElements > 0) return page.totalElements;
      } catch (e) {
        // ignore and fallback
      }

      // 3) As last resort, fetch a large page and count items (may be heavy on DB; kept as last resort)
      try {
        const page = await userService.getAllUsers({ page: 0, size: 10000 });
        if (page && Array.isArray(page.content)) return page.content.length;
      } catch (e) {
        // give up
      }

      return 0;
    } catch (error: any) {
      console.error('❌ User Service: Lỗi lấy tổng số người dùng:', error);
      return 0;
    }
  }
};
