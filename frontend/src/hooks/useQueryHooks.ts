/**
 * CUSTOM REACT QUERY HOOKS
 * 
 * Các hooks sử dụng React Query để fetch và cache data từ backend.
 * Replace existing useEffect-based data fetching với cached, optimized queries.
 * 
 * Benefits:
 * - Automatic caching và background refetching
 * - Loading/error states management
 * - Deduplication of requests
 * - Optimistic updates
 * - Pagination và infinite queries support
 * 
 * Tuân thủ SYSTEM_DESIGN.md - Section 3: Kiến trúc Frontend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';
import type { Product, ProductFilter, Category } from '../types/product.types';

type ProductListResponse = {
  content: Product[];
  totalElements: number;
  totalPages: number;
};

// ===== QUERY KEYS =====
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: ProductFilter, page: number, pageSize: number) =>
      [...queryKeys.products.lists(), filters, page, pageSize] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
    search: (query: string) => [...queryKeys.products.all, 'search', query] as const,
    category: (categoryId: number) => [...queryKeys.products.all, 'category', categoryId] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
  },
};

// ===== PRODUCTS HOOKS =====

/**
 * Hook để lấy danh sách products với filtering và pagination
 * Tự động cache và dedupe requests
 */
export const useProducts = (
  filters: ProductFilter = {},
  page: number = 1,
  pageSize: number = 24,
  options?: Omit<UseQueryOptions<ProductListResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters, page, pageSize),
    queryFn: async () => {
      // Determine sort param
      let sortParam: string | undefined;
      if ((filters as any).sort) {
        const sortVal = (filters as any).sort as 'newest' | 'price_asc' | 'price_desc';
        if (sortVal === 'price_asc') sortParam = 'price,asc';
        else if (sortVal === 'price_desc') sortParam = 'price,desc';
        else sortParam = 'createdAt,desc';
      }

      // If exactly one category id is provided
      const catIds = filters.category_ids || [];
      if (catIds.length === 1) {
        // If there are attribute/specification filters, or price/brand filters, prefer the generic endpoint
        // so backend can apply all constraints in one go. Only use the dedicated category endpoint when
        // we have a very simple request (no attrs, no price/brand filters and no search).
        const hasAttrFilters = !!filters.specifications && Object.keys(filters.specifications || {}).length > 0;
        const hasPriceOrBrand = filters.min_price !== undefined || filters.max_price !== undefined || (filters.brands && filters.brands.length > 0);

        if (filters.search || hasAttrFilters || hasPriceOrBrand) {
          const params: Record<string, unknown> = {
            page: page - 1,
            size: pageSize,
            categoryIds: catIds,
            search: filters.search,
          };
          if (filters.min_price !== undefined) params.minPrice = filters.min_price;
          if (filters.max_price !== undefined) params.maxPrice = filters.max_price;
          if (filters.in_stock !== undefined) params.inStock = filters.in_stock;
          if (filters.brands?.length) params.brands = filters.brands;
          if (sortParam) params.sort = sortParam;

          // include attribute/specification filters under attr.<code>=value so productService preserves keys
          if (filters.specifications) {
            Object.entries(filters.specifications).forEach(([k, v]) => {
              // support arrays for multi-select
              params[`attr.${k}`] = v;
            });
          }

          return productService.getAllProducts(params);
        }

        // No complex filters: use dedicated category endpoint (usually faster/simpler)
        return productService.getProductsByCategory(catIds[0], {
          page: page - 1,
          size: pageSize,
          sort: sortParam,
        });
      }

      // Otherwise, use generic products endpoint with filters (if backend supports them)
      const params: Record<string, unknown> = {
        page: page - 1,
        size: pageSize,
      };
      if (catIds.length) params.categoryIds = catIds;
      if (filters.min_price !== undefined) params.minPrice = filters.min_price;
      if (filters.max_price !== undefined) params.maxPrice = filters.max_price;
      if (filters.in_stock !== undefined) params.inStock = filters.in_stock;
      if (filters.search) params.search = filters.search;
      if (filters.brands?.length) params.brands = filters.brands;
      // pass attribute/specification filters as attr.<code>=value so productService retains key names
      if (filters.specifications) {
        Object.entries(filters.specifications).forEach(([k, v]) => {
          if (v === undefined || v === null || v === '') return;
          const attrKey = `attr.${k}`;
          if (Array.isArray(v)) {
            if (v.length > 0) params[attrKey] = v;
            return;
          }
          if (typeof v === 'object') {
            const maybe = v as Record<string, unknown>;
            const minVal = maybe.min;
            const maxVal = maybe.max;
            if (minVal !== undefined && minVal !== null && minVal !== '') {
              params[`attr.${k}_min`] = minVal;
            }
            if (maxVal !== undefined && maxVal !== null && maxVal !== '') {
              params[`attr.${k}_max`] = maxVal;
            }
            // remove min/max keys to avoid sending nested objects (backend expects primitives)
            const rest = { ...maybe };
            delete rest.min;
            delete rest.max;
            if (Object.keys(rest).length > 0) {
              params[attrKey] = rest;
            }
            return;
          }
          params[attrKey] = v;
        });
      }
      if (sortParam) params.sort = sortParam;

      return productService.getAllProducts(params);
    },
    staleTime: 5 * 60 * 1000,     // Fresh for 5 minutes
    gcTime: 10 * 60 * 1000,       // Cache for 10 minutes
    ...options,
  });
};

