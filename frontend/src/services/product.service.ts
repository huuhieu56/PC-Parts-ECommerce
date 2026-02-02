import { api } from './api';
import type { PaginationParams } from '../types/api.types';
import { normalizePageResult, type RawPage, type NormalizedPage } from '../utils/pagination';
import type {
  Product,
  Category,
  UpdateProductRequest,
  ProductFilter
} from '../types/product.types';

// Global flag: show ONLY real backend data (no mock). Default true.
const STRICT_BACKEND: boolean = (() => {
  try {
    const v = (import.meta as any)?.env?.VITE_STRICT_BACKEND;
    return v === undefined ? true : String(v).toLowerCase() === 'true';
  } catch {
    return true;
  }
})();

// Mark that a list-parameter binding bug was seen in the current session. We still
// attempt /products first; this marker only informs fallback diagnostics.
const markListParamBindingBug = () => {
  try { sessionStorage.setItem('has_list_param_binding_bug', '1'); } catch (_) { /* ignore */ }
};

// Detect and remember local backend PathVariable name binding bug (e.g., categoryId in /products/category/{id})
let HAS_PATHVAR_BINDING_BUG = false;
try {
  const persisted = sessionStorage.getItem('has_pathvar_binding_bug');
  HAS_PATHVAR_BINDING_BUG = persisted === '1';
} catch (_) { /* ignore */ }

const markPathVarBindingBug = () => {
  HAS_PATHVAR_BINDING_BUG = true;
  try { sessionStorage.setItem('has_pathvar_binding_bug', '1'); } catch (_) { /* ignore */ }
};

// Minimal mock dataset as last-resort fallback for local backend without -parameters
const MOCK_PRODUCTS: Product[] = Array.from({ length: 12 }).map((_, i) => {
  const id = i + 1;
  const now = new Date().toISOString();
  const catId = (i % 6) + 1;
  return {
    id,
    name: `Sản phẩm demo #${id}`,
    description: 'Dữ liệu mô phỏng khi backend local không hỗ trợ binding tham số.',
    price: 1000000 + i * 150000,
    quantity: 10 + (i % 5),
    low_stock_threshold: 5,
    image_url: undefined,
    images: [],
    category: {
      id: catId,
      name: `Danh mục #${catId}`,
      is_active: true,
      created_at: now,
      updated_at: now,
    } as unknown as Category,
    specifications: { brand: 'Demo', origin: 'VN' },
    is_active: true,
    is_low_stock: false,
    created_at: now,
    updated_at: now,
  };
});

const unwrapApiData = <T>(response: T | { data?: T }): T => {
  if (response && typeof response === 'object' && response !== null && 'data' in response) {
    const { data } = response as { data?: T };
    return (data !== undefined ? data : (response as any)) as T;
  }
  return response as T;
};

