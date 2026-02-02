/**
 * 🏠 HOME PAGE - Computer Shop E-commerce
 * 
 * Trang chủ hiển thị:
 * - Hero section với banner quảng cáo
 * - Categories nổi bật (CPU, VGA, RAM, etc.)
 * - Sản phẩm bán chạy
 * - Sản phẩm mới
 * - Khuyến mãi đặc biệt
 * 
 * Tuân thủ SYSTEM_DESIGN.md specification
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Skeleton,
  useTheme,
  Chip,
  Grid,
  Paper,
  alpha,
  IconButton,
} from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import BoltIcon from '@mui/icons-material/Bolt';
import VerifiedIcon from '@mui/icons-material/Verified';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SavingsIcon from '@mui/icons-material/Savings';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// Components
import { ProductGrid } from '../../components/product/ProductGrid';
import { ProductSearch } from '../../components/product/ProductSearch';

import { productService } from '../../services/product.service';


import type { Product } from '../../types/product.types';

type HeroMetric = {
  label: string;
  value: string;
};

type ServiceFeature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

type CategoryRowConfig = {
  id: number;
  title: string;
  subtitle: string;
  accentColor: string;
  icon: React.ElementType;
};

type CategoryShowcaseRow = CategoryRowConfig & {
  products: Product[];
  categoryName: string;
};

const CATEGORY_ROW_CONFIGS: CategoryRowConfig[] = [
  {
    id: 1,
    title: 'CPU hiệu năng cực đỉnh',
    subtitle: 'Intel Core Ultra, Ryzen 9000 tối ưu gaming và render.',
    accentColor: '#FF6B6B',
    icon: ComputerIcon,
  },
  {
    id: 2,
    title: 'GPU khủng cho 4K & AI',
    subtitle: 'NVIDIA RTX 50 series, Radeon RX 8000 sẵn hàng.',
    accentColor: '#8B5CF6',
    icon: BoltIcon,
  },
  {
    id: 3,
    title: 'RAM DDR5 tốc độ 8400MHz',
    subtitle: 'Tối ưu đa nhiệm, bật XMP chỉ một chạm.',
    accentColor: '#0EA5E9',
    icon: MemoryIcon,
  },
  {
    id: 4,
    title: 'Mainboard gaming PCIe 5.0',
    subtitle: 'Z890, X870E với VRM mạnh mẽ cho OC.',
    accentColor: '#F97316',
    icon: ComputerIcon,
  },
  {
    id: 5,
    title: 'SSD NVMe Gen5 14GB/s',
    subtitle: 'Tăng tốc load game, dựng phim 8K.',
    accentColor: '#22C55E',
    icon: StorageIcon,
  },
];

const CATEGORY_SLIDE_SIZE = 6;
const CATEGORY_TOTAL_SLIDES = 3;
const CATEGORY_FETCH_SIZE = CATEGORY_SLIDE_SIZE * CATEGORY_TOTAL_SLIDES;
const CATEGORY_FETCH_BATCH_SIZE = CATEGORY_FETCH_SIZE;
const CATEGORY_MAX_PAGE_ATTEMPTS = Math.max(3, Math.ceil(CATEGORY_FETCH_SIZE / CATEGORY_SLIDE_SIZE) + 2);
const CATEGORY_ROWS_COUNT = CATEGORY_ROW_CONFIGS.length;
const CATEGORY_CAROUSEL_INTERVAL = 2000;
const CATEGORY_SLIDE_COLUMNS_FIXED = {
  xs: 'repeat(2, 190px)',
  sm: 'repeat(2, 200px)',
  md: 'repeat(3, 220px)',
  lg: 'repeat(6, 220px)',
  xl: 'repeat(6, 220px)',
} as const;
const CATEGORY_GRID_ALIGNMENT = {
  justifyContent: { xs: 'center', md: 'center', lg: 'space-between' },
  justifyItems: 'center',
} as const;
const CATEGORY_CARD_DIMENSIONS = {
  width: 220,
  height: 360,
} as const;

const chunkArray = <T,>(items: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks.length > 0 ? chunks : [items];
};

const filterDisplayableProducts = (items: Product[]): Product[] => {
  if (!items?.length) return [];
  const activeProducts = items.filter((product) => product.is_active !== false);
  if (activeProducts.length >= CATEGORY_SLIDE_SIZE) {
    return activeProducts;
  }
  // Không đủ sản phẩm active -> fallback hiển thị cả danh sách thay vì để thiếu slot
  return items.filter((product): product is Product => Boolean(product));
};

const fetchCategoryProductsWithPagination = async (categoryId: number): Promise<Product[]> => {
  const uniqueProducts = new Map<number, Product>();
  let page = 0;
  let attempts = 0;
  let shouldContinue = true;

  while (shouldContinue && uniqueProducts.size < CATEGORY_FETCH_SIZE && attempts < CATEGORY_MAX_PAGE_ATTEMPTS) {
    const response = await productService.getProductsByCategory(categoryId, {
      page,
      size: CATEGORY_FETCH_BATCH_SIZE,
      sort: 'updated_at,desc',
    });

    const filteredBatch = filterDisplayableProducts(response.content || []);
    filteredBatch.forEach((product) => {
      if (!uniqueProducts.has(product.id)) {
        uniqueProducts.set(product.id, product);
      }
    });

    const received = response.content?.length ?? 0;
    const actualPageSize = response.pageSize ?? received;
    const needMoreProducts = uniqueProducts.size < CATEGORY_FETCH_SIZE;
    const hasServerMore = response.hasNext || (response.totalPages > response.pageNumber + 1);
    const moreByTotals = response.totalElements > uniqueProducts.size;
    const serverCapped = actualPageSize > 0 && actualPageSize < CATEGORY_FETCH_BATCH_SIZE;
    const receivedNothing = received === 0;

    shouldContinue = !receivedNothing && needMoreProducts && (hasServerMore || moreByTotals || serverCapped);

    page += 1;
    attempts += 1;
  }

  return Array.from(uniqueProducts.values()).slice(0, CATEGORY_FETCH_SIZE);
};

const HERO_METRICS: HeroMetric[] = [
  { label: 'Sản phẩm chính hãng', value: '2.500+' },
  { label: 'Khách hàng hài lòng', value: '18.000+' },
  { label: 'Đơn hàng mỗi tháng', value: '3.500+' },
];

const SERVICE_FEATURES: ServiceFeature[] = [
  {
    icon: LocalShippingIcon,
    title: 'Giao hàng toàn quốc',
    description: 'Đóng gói an toàn, giao siêu tốc chỉ trong 24-48h tại các thành phố lớn.',
  },
  {
    icon: SupportAgentIcon,
    title: 'Kỹ thuật 24/7',
    description: 'Đội ngũ kỹ sư tư vấn cấu hình, giải đáp mọi thắc mắc miễn phí.',
  },
  {
    icon: VerifiedIcon,
    title: 'Sản phẩm chính hãng',
    description: '100% linh kiện nhập khẩu chính hãng, bảo hành tiêu chuẩn hãng.',
  },
  {
    icon: SavingsIcon,
    title: 'Giá tốt & ưu đãi',
    description: 'Chương trình khuyến mãi hấp dẫn, tích điểm đổi quà cho khách thân thiết.',
  },
];

export const HomePage: React.FC = () => {
  const theme = useTheme();
  // Fixed set of images for the Build PC hero carousel (hardcoded as requested)
  const FIXED_BUILD_PC_IMAGES = [
    'https://ducanhpc.com/wp-content/uploads/2021/05/Ducanhpc-case-may-tinh-1-scaled.jpg',
    'https://nguyencongpc.vn/media/news/3781-vga-bundle-may-2025-2000x1000px-01.jpg',
    'https://songphuong.vn/Content/uploads/2025/09/Chuong-trinh-khuyen-mai-Card-do-hoa-Asus-2.webp',
    'https://tanthanhdanh.vn/wp-content/uploads/2025/11/activity_PBA-800x440-1-727x400.png',
  ];
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((previous) => (previous + 1) % FIXED_BUILD_PC_IMAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryProductsMap, setCategoryProductsMap] = useState<Record<number, Product[]>>({});
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryErrors, setCategoryErrors] = useState<Record<number, string | null>>(() =>
    CATEGORY_ROW_CONFIGS.reduce<Record<number, string | null>>((acc, config) => {
      acc[config.id] = null;
      return acc;
    }, {})
  );
  const [categorySlideIndex, setCategorySlideIndex] = useState<Record<number, number>>(() =>
    CATEGORY_ROW_CONFIGS.reduce<Record<number, number>>((acc, config) => {
      acc[config.id] = 0;
      return acc;
    }, {})
  );

  useEffect(() => {
    let isMounted = true;

    const loadCategoryRows = async () => {
      setCategoryLoading(true);
      const nextErrors: Record<number, string | null> = {};
      try {
        const results = await Promise.all(
          CATEGORY_ROW_CONFIGS.map(async (config) => {
            try {
              const products = await fetchCategoryProductsWithPagination(config.id);
              return { id: config.id, products, error: null as string | null };
            } catch (error) {
              console.error(`Lỗi lấy sản phẩm cho danh mục ${config.id}:`, error);
              return { id: config.id, products: [], error: 'Không thể tải sản phẩm.' };
            }
          })
        );

        if (!isMounted) return;

        const nextMap: Record<number, Product[]> = {};
        results.forEach(({ id, products, error }) => {
          nextMap[id] = products;
          if (error) {
            nextErrors[id] = error;
          } else if (products.length < CATEGORY_SLIDE_SIZE) {
            nextErrors[id] = 'Danh mục này chưa đủ 6 sản phẩm active để hiển thị carousel.';
          } else {
            nextErrors[id] = null;
          }
        });

        setCategoryProductsMap(nextMap);
        setCategoryErrors((prev) => ({ ...prev, ...nextErrors }));
      } catch (error) {
        console.error('Lỗi tải danh sách danh mục hot:', error);
        CATEGORY_ROW_CONFIGS.forEach((config) => {
          nextErrors[config.id] = 'Không thể tải sản phẩm.';
        });
        if (isMounted) {
          setCategoryErrors((prev) => ({ ...prev, ...nextErrors }));
        }
      } finally {
        if (isMounted) {
          setCategoryLoading(false);
        }
      }
    };

    void loadCategoryRows();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (query: string) => {
    const q = query?.trim() || '';
    setSearchQuery(q);
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/products');
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    if (categoryId && Number(categoryId) > 0) {
      navigate(`/products?category=${categoryId}`);
    } else {
      navigate('/products');
    }
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  const categoryShowcaseRows = useMemo<CategoryShowcaseRow[]>(() =>
    CATEGORY_ROW_CONFIGS.map((config) => {
      const products = categoryProductsMap[config.id] ?? [];
      const categoryName = products[0]?.category?.name || `Danh mục #${config.id}`;
      return {
        ...config,
        products,
        categoryName,
      };
    }),
  [categoryProductsMap]
  );

  useEffect(() => {
    setCategorySlideIndex((prev) => {
      const next = { ...prev };
      categoryShowcaseRows.forEach((row) => {
        const productCount = row.products.length ?? 0;
        const slidesCount = productCount < CATEGORY_SLIDE_SIZE
          ? 0
          : Math.min(
              CATEGORY_TOTAL_SLIDES,
              Math.ceil(productCount / CATEGORY_SLIDE_SIZE),
            );
        if (slidesCount <= 1) {
          next[row.id] = 0;
          return;
        }
        const current = prev[row.id] ?? 0;
        next[row.id] = Math.min(current, slidesCount - 1);
      });
      return next;
    });
  }, [categoryShowcaseRows]);

  useEffect(() => {
    if (categoryShowcaseRows.length === 0) return undefined;
    const interval = setInterval(() => {
      setCategorySlideIndex((prev) => {
        const updated = { ...prev };
        categoryShowcaseRows.forEach((row) => {
          const productCount = row.products.length ?? 0;
          const slidesCount = productCount < CATEGORY_SLIDE_SIZE
            ? 0
            : Math.min(
                CATEGORY_TOTAL_SLIDES,
                Math.ceil(productCount / CATEGORY_SLIDE_SIZE),
              );
          if (slidesCount <= 1) {
            updated[row.id] = 0;
            return;
          }
          const current = updated[row.id] ?? 0;
          updated[row.id] = (current + 1) % slidesCount;
        });
        return updated;
      });
    }, CATEGORY_CAROUSEL_INTERVAL);

    return () => clearInterval(interval);
  }, [categoryShowcaseRows]);

  const handleCarouselNavigation = (categoryId: number, direction: 'prev' | 'next', slidesCount: number) => {
    if (slidesCount <= 1) return;
    setCategorySlideIndex((prev) => {
      const current = prev[categoryId] ?? 0;
      const nextIndex = direction === 'next'
        ? (current + 1) % slidesCount
        : (current - 1 + slidesCount) % slidesCount;
      return { ...prev, [categoryId]: nextIndex };
    });
  };

  const renderHeroSection = () => (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 9, md: 12 },
        pb: { xs: 10, md: 14 },
        mb: { xs: 6, md: 8 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 5% 15%, ${alpha(theme.palette.primary.light, 0.4)} 0%, transparent 45%), radial-gradient(circle at 90% 10%, ${alpha(theme.palette.secondary.main, 0.25)} 0%, transparent 45%), linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.92)}, ${alpha(theme.palette.primary.light, 0.15)})`,
          zIndex: 0,
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 6, md: 4 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Chip
              icon={<BoltIcon fontSize="small" />}
              label="Ưu đãi linh kiện tháng này"
              color="secondary"
              variant="outlined"
              sx={{
                mb: 3,
                px: 2,
                py: 1,
                fontWeight: 600,
                borderColor: alpha(theme.palette.secondary.main, 0.45),
                bgcolor: alpha(theme.palette.secondary.light, 0.2),
              }}
            />
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 800, lineHeight: 1.1, mb: 2 }}
            >
              Xây dựng dàn PC đỉnh cao cho mọi nhu cầu
            </Typography>
            <Typography
              variant="h6"
              paragraph
              sx={{ color: 'text.secondary', maxWidth: 520, mb: 4 }}
            >
              Khám phá kho linh kiện chính hãng với cấu hình tối ưu cho Gaming, Designer, Streaming và Doanh nghiệp.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 2, sm: 2.5 }}
              sx={{ mb: 5, alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => handleCategoryClick(0)}
                sx={{ px: 4, py: 1.4, fontWeight: 700 }}
              >
                Xem sản phẩm
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() => navigate('/build-pc')}
                sx={{
                  px: 4,
                  py: 1.35,
                  fontWeight: 700,
                  borderWidth: 2,
                  borderColor: alpha(theme.palette.secondary.main, 0.5),
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                  },
                }}
              >
                Bắt đầu Build PC
              </Button>
            </Stack>
            <Grid container spacing={2}>
              {HERO_METRICS.map((metric) => (
                <Grid size={{ xs: 12, sm: 4 }} key={metric.label}>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {metric.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Chip size="small" color="primary" label="Ưu đãi build PC" sx={{ fontWeight: 600 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    Giảm đến 5.000.000đ + vệ sinh trọn đời cho combo full-case
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 3 }}>
                  {(() => {
                    const slideCount = FIXED_BUILD_PC_IMAGES.length;
                    const clampIndex = slideCount > 0 ? heroImageIndex % slideCount : 0;
                    const translatePercent = slideCount > 0 ? (clampIndex * 100) / slideCount : 0;
                    const slideWidthPercent = slideCount > 0 ? 100 / slideCount : 100;

                    return (
                      <Box
                        sx={{
                          display: 'flex',
                          width: `${Math.max(slideCount, 1) * 100}%`,
                          transform: `translateX(-${translatePercent}%)`,
                          transition: 'transform 750ms cubic-bezier(.4,0,.2,1)',
                        }}
                      >
                        {FIXED_BUILD_PC_IMAGES.map((imageUrl, idx) => (
                          <Box
                            key={`hero-slide-${imageUrl}-${idx}`}
                            sx={{
                              minWidth: `${slideWidthPercent}%`,
                              flex: `0 0 ${slideWidthPercent}%`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: alpha('#000', 0.85),
                              borderRadius: 3,
                            }}
                          >
                            <Box
                              component="img"
                              src={imageUrl}
                              alt={`Build PC showcase ${idx + 1}`}
                              loading="lazy"
                              sx={{
                                width: '100%',
                                aspectRatio: '16 / 9',
                                objectFit: 'contain',
                                borderRadius: 3,
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    );
                  })()}

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)' }}
                  >
                    {FIXED_BUILD_PC_IMAGES.map((_, idx) => (
                      <Box
                        key={`hero-dot-${idx}`}
                        sx={{
                          width: idx === heroImageIndex ? 30 : 12,
                          height: 8,
                          bgcolor: idx === heroImageIndex ? theme.palette.primary.main : alpha('#fff', 0.7),
                          borderRadius: 999,
                          transition: 'all 220ms ease',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setHeroImageIndex(idx);
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );

  const renderServiceHighlights = () => (
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 } }}>
      <Grid container spacing={3}>
        {SERVICE_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={feature.title}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: '100%',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 28px 60px rgba(15, 23, 42, 0.18)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }}
                >
                  <Icon fontSize="medium" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );

  const renderSearchSection = () => (
    <Container maxWidth="md" sx={{ mb: { xs: 6, md: 8 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.1)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <ProductSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Tìm kiếm CPU, VGA, RAM, SSD..."
        />
      </Paper>
    </Container>
  );

  const renderCategoryShowcase = () => {
    const hasLoadedProducts = categoryShowcaseRows.some((row) => row.products.length > 0);
    const isLoadingPlaceholder = categoryLoading && !hasLoadedProducts;
    const placeholderRows = Array.from({ length: CATEGORY_ROWS_COUNT });

    return (
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            sx={{ mb: { xs: 4, md: 5 } }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Bảng xếp hạng linh kiện hot theo danh mục
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => navigate('/products')}>
              Xem toàn bộ kho linh kiện
            </Button>
          </Stack>

          {isLoadingPlaceholder ? (
            <Stack spacing={3}>
              {placeholderRows.map((_, idx) => (
                <Skeleton key={`category-row-skeleton-${idx}`} variant="rectangular" height={260} sx={{ borderRadius: 4 }} />
              ))}
            </Stack>
          ) : (
            <Stack spacing={{ xs: 4, md: 5 }}>
              {categoryShowcaseRows.map((row) => {
                const products = row.products.slice(0, CATEGORY_FETCH_SIZE);
                const hasMinimumProducts = products.length >= CATEGORY_SLIDE_SIZE;
                const slides = hasMinimumProducts ? chunkArray(products, CATEGORY_SLIDE_SIZE) : [];
                const slidesCount = slides.length;
                const activeIndex = categorySlideIndex[row.id] ?? 0;
                const IconComponent = row.icon;
                const rowError = categoryErrors[row.id];
                const hasProducts = slidesCount > 0;

                return (
                  <Paper
                    key={`category-showcase-${row.id}`}
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: 4,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                      boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
                      position: 'relative',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={{ xs: 2, md: 3 }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      sx={{ mb: 3 }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(row.accentColor, 0.15),
                            color: row.accentColor,
                          }}
                        >
                          <IconComponent />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', color: row.accentColor, fontWeight: 700 }}>
                            {row.categoryName}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                            {row.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {row.subtitle}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button variant="contained" color="primary" onClick={() => handleCategoryClick(row.id)}>
                        Xem tất cả {row.categoryName}
                      </Button>
                    </Stack>

                    {!hasProducts ? (
                      <Box sx={{ p: 3, borderRadius: 3, border: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}` }}>
                        <Typography variant="body2" color="text.secondary">
                          {rowError || (hasMinimumProducts
                            ? 'Danh mục này hiện chưa có sản phẩm khả dụng.'
                            : 'Cần tối thiểu 6 sản phẩm để hiển thị carousel. Vui lòng bổ sung thêm sản phẩm cho danh mục này.')}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 0,
                              transform: `translateX(-${activeIndex * 100}%)`,
                              transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            {slides.map((slideProducts, slideIdx) => (
                              <Box key={`category-${row.id}-slide-${slideIdx}`} sx={{ minWidth: '100%', flexShrink: 0 }}>
                                <ProductGrid
                                  products={slideProducts}
                                  loading={false}
                                  error={undefined}
                                  columns={CATEGORY_SLIDE_COLUMNS_FIXED}
                                  gridSx={CATEGORY_GRID_ALIGNMENT}
                                  productCardProps={{
                                    imageAspectRatio: '4 / 3',
                                    dimensions: CATEGORY_CARD_DIMENSIONS,
                                  }}
                                  onProductClick={handleProductClick}
                                  pageSize={slideProducts.length}
                                  sx={{
                                    '& > .MuiBox-root': {
                                      alignItems: 'stretch',
                                    },
                                  }}
                                />
                              </Box>
                            ))}
                          </Box>

                          {slidesCount > 1 && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleCarouselNavigation(row.id, 'prev', slidesCount)}
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: { xs: 4, md: 12 },
                                  transform: 'translateY(-50%)',
                                  bgcolor: 'background.paper',
                                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)',
                                  '&:hover': { bgcolor: 'background.paper' },
                                }}
                                aria-label={`Xem sản phẩm trước của ${row.categoryName}`}
                              >
                                <NavigateBeforeIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleCarouselNavigation(row.id, 'next', slidesCount)}
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  right: { xs: 4, md: 12 },
                                  transform: 'translateY(-50%)',
                                  bgcolor: 'background.paper',
                                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)',
                                  '&:hover': { bgcolor: 'background.paper' },
                                }}
                                aria-label={`Xem sản phẩm tiếp theo của ${row.categoryName}`}
                              >
                                <NavigateNextIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>

                        {slidesCount > 1 && (
                          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
                            {Array.from({ length: slidesCount }).map((_, dotIdx) => (
                              <Box
                                key={`category-${row.id}-dot-${dotIdx}`}
                                sx={{
                                  width: dotIdx === activeIndex ? 28 : 10,
                                  height: 8,
                                  borderRadius: 999,
                                  transition: 'all 220ms ease',
                                  bgcolor: dotIdx === activeIndex ? row.accentColor : alpha(row.accentColor, 0.3),
                                }}
                              />
                            ))}
                          </Stack>
                        )}
                      </>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Container>
      </Box>
    );
  };

  const renderPromoBanner = () => (
    <Container maxWidth="lg" sx={{ mb: { xs: 8, md: 12 } }}>
      <Card
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          color: 'white',
          background: `linear-gradient(120deg, ${alpha(theme.palette.primary.dark, 0.92)}, ${alpha(theme.palette.secondary.main, 0.85)})`,
          boxShadow: '0 32px 70px rgba(15, 23, 42, 0.25)',
        }}
      >
        <CardContent
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: { xs: 3, md: 6 },
            py: { xs: 5, md: 6 },
            px: { xs: 4, md: 6 },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 2, fontWeight: 700 }}>
              Chương trình khuyến mãi
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
              Giảm 15% cho phụ kiện khi build PC trọn bộ
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 520 }}>
              Áp dụng cho đơn hàng đặt trước 31/05. Tặng thêm quạt ARGB và vệ sinh máy miễn phí trong 12 tháng.
            </Typography>
          </Box>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate('/products?tag=promotion')}
              sx={{ px: 4 }}
            >
              Săn ưu đãi
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              onClick={() => navigate('/policies/warranty')}
              sx={{
                px: 4,
                borderColor: 'rgba(255,255,255,0.6)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              Xem chính sách bảo hành
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );

  return (
    <Box>
      {renderHeroSection()}
      {renderServiceHighlights()}
      {renderSearchSection()}
      {renderCategoryShowcase()}
      {renderPromoBanner()}
    </Box>
  );
};

export default HomePage;
