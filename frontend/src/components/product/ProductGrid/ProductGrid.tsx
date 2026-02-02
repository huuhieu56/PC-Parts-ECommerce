/**
 * 📱 PRODUCT GRID COMPONENT - Computer Shop E-commerce
 *
 * Simple responsive product grid layout
 *
 * Features:
 *  - xs: repeat(2, minmax(0, 1fr))  (2 columns on mobile for denser catalog view)
 *  - sm: repeat(2, 1fr)  (2 columns on small screens)
 *  - md: repeat(3, 1fr)  (3 columns on medium screens)
 *  - lg: repeat(6, 1fr)  (6 columns on large screens for promotional grids)
 *  - xl: repeat(6, 1fr)  (6 columns on extra large screens)
 */

import React from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import RefreshIcon from '@mui/icons-material/Refresh';

// Components
import { ProductCard } from '../ProductCard';
import type { ProductCardProps } from '../ProductCard';

// Types
import type { Product } from '../../../types/product.types';

// ===== COMPONENT PROPS =====
export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  error?: string;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onProductClick?: (product: Product) => void;
  onRefresh?: () => void;
  emptyMessage?: string;
  className?: string;
  sx?: any;
  columns?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>>;
  productCardProps?: Omit<ProductCardProps, 'product'>;
  gridSx?: SxProps<Theme>;
}

const DEFAULT_COLUMNS: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'repeat(2, minmax(0, 1fr))',
  sm: 'repeat(2, 1fr)',
  md: 'repeat(3, 1fr)',
  lg: 'repeat(6, 1fr)',
  xl: 'repeat(6, 1fr)',
};

// ===== SKELETON COMPONENTS =====
const ProductCardSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" height={20} width="60%" />
      <Skeleton variant="text" height={24} width="100%" />
      <Skeleton variant="text" height={20} width="40%" />
      <Skeleton variant="rectangular" height={36} sx={{ mt: 2, borderRadius: 1 }} />
    </Box>
  </Box>
);

const GridSkeleton: React.FC<{ count: number; columns: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>> }> = ({ count, columns }) => (
  <Box
    sx={{
      display: 'grid',
      gap: { xs: 2, sm: 2.5, md: 3 },
      gridTemplateColumns: columns,
    }}
  >
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </Box>
);

// ===== EMPTY STATE COMPONENT =====
const EmptyState: React.FC<{ 
  message?: string; 
  onRefresh?: () => void; 
}> = ({ 
  message = "Không tìm thấy sản phẩm nào", 
  onRefresh 
}) => (
  <Box
    sx={{
      p: 6,
      textAlign: 'center',
      border: 1,
      borderColor: 'grey.300',
      borderRadius: 2,
      bgcolor: 'grey.50',
    }}
  >
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {message}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
    </Typography>
    {onRefresh && (
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
      >
        Tải lại
      </Button>
    )}
  </Box>
);

// ===== MAIN COMPONENT =====
export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  error,
  currentPage = 1,
  totalPages = 1,
  pageSize = 12,
  onPageChange,
  onProductClick,
  onRefresh,
  emptyMessage,
  className,
  sx,
  columns,
  productCardProps,
  gridSx,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const gridColumns = columns ?? DEFAULT_COLUMNS;
  const baseGridStyles: SxProps<Theme> = {
    display: 'grid',
    gap: { xs: 2, sm: 2.5, md: 3 },
    gridTemplateColumns: gridColumns,
  };
  const combinedGridSx: SxProps<Theme> = gridSx
    ? [
        baseGridStyles,
        ...(Array.isArray(gridSx) ? gridSx : [gridSx]),
      ]
    : baseGridStyles;

  // ===== HANDLERS =====
  

  const handleRetry = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  // ===== RENDER FUNCTIONS =====
  const renderProductGrid = () => (
    <Box sx={combinedGridSx}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          {...(productCardProps ?? {})}
          onProductClick={onProductClick ?? productCardProps?.onProductClick}
        />
      ))}
    </Box>
  );

  const renderPagination = () => {
    if (!onPageChange || totalPages <= 1) return null;

    const pageButtons: (number | 'gap')[] = [];

    // push n-1, n, n+1 where valid
    if (currentPage - 1 >= 1) pageButtons.push(currentPage - 1);
    pageButtons.push(currentPage);
    if (currentPage + 1 <= totalPages) pageButtons.push(currentPage + 1);

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          mt: 4,
          mb: 2,
          flexWrap: 'wrap'
        }}
      >
        <Button
          variant="outlined"
          size={isMobile ? 'small' : 'medium'}
          startIcon={<FirstPageIcon />}
          onClick={() => onPageChange && onPageChange(1)}
          disabled={loading || currentPage === 1}
          aria-label="first-page"
        />

        <Button
          variant="outlined"
          size={isMobile ? 'small' : 'medium'}
          startIcon={<NavigateBeforeIcon />}
          onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
          disabled={loading || currentPage <= 1}
          aria-label="prev-page"
        />

        {pageButtons.map((p) => (
          typeof p === 'number' ? (
            <Button
              key={`page-${p}`}
              variant={p === currentPage ? 'contained' : 'outlined'}
              color={p === currentPage ? 'primary' : 'inherit'}
              size={isMobile ? 'small' : 'medium'}
              onClick={() => onPageChange && onPageChange(p)}
              disabled={loading}
            >
              {p}
            </Button>
          ) : null
        ))}

        <Button
          variant="outlined"
          size={isMobile ? 'small' : 'medium'}
          endIcon={<NavigateNextIcon />}
          onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={loading || currentPage >= totalPages}
          aria-label="next-page"
        />

        <Button
          variant="outlined"
          size={isMobile ? 'small' : 'medium'}
          endIcon={<LastPageIcon />}
          onClick={() => onPageChange && onPageChange(totalPages)}
          disabled={loading || currentPage === totalPages}
          aria-label="last-page"
        />
      </Box>
    );
  };

  // ===== MAIN RENDER =====
  return (
    <Box className={className} sx={sx}>
      {/* Error State */}
      {error && (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            border: 1,
            borderColor: 'error.main',
            borderRadius: 2,
            bgcolor: 'error.50',
            mb: 3,
          }}
        >
          <Typography color="error.main" gutterBottom fontWeight={600}>
            Có lỗi xảy ra
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RefreshIcon />}
            onClick={handleRetry}
          >
            Thử lại
          </Button>
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <GridSkeleton count={pageSize} columns={gridColumns} />
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <EmptyState 
          message={emptyMessage}
          onRefresh={onRefresh}
        />
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && renderProductGrid()}

      {/* Pagination */}
      {renderPagination()}
    </Box>
  );
};

export default ProductGrid;