/**
 * Hook để lấy chi tiết một product
 */
export const useProduct = (
  productId: number,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: async () => productService.getProductById(productId),
    enabled: !!productId,         // Only run if productId exists
    staleTime: 10 * 60 * 1000,    // Product details fresh for 10 minutes
    ...options,
  });
};

/**
 * Hook để search products
 */
export const useProductSearch = (
  searchQuery: string,
  page: number = 1,
  pageSize: number = 24
) => {
  return useQuery({
    queryKey: [...queryKeys.products.search(searchQuery), page, pageSize],
    queryFn: async () =>
      productService.searchProducts(searchQuery, {
        page: page - 1,
        size: pageSize,
      }),
    enabled: searchQuery.length >= 2,  // Only search if query >= 2 chars
    staleTime: 3 * 60 * 1000,          // Search results fresh for 3 minutes
  });
};

/**
 * Hook để lấy products theo category
 */
export const useProductsByCategory = (
  categoryId: number,
  page: number = 1,
  pageSize: number = 24
) => {
  return useQuery({
    queryKey: [...queryKeys.products.category(categoryId), page, pageSize],
    queryFn: async () =>
      productService.getProductsByCategory(categoryId, {
        page: page - 1,
        size: pageSize,
      }),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
};

// ===== CATEGORIES HOOKS =====

/**
 * Hook để lấy tất cả categories (active only)
 */
export const useCategories = (
  options?: Omit<UseQueryOptions<Category[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: async () => categoryService.getActiveCategories(),
    staleTime: 30 * 60 * 1000,    // Categories fresh for 30 minutes (rarely change)
    gcTime: 60 * 60 * 1000,       // Cache for 1 hour
    ...options,
  });
};

/**
 * Hook để lấy chi tiết một category
 */
export const useCategory = (
  categoryId: number,
  options?: Omit<UseQueryOptions<Category>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(categoryId),
    queryFn: async () => categoryService.getCategoryById(categoryId),
    enabled: !!categoryId,
    staleTime: 30 * 60 * 1000,
    ...options,
  });
};

// ===== MUTATIONS (for future use) =====

/**
 * Hook để add product to cart (optimistic update)
 */
export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      // This will be implemented when integrating with cart service
      // For now, just a placeholder
      return { productId, quantity };
    },
    onSuccess: () => {
      // Invalidate cart queries to refetch
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

/**
 * Hook để prefetch product detail (khi hover vào ProductCard)
 */
export const usePrefetchProduct = () => {
  const queryClient = useQueryClient();

  return (productId: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(productId),
      queryFn: async () => productService.getProductById(productId),
      staleTime: 10 * 60 * 1000,
    });
  };
};
