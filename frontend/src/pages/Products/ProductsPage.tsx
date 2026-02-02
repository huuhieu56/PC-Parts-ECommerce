/**
 * 🛍️ PRODUCTS PAGE - Computer Shop E-commerce
 * 
 * Trang chính hiển thị danh sách sản phẩm với filtering, search, pagination
 * Tuân thủ SYSTEM_DESIGN.md và backend Product DTOs
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Collapse,
  Container,
  Typography,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

// Types - sử dụng backend Product types
import type { Product, ProductFilter } from '../../types/product.types';

// Services
import { productService } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
// Components
import { ProductGrid } from '../../components/product/ProductGrid';
import { ProductFilters } from '../../components/product/ProductFilters';
import { ProductSearch } from '../../components/product/ProductSearch';

// categories are handled server-side; no local fetch required for sidebar

// Hooks
import { useDebounce } from '../../hooks/useDebounce';

const createDefaultProductFilters = (): ProductFilter => ({
  category_ids: [],
  brands: [],
  search: '',
  in_stock: false,
});

const reorderProductsByStockStatus = (items: Product[]): Product[] => {
  if (!Array.isArray(items) || items.length === 0) return items;
  const inStock: Product[] = [];
  const outOfStock: Product[] = [];
  items.forEach((product) => {
    const stock = Number.isFinite(product?.quantity) ? product.quantity : 0;
    if (stock && stock > 0) {
      inStock.push(product);
    } else {
      outOfStock.push(product);
    }
  });
  return [...inStock, ...outOfStock];
};

// ===== MAIN COMPONENT =====
export const ProductsPage: React.FC = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();

  // ===== STATE =====
  const [products, setProducts] = useState<Product[]>([]);
  // pagination state (UI uses 1-based page)
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(24); // fixed by requirement
  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<ProductFilter>(() => createDefaultProductFilters());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [resolvedCategoryId, setResolvedCategoryId] = useState<number | null>(null);
  const [attributeDefs, setAttributeDefs] = useState<import('../../types/product.types').AttributeDefinition[] | null>(null);
  // Effective category id derived from URL ?category=ID or slug resolution
  const effectiveCategoryId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    return categoryParam ? Number(categoryParam) : (resolvedCategoryId ?? undefined);
  }, [location.search, resolvedCategoryId]);

  // Fetch category-specific filter schema when category context is active
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (effectiveCategoryId) {
          const defs = await categoryService.getCategoryFilters(effectiveCategoryId);
          if (mounted) setAttributeDefs(defs || []);
        } else {
          if (mounted) setAttributeDefs(null);
        }
      } catch (e) {
        console.warn('Failed to fetch category filters schema:', e);
        if (mounted) setAttributeDefs(null);
      }
    })();
    return () => { mounted = false; };
  }, [effectiveCategoryId]);

  const normalizeSearchString = useCallback((value: string | null | undefined) => (value ? value.trim() : ''), []);

  const arraysEqual = useCallback(<T extends string | number>(a?: T[], b?: T[], shouldSort?: boolean): boolean => {
    const left = a ? [...a] : [];
    const right = b ? [...b] : [];
    if (shouldSort) {
      left.sort();
      right.sort();
    }
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i += 1) {
      if (left[i] !== right[i]) return false;
    }
    return true;
  }, []);

  const filtersEqual = useCallback((a: ProductFilter, b: ProductFilter): boolean => (
    (a.min_price ?? null) === (b.min_price ?? null) &&
    (a.max_price ?? null) === (b.max_price ?? null) &&
    (a.search ?? '') === (b.search ?? '') &&
    Boolean(a.in_stock) === Boolean(b.in_stock) &&
    arraysEqual(a.category_ids, b.category_ids, true) &&
    arraysEqual(a.brands, b.brands, true)
  ), [arraysEqual]);

  const updateSearchParams = useCallback((updater: (params: URLSearchParams) => void, options?: { replace?: boolean; resetPage?: boolean }) => {
    const params = new URLSearchParams(location.search);
    updater(params);
    if (options?.resetPage !== false) {
      params.delete('page');
    }
    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    if (nextSearch === currentSearch) {
      return;
    }
    navigate({ pathname: location.pathname, search: nextSearch }, { replace: options?.replace ?? false });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const normalizedSearch = normalizeSearchString(params.get('search'));

    const nextFilters: ProductFilter = {
      category_ids: effectiveCategoryId ? [effectiveCategoryId] : [],
      brands: [],
      in_stock: false,
      search: normalizedSearch,
    };

    const minParam = params.get('min_price');
    if (minParam !== null && minParam !== '') {
      const parsedMin = Number(minParam);
      if (!Number.isNaN(parsedMin) && parsedMin >= 0) {
        nextFilters.min_price = parsedMin;
      }
    }

    const maxParam = params.get('max_price');
    if (maxParam !== null && maxParam !== '') {
      const parsedMax = Number(maxParam);
      if (!Number.isNaN(parsedMax) && parsedMax >= 0) {
        nextFilters.max_price = parsedMax;
      }
    }

    const brandParams = params.getAll('brand').filter(Boolean);
    if (brandParams.length > 0) {
      nextFilters.brands = brandParams;
    }

    const inStockParam = params.get('in_stock');
    if (inStockParam !== null) {
      const normalized = inStockParam.trim().toLowerCase();
      nextFilters.in_stock = normalized === 'true' || normalized === '1' || normalized === 'yes';
    }

    if (!filtersEqual(filterState, nextFilters)) {
      setFilterState(nextFilters);
    }

    if (searchQuery !== normalizedSearch) {
      setSearchQuery(normalizedSearch);
    }

    const nextInStockOnly = Boolean(nextFilters.in_stock);
    if (inStockOnly !== nextInStockOnly) {
      setInStockOnly(nextInStockOnly);
    }

    const pageParam = params.get('page');
    const nextPage = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
    if (page !== nextPage) {
      setPage(nextPage);
    }
  }, [effectiveCategoryId, filterState, filtersEqual, inStockOnly, location.search, normalizeSearchString, page, searchQuery]);

  // Resolve category ID from pretty slug path `/products/:slug` (footer links)
  useEffect(() => {
    let mounted = true;
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const SLUG_SYNONYMS: Record<string, string[]> = {
      cpu: ['processor', 'bo vi xu ly'],
      vga: ['gpu', 'card do hoa', 'card man hinh', 'do hoa'],
      ram: ['memory', 'bo nho'],
      mainboard: ['motherboard', 'bo mach chu', 'mb'],
      psu: ['nguon', 'power supply', 'nguon may tinh'],
      storage: ['ssd', 'hdd', 'o cung', 'o dia'],
    };

    (async () => {
      if (!slug) {
        if (mounted) setResolvedCategoryId(null);
        return;
      }

      try {
        const want = normalize(slug);
        const synonyms = SLUG_SYNONYMS[want] || [];
        const targets = [want, ...synonyms.map(normalize)];
        const cats = await categoryService.getCategories();
        const bySlug = cats.find((c) => c.slug && normalize(c.slug) === want);
        let id = bySlug?.id ?? null;

        if (!id) {
          const byName = cats.find((c) => targets.some((t) => normalize(c.name).includes(t)));
          id = byName?.id ?? null;
        }

        if (mounted) setResolvedCategoryId(id);
      } catch {
        if (mounted) setResolvedCategoryId(null);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  // ===== DEBOUNCED SEARCH =====
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Note: product fetching is handled by the main effect below which includes
  // sortBy and inStockOnly so sorting/filtering always take effect.

  // ===== FILTERED PRODUCTS (apply only client-side filters like category/price/brand) =====
  const pageProducts = products;

  // ===== HANDLERS =====
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
  };

  const handleInStockToggle = (_event: any, value: string | null) => {
    const v = Boolean(value);
    setInStockOnly(v);
    // reflect to filterState for UI consistency
    setFilterState((prev) => ({ ...prev, in_stock: v }));
    updateSearchParams((sp) => {
      if (v) {
        sp.set('in_stock', 'true');
      } else {
        sp.delete('in_stock');
      }
    });
  };

  const handleFiltersChange = (newFilters: ProductFilter) => {
    setFilterState(newFilters);
  };

  // Submit search: update URL so header/home searches and page are shareable
  const handleSearchSubmit = (query: string) => {
    const q = query?.trim() || '';
    setSearchQuery(q);
    updateSearchParams((sp) => {
      if (q) {
        sp.set('search', q);
      } else {
        sp.delete('search');
      }
    });
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
    updateSearchParams((sp) => {
      if (nextPage <= 1) {
        sp.delete('page');
      } else {
        sp.set('page', String(nextPage));
      }
    }, { resetPage: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== Product Actions =====
  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  // ===== FETCH CATEGORIES ON MOUNT =====
  useEffect(() => {
    let mounted = true;

    const runFetch = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams(location.search);

        // Build params for /api/v1/products: use sortBy & sortDirection
        const sortMapping: Record<string, { sortBy: string; sortDirection: 'asc' | 'desc' } | undefined> = {
          relevance: undefined,
          price_asc: { sortBy: 'price', sortDirection: 'asc' },
          price_desc: { sortBy: 'price', sortDirection: 'desc' },
          newest: { sortBy: 'createdAt', sortDirection: 'desc' },
        };
        const sortCfg = sortMapping[sortBy];

        const baseParams: any = { page: Math.max(0, page - 1), size: pageSize };
        if (sortCfg) {
          baseParams.sortBy = sortCfg.sortBy;
          baseParams.sortDirection = sortCfg.sortDirection;
        }
        if (inStockOnly) {
          baseParams.inStock = true;
        }
        // Map price filters to backend param names (prefer URL params for consistency)
        const minPriceParam = params.get('min_price');
        if (minPriceParam !== null && minPriceParam !== '') {
          const parsedMin = Number(minPriceParam);
          if (!Number.isNaN(parsedMin) && parsedMin > 0) {
            baseParams.minPrice = parsedMin;
          }
        } else if (filterState.min_price != null && filterState.min_price > 0) {
          baseParams.minPrice = filterState.min_price;
        }

        const maxPriceParam = params.get('max_price');
        if (maxPriceParam !== null && maxPriceParam !== '') {
          const parsedMax = Number(maxPriceParam);
          if (!Number.isNaN(parsedMax) && parsedMax >= 0) {
            baseParams.maxPrice = parsedMax;
          }
        } else if (filterState.max_price != null) {
          baseParams.maxPrice = filterState.max_price;
        }

        const brandParams = params.getAll('brand').filter(Boolean);
        const derivedBrands = brandParams.length > 0
          ? brandParams
          : (filterState.brands && filterState.brands.length > 0 ? filterState.brands : []);
        if (derivedBrands.length > 0) {
          baseParams['attr.brand'] = derivedBrands;
        }

        // Forward any attr.* query params from URL to backend to enable JSONB filtering
        params.forEach((value, key) => {
          if (key.startsWith('attr.')) {
            // If same key appears multiple times, keep all by turning into array
            if (baseParams[key] === undefined) {
              baseParams[key] = value;
            } else if (Array.isArray(baseParams[key])) {
              (baseParams[key] as any[]).push(value);
            } else {
              baseParams[key] = [baseParams[key], value];
            }
          }
        });
        // Determine active category and include as categoryIds for /products
        const _effectiveCategoryId = effectiveCategoryId;
        if (_effectiveCategoryId) baseParams.categoryIds = [_effectiveCategoryId];

        {
          // prefer URL `search` param when present so header searches navigate correctly
          const urlSearch = params.get('search') || '';
          const activeSearch = urlSearch && urlSearch.trim() !== '' ? urlSearch.trim() : (debouncedSearchQuery && debouncedSearchQuery.trim() !== '' ? debouncedSearchQuery.trim() : '');

          if (activeSearch) {
            const resp = await productService.getAllProducts({
              ...baseParams,
              search: activeSearch,
            } as any);
            if (!mounted) return;
            setProducts(reorderProductsByStockStatus(resp.content || []));
            const totalFromResponse = typeof resp.totalPages === 'number' && resp.totalPages > 0 ? resp.totalPages : undefined;
            const computedFromElements = typeof resp.totalElements === 'number' && resp.totalElements >= 0
              ? Math.max(1, Math.ceil(resp.totalElements / pageSize))
              : undefined;
            setTotalPages(totalFromResponse ?? computedFromElements ?? 1);
          } else {
            const resp = await productService.getAllProducts(baseParams);
            if (!mounted) return;
            setProducts(reorderProductsByStockStatus(resp.content || []));
            const totalFromResponse = typeof resp.totalPages === 'number' && resp.totalPages > 0 ? resp.totalPages : undefined;
            const computedFromElements = typeof resp.totalElements === 'number' && resp.totalElements >= 0
              ? Math.max(1, Math.ceil(resp.totalElements / pageSize))
              : undefined;
            setTotalPages(totalFromResponse ?? computedFromElements ?? 1);
          }
        }
      } catch (err) {
        console.error('Products fetch error:', err);
        if (!mounted) return;
        setError('Không thể tải sản phẩm. Vui lòng thử lại.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    runFetch();

    return () => { mounted = false; };
  }, [debouncedSearchQuery, location.search, sortBy, inStockOnly, page, pageSize, resolvedCategoryId]);



  // ===== RENDER =====
  useEffect(() => {
    if (isMdUp) {
      setMobileFiltersOpen(false);
    }
  }, [isMdUp]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            textAlign: 'center'
          }}
        >
          Sản Phẩm
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto' }}
        >
          Khám phá bộ sưu tập linh kiện máy tính chất lượng cao với giá cả cạnh tranh
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <ProductSearch
          value={searchQuery}
          onChange={handleSearchChange}
          onSearch={handleSearchSubmit}
          placeholder="Tìm kiếm sản phẩm..."
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
        {/* Filters Sidebar */}
        {isMdUp ? (
          <Box sx={{ width: 280, flexShrink: 0 }}>
            <ProductFilters
              filters={filterState}
              maxPrice={150000000}
              onFiltersChange={handleFiltersChange}
              onReset={() => setFilterState(createDefaultProductFilters())}
              categoryId={effectiveCategoryId ?? null}
              attributeDefs={attributeDefs ?? undefined}
            />
          </Box>
        ) : (
          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              fullWidth
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              sx={{ mb: 1 }}
            >
              {mobileFiltersOpen ? 'Ẩn bộ lọc' : 'Hiển thị bộ lọc'}
            </Button>
            <Collapse in={mobileFiltersOpen} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 1 }}>
                <ProductFilters
                  filters={filterState}
                  maxPrice={150000000}
                  onFiltersChange={handleFiltersChange}
                  onReset={() => {
                    setFilterState(createDefaultProductFilters());
                  }}
                  categoryId={effectiveCategoryId ?? null}
                  attributeDefs={attributeDefs ?? undefined}
                />
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Products Grid */}
        <Box sx={{ flex: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              {/* disableShrink avoids stroke-dasharray/dashoffset animations that block compositor */}
              <CircularProgress size={48} disableShrink />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="error" variant="h6" gutterBottom>
                {error}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{ mt: 2 }}
              >
                Thử lại
              </Button>
            </Box>
          ) : (
            <>
              {/* Controls row */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  mb: 2,
                  gap: { xs: 2, sm: 3 }
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Hiển thị {pageProducts.length} trên trang {page}
                  </Typography>
                </Box>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1.5, sm: 2 }}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  <FormControl size="small" sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}>
                    <InputLabel id="sort-label">Sắp xếp</InputLabel>
                    <Select labelId="sort-label" value={sortBy} label="Sắp xếp" onChange={handleSortChange}>
                      <MenuItem value="relevance">Phù hợp nhất</MenuItem>
                      <MenuItem value="price_asc">Giá: thấp → cao</MenuItem>
                      <MenuItem value="price_desc">Giá: cao → thấp</MenuItem>
                      <MenuItem value="newest">Hàng mới</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'center' } }}>
                    <ToggleButtonGroup
                      value={inStockOnly ? 'in_stock' : null}
                      exclusive
                      onChange={handleInStockToggle}
                      size="small"
                    >
                      <ToggleButton value="in_stock">Sẵn hàng</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Stack>
              </Box>

              {/* Products Grid */}
              <ProductGrid
                products={pageProducts}
                loading={loading}
                error={error || undefined}
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onProductClick={handleProductClick}
              />
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ProductsPage;