export const productService = {
  // ===== PRODUCT MANAGEMENT =====

  /**
   * Get products for admin/staff management - GET /api/v1/products/management
   */
  getManagementProducts: async (
    params: {
      page?: number;
      size?: number;
      sort?: string;
      categoryId?: number;
      stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
      search?: string;
    } = {}
  ): Promise<{ content: Product[]; totalElements: number; totalPages: number; }> => {
    const query: Record<string, unknown> = {};
    if (typeof params.page === 'number') query.page = params.page;
    if (typeof params.size === 'number') query.size = params.size;
    if (typeof params.sort === 'string' && params.sort.trim().length > 0) {
      query.sort = params.sort;
    }
    if (typeof params.categoryId === 'number') {
      query.category_id = params.categoryId;
    }
    if (params.stockStatus) {
      query.stock_status = params.stockStatus;
    }
    if (typeof params.search === 'string' && params.search.trim().length > 0) {
      query.search = params.search.trim();
    }

    const response = await api.get<RawPage<Product>>('/products/management', { params: query });
    const payload = unwrapApiData<RawPage<Product>>(response);
    return normalizePageResult<Product>(payload);
  },

  /**
   * Get all products - GET /api/v1/products
   */
  getAllProducts: async (
    params: PaginationParams & ProductFilter = {}
  ): Promise<{ content: Product[]; totalElements: number; totalPages: number; }> => {
    try {
      // Prefer explicit sortBy/sortDirection for /products; if not provided, try to
      // derive from a combined `sort` string (e.g., 'price,asc').
      const paramsCopy = { ...(params || {}) } as any;
      if (paramsCopy.sortBy) {
        paramsCopy.sortDirection = paramsCopy.sortDirection || 'asc';
      } else if (paramsCopy.sort && typeof paramsCopy.sort === 'string') {
        const parts = paramsCopy.sort.split(',');
        paramsCopy.sortBy = parts[0];
        if (parts[1]) paramsCopy.sortDirection = parts[1];
        delete paramsCopy.sort;
      }

      // Preserve arrays for categoryIds and attr.* so axios emits repeated keys
      const safeParams: Record<string, unknown> = {};
      Object.entries(paramsCopy).forEach(([k, v]) => {
        if (Array.isArray(v) && !(k === 'categoryIds' || k.startsWith('attr.'))) {
          safeParams[k] = v.join(',');
        } else {
          safeParams[k] = v;
        }
      });

    // Always attempt the general endpoint first
    const response = await api.get<RawPage<Product>>('/products', { params: safeParams });
    return normalizePageResult<Product>(unwrapApiData(response));
    } catch (error: any) {
      if (error?.message && String(error.message).startsWith('Skip /products')) {
        console.warn('⚠️ Product Service (compat mode):', error.message);
      } else {
        console.error('❌ Product Service: Lỗi lấy danh sách sản phẩm:', error);
      }

      // Normalize error object from api interceptor (ApiErrorResponse) or Axios error
      const errObj: any = error || {};
      const serverMessage: string = (typeof errObj.message === 'string' && errObj.message) || (errObj?.data?.message) || '';
      const statusCode: number = errObj?.status_code || errObj?.status || errObj?.response?.status || 0;

      const isBindingProblem = (serverMessage && (serverMessage.includes('Name for argument of type [java.util.List]') || serverMessage.includes('parameter name information not found'))) || statusCode === 400;
      const isPathVarBinding = serverMessage && serverMessage.includes('[java.lang.Long]') && serverMessage.includes('parameter name information not found');

      if (isBindingProblem) {
        markListParamBindingBug();
      }
      if (isPathVarBinding) {
        markPathVarBindingBug();
      }

      // 1) If it's a binding problem and params include category-like array, try per-category merge fallback (compat mode only)
      if (!STRICT_BACKEND) try {
        // Skip category-based fallbacks entirely if we know PathVariable binding is broken on local
        if (!HAS_PATHVAR_BINDING_BUG) {
          const paramObj = params as Record<string, any>;
          const arrayKey = Object.keys(paramObj).find(k => Array.isArray(paramObj[k]) || (typeof paramObj[k] === 'string' && (paramObj[k] as string).includes(',')));

          if (isBindingProblem && arrayKey && arrayKey.toLowerCase().includes('category')) {
            // parse ids
            let ids: number[] = [];
            const raw = paramObj[arrayKey];
            if (Array.isArray(raw)) ids = raw.map((v: any) => Number(v)).filter(Boolean);
            else if (typeof raw === 'string') ids = raw.split(',').map((s: string) => Number(s)).filter(Boolean);

            if (ids.length > 0) {
              const page = typeof params.page === 'number' ? params.page : 0;
              const size = typeof params.size === 'number' ? params.size : 24;
              // IMPORTANT: Do not send sort or any list params to category endpoint to avoid 400 on some local builds
              const fetches = ids.map(id =>
                api
                  .get<RawPage<Product>>(`/products/category/${id}`, { params: { page, size } })
                  .then((r) => normalizePageResult<Product>(unwrapApiData(r)))
                  .catch((e) => {
                    const msg = e?.message || e?.data?.message || '';
                    if (typeof msg === 'string' && msg.includes('[java.lang.Long]')) markPathVarBindingBug();
                    return { content: [], totalElements: 0, totalPages: 0 };
                  })
              );

              const results = await Promise.all(fetches);
              const merged = results.flatMap(r => r.content || []);
              // Deduplicate by product id while preserving order
              const map = new Map<number, Product>();
              for (const p of merged) {
                if (!map.has((p as any).id)) map.set((p as any).id, p);
              }
              const unique = Array.from(map.values());
              const total = unique.length;
              const totalPages = Math.max(1, Math.ceil(total / size));

              if (total > 0) {
                return normalizePageResult<Product>({ content: unique, totalElements: total, totalPages });
              }
            }
          }
        }
      } catch (fallbackErr) {
        console.warn('Product Service fallback failed (per-category):', fallbackErr);
      }

      // 1b) If it's a binding problem even without category filters, aggregate across top categories as a general fallback (compat mode only)
      if (!STRICT_BACKEND) try {
        if (isBindingProblem && !HAS_PATHVAR_BINDING_BUG) {
          const page = typeof (params as any).page === 'number' ? (params as any).page : 0;
          const size = typeof (params as any).size === 'number' ? (params as any).size : 24;
          const desiredFetch = Math.min(200, Math.max(size, (page + 1) * size)); // cap to avoid explosion

          // Get categories and select first N to keep requests bounded
          const categoriesResp = await api.get<Category[]>(`/categories`).catch(() => ({ data: [] as Category[] }));
          const categories = (categoriesResp?.data || []) as Category[];
          const topCategories = categories.slice(0, 8); // take first 8 categories

          const fetches = topCategories.map((c) =>
            api
              .get<RawPage<Product>>(`/products/category/${(c as any).id}`, {
                params: { page: 0, size: desiredFetch }, // omit sort to maximize compatibility
              })
              .then((r) => normalizePageResult<Product>(unwrapApiData(r)))
              .catch((e) => {
                const msg = e?.message || e?.data?.message || '';
                if (typeof msg === 'string' && msg.includes('[java.lang.Long]')) markPathVarBindingBug();
                return { content: [], totalElements: 0, totalPages: 0 };
              })
          );
          const results = await Promise.all(fetches);
          const merged = results.flatMap((r) => r.content || []);

          // Deduplicate by id and paginate client-side
          const map = new Map<number, Product>();
          for (const p of merged) {
            const pid = (p as any).id;
            if (!map.has(pid)) map.set(pid, p);
          }
          const unique = Array.from(map.values());
          const total = unique.length;
          const start = page * size;
          const paged = start < total ? unique.slice(start, start + size) : [];
          const totalPages = Math.max(1, Math.ceil(total / size));

          if (total > 0) {
            return normalizePageResult<Product>({ content: paged, totalElements: total, totalPages });
          }
        }
      } catch (aggregateErr) {
        console.warn('Product Service fallback failed (aggregate categories):', aggregateErr);
      }

      // 2) Try search-based fallback (keyword) to bypass /products signature (compat mode only)
      if (!STRICT_BACKEND) try {
        const page = typeof (params as any).page === 'number' ? (params as any).page : 0;
        const size = typeof (params as any).size === 'number' ? (params as any).size : 24;
        const keyword = (params as any).search || 'a'; // single-letter keyword to broaden results
        const searchResp = await api.get<RawPage<Product>>(
          '/products/search',
          { params: { keyword, page, size } }
        ).catch(() => null);
        if (searchResp) return normalizePageResult<Product>(unwrapApiData(searchResp));
      } catch (searchErr) {
        console.warn('Product Service search fallback failed:', searchErr);
      }

      // 3) Retry variants: sometimes /products expects sortBy & sortDirection instead of sort
      try {
        const paramsCopy = { ...(params || {}) } as Record<string, any>;
        // If we had a combined 'sort' param like 'name,desc', split it into sortBy/sortDirection
        if (typeof paramsCopy.sort === 'string' && (!paramsCopy.sortBy && !paramsCopy.sortDirection)) {
          const parts = (paramsCopy.sort as string).split(',');
          paramsCopy.sortBy = parts[0];
          if (parts[1]) paramsCopy.sortDirection = parts[1];
          delete paramsCopy.sort;
        }

        const retryResp = await api.get<RawPage<Product>>('/products', { params: paramsCopy }).catch(() => null);
        if (retryResp) return normalizePageResult<Product>(unwrapApiData(retryResp));
      } catch (retryErr) {
        console.warn('Product Service retry variant failed:', retryErr);
      }

      // 4) As a final resort: only return mock data when NOT in strict-backend mode
      if (!STRICT_BACKEND) {
        try {
          const page = typeof (params as any).page === 'number' ? (params as any).page : 0;
          const size = typeof (params as any).size === 'number' ? (params as any).size : 24;
          const total = MOCK_PRODUCTS.length;
          const start = page * size;
          const paged = start < total ? MOCK_PRODUCTS.slice(start, Math.min(start + size, total)) : [];
          const totalPages = Math.max(1, Math.ceil(total / (size || 1)));
          console.warn('⚠️ Product Service: dùng dữ liệu mô phỏng do backend local không bind tham số.');
          return normalizePageResult<Product>({ content: paged, totalElements: total, totalPages });
        } catch (_) { /* swallow */ }
      }

      // If we reached here, nothing worked — rethrow the original error so UI can handle/display it
      throw error;
    }
  },

  /**
   * Get total number of active products - GET /api/v1/products/count
   */
  getProductCount: async (): Promise<number> => {
    try {
      const response = await api.get('/products/count');
      // Normalize ApiResponse wrapper: { statusCode, message, data }
      const raw = response && (response as any).data ? (response as any).data : response;
      const payload = (raw as any)?.data ?? raw;
      // payload may be a number or an object { count: n } or { total: n }
      if (typeof payload === 'number') return payload;
      if (payload == null) return 0;
      return Number(payload?.count ?? payload?.total ?? payload?.total_elements ?? payload?.totalElements ?? 0);
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi lấy tổng số sản phẩm:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch product count');
    }
  },

  /**
   * Get product by ID - GET /api/v1/products/{id}
   */
  getProductById: async (id: number): Promise<Product> => {
    try {
      const response = await api.get<Product>(`/products/${id}`);
      // console.log('🛍️ Product Service: Phản hồi lấy sản phẩm theo ID:', response);

      return response.data;
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi lấy sản phẩm theo ID:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch product');
    }
  },

  /**
   * Get products by category - GET /api/v1/products/category/{categoryId}
   */
  getProductsByCategory: async (
    categoryId: number,
    params?: { page?: number; size?: number; sort?: string; }
  ): Promise<NormalizedPage<Product>> => {
    try {
      // sanitize sort: Spring Pageable trên local chỉ chấp nhận tên field entity dạng camelCase
      // Cho phép: id, name, price, quantity, createdAt, updatedAt
      const safeParams: Record<string, unknown> = {};
      if (params && typeof params.page === 'number') safeParams.page = params.page;
      if (params && typeof params.size === 'number') safeParams.size = params.size;
      if (params && typeof params.sort === 'string') {
        const parts = params.sort.split(',');
        const rawField = parts[0]?.trim() || '';
        const dir = (parts[1]?.trim() || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
        // convert snake_case to camelCase
        const camel = rawField.includes('_')
          ? rawField.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
          : rawField;
        const allowed = new Set(['id', 'name', 'price', 'quantity', 'createdAt', 'updatedAt']);
        if (allowed.has(camel)) {
          safeParams.sort = `${camel},${dir}`;
        }
      }
      const response = await api.get<RawPage<Product>>(`/products/category/${categoryId}`, { params: safeParams });
      // console.log('🛍️ Product Service: Phản hồi lấy sản phẩm theo danh mục:', response);
      return normalizePageResult<Product>(unwrapApiData(response));
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi lấy sản phẩm theo danh mục:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch products by category');
    }
  },

  /**
   * Search products - GET /api/v1/products/search
   */
  searchProducts: async (
    keyword: string,
    params: (PaginationParams & ProductFilter) = {}
  ): Promise<{ content: Product[]; totalElements: number; totalPages: number; }> => {
    try {
      // sanitize sort như category: chỉ cho phép camelCase fields an toàn
      const safeParams: Record<string, unknown> = { keyword };
      if (typeof (params as any).page === 'number') safeParams.page = (params as any).page;
      if (typeof (params as any).size === 'number') safeParams.size = (params as any).size;
      if (typeof (params as any).sort === 'string') {
        const parts = String((params as any).sort).split(',');
        const rawField = parts[0]?.trim() || '';
        const dir = (parts[1]?.trim() || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
        const camel = rawField.includes('_')
          ? rawField.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
          : rawField;
        const allowed = new Set(['id', 'name', 'price', 'quantity', 'createdAt', 'updatedAt']);
        if (allowed.has(camel)) {
          safeParams.sort = `${camel},${dir}`;
        }
      }
      const response = await api.get<RawPage<Product>>('/products/search', {
        params: safeParams
      });
      // console.log('🛍️ Product Service: Phản hồi tìm kiếm sản phẩm:', response);
      return normalizePageResult<Product>(unwrapApiData(response));
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi tìm kiếm sản phẩm:', error);
      throw new Error(error.response?.data?.message || 'Failed to search products');
    }
  },

  /**
   * Create product - POST /api/v1/products (ADMIN/STAFF only)
   */
  createProduct: async (productData: any, options?: { images?: File[]; primaryImageIndex?: number }): Promise<Product> => {
    try {
      // If images provided, perform multipart upload flow
      if (options?.images && options.images.length > 0) {
        const form = new FormData();
        const serialized = JSON.stringify(productData);
        form.append('product', new Blob([serialized], { type: 'application/json' }));
        form.append('metadata', new Blob([serialized], { type: 'application/json' }));
        options.images.forEach((f) => form.append('images', f));
        if (typeof options.primaryImageIndex === 'number') form.append('primaryIndex', String(options.primaryImageIndex));
        const response = await api.upload<Product>('/products', form);
        return response.data;
      }
      const response = await api.post<Product>('/products', productData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi tạo sản phẩm:', error);
      throw error;
    }
  },

  createProductWithImageUrls: async (productData: any, imageUrls: string[]): Promise<Product> => {
    try {
      const body = {
        ...productData,
        image_urls: imageUrls,
      };
      const response = await api.post<Product>('/products/with-image-urls', body);
      return response.data;
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi tạo sản phẩm (image URLs):', error);
      throw error;
    }
  },

  /**
   * Update product - PUT /api/v1/products/{id} (ADMIN/STAFF only)
   */
  updateProduct: async (id: number, productData: UpdateProductRequest): Promise<Product> => {
    try {
      const body: any = {
        name: productData.name,
        description: (productData as any).description,
        price: productData.price,
        quantity: (productData as any).quantity,
        low_stock_threshold: (productData as any).lowStockThreshold ?? (productData as any).low_stock_threshold,
        category_id: (productData as any).categoryId ?? (productData as any).category_id,
        specifications: (productData as any).specifications ?? {},
        attributes: (productData as any).attributes ?? {},
        is_active: (productData as any).is_active ?? (productData as any).isActive
      };
      const response = await api.put<Product>(`/products/${id}`, body);
      return response.data;
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi cập nhật sản phẩm:', error);
      throw error;
    }
  },

  /**
   * Delete product - DELETE /api/v1/products/{id} (ADMIN/STAFF only)
   */
  deleteProduct: async (id: number): Promise<void> => {
    try {
      const response = await api.delete<void>(`/products/${id}`);
      console.log('🛍️ Product Service: Phản hồi xóa sản phẩm:', response);
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi xóa sản phẩm:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete product');
    }
  },

  // ===== CATEGORY MANAGEMENT =====
  // TODO: Implement category endpoints khi backend CategoryController ready

  /**
   * Get all categories - GET /api/v1/categories (placeholder)
   */
  getAllCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get<Category[]>('/categories');
      // console.log('🏷️ Product Service: Phản hồi lấy tất cả danh mục:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi lấy danh mục:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  /**
   * Get category by ID - GET /api/v1/categories/{id} (placeholder)
   */
  getCategoryById: async (id: number): Promise<Category> => {
    try {
      const response = await api.get<Category>(`/categories/${id}`);
      // console.log('🏷️ Product Service: Phản hồi lấy danh mục theo ID:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Product Service: Lỗi lấy danh mục theo ID:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch category');
    }
  },

  // ===== UTILITY FUNCTIONS =====

  /**
   * Extract unique brands từ product specifications
   */
  extractBrandsFromProducts: (products: Product[]): string[] => {
    const brands = new Set<string>();
    products.forEach(product => {
      if (product.specifications?.brand) {
        brands.add(product.specifications.brand);
      }
    });
    return Array.from(brands).sort();
  },

  /**
   * Filter products by price range và brand
   */
  filterProducts: (
    products: Product[],
    filters: { minPrice?: number; maxPrice?: number; brands?: string[]; }
  ): Product[] => {
    return products.filter(product => {
      // Price range filter
      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }

      // Brand filter
      if (filters.brands && filters.brands.length > 0) {
        const productBrand = product.specifications?.brand;
        if (!productBrand || !filters.brands.includes(productBrand)) {
          return false;
        }
      }

      return true;
    });
  }
};
