/**
 * 🛍️ PRODUCT CARD COMPONENT - Computer Shop E-commerce
 * 
 * Simplified ProductCard sử dụng chỉ backend ProductResponse data
 * Tuân thủ SYSTEM_DESIGN.md và backend DTOs
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
// Import icons from their individual entry points to avoid pulling the entire icon bundle
import VisibilityIcon from '@mui/icons-material/Visibility';

// Types - chỉ sử dụng backend Product
import type { Product } from '../../../types/product.types';
import { buildImageUrl } from '../../../utils/urlHelpers';
import type { ProductCardProps } from './ProductCard.types';

// ===== HELPER FUNCTIONS =====
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const getImageUrl = (product: Product): string => {
  const placeholder = '/images/products/placeholder.jpg';
  const primary = product.images?.find((image) => (image as any).is_primary || (image as any).isPrimary);
  const path =
    primary?.file_path ||
    (primary as any)?.filePath ||
    product.image_url ||
    (product as any)?.imageUrl ||
    null;
  const built = buildImageUrl(path);
  return built || placeholder;
};

// Optional image resize helper: for image hosts that accept width query param (e.g., ?w=300)
const buildResizedImage = (url: string, width: number) => {
  try {
    const u = new URL(url, window.location.origin);
    // Only append for same-origin or common CDN patterns; conservative check: hostname contains 'cdn' or same host
    if (u.hostname === window.location.hostname || u.hostname.includes('cdn') || u.hostname.includes('images')) {
      u.searchParams.set('w', String(Math.round(width)));
      return u.toString();
    }
  } catch (e) {
    // ignore
  }
  return url;
};

const getStockStatus = (product: Product) => {
  const quantity = product.quantity ?? 0;
  if (quantity <= 0 || product.is_active === false) {
    return { status: 'out_of_stock', color: 'error', text: 'Hết hàng' };
  }
  return { status: 'in_stock', color: 'success', text: 'Còn hàng' };
};

const CARD_HEIGHT = {
  xs: 340,
  sm: 360,
  md: 380,
  lg: 420,
} as const;

const DEFAULT_CARD_WIDTH = '100%';

const buildFixedWidthStyles = (width?: number) => {
  if (typeof width !== 'number' || Number.isNaN(width) || width <= 0) {
    return DEFAULT_CARD_WIDTH;
  }
  return {
    xs: '100%',
    sm: `${width}px`,
    md: `${width}px`,
    lg: `${width}px`,
    xl: `${width}px`,
  } as const;
};

const resolveHeightValue = (heightSetting: typeof CARD_HEIGHT | number, breakpoint: keyof typeof CARD_HEIGHT) => {
  if (typeof heightSetting === 'number') {
    return heightSetting;
  }
  return heightSetting[breakpoint] ?? CARD_HEIGHT[breakpoint];
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getAspectRatioValue = (ratioText: string): number | null => {
  if (!ratioText?.includes('/')) return null;
  const [widthPart, heightPart] = ratioText.split('/').map((part) => Number(part.trim()));
  if (!Number.isFinite(widthPart) || !Number.isFinite(heightPart) || widthPart <= 0 || heightPart <= 0) {
    return null;
  }
  return heightPart / widthPart;
};

// ===== MAIN COMPONENT =====
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onProductClick,
  className,
  sx,
  imageAspectRatio = '4 / 3',
  dimensions,
}) => {
  const stockInfo = getStockStatus(product);
  const requestedImageRatio = getAspectRatioValue(imageAspectRatio);
  const imageSectionRatio = clamp(requestedImageRatio ?? 0.58, 0.48, 0.65);
  const fixedWidthValue = typeof dimensions?.width === 'number' && dimensions.width > 0 ? dimensions.width : undefined;
  const fixedHeightValue = typeof dimensions?.height === 'number' && dimensions.height > 0 ? dimensions.height : undefined;
  const hasFixedWidth = typeof fixedWidthValue === 'number';
  const hasFixedHeight = typeof fixedHeightValue === 'number';
  const cardWidthStyles = hasFixedWidth ? buildFixedWidthStyles(fixedWidthValue) : DEFAULT_CARD_WIDTH;
  const cardHeightValue = fixedHeightValue ?? 'auto';
  const imageHeightSource = fixedHeightValue ?? CARD_HEIGHT;
  const imageHeights = {
    xs: Math.round(resolveHeightValue(imageHeightSource, 'xs') * imageSectionRatio),
    sm: Math.round(resolveHeightValue(imageHeightSource, 'sm') * imageSectionRatio),
    md: Math.round(resolveHeightValue(imageHeightSource, 'md') * imageSectionRatio),
    lg: Math.round(resolveHeightValue(imageHeightSource, 'lg') * imageSectionRatio),
  } as const;
  const imageUrl = buildResizedImage(getImageUrl(product), 260);
  
  // ===== HANDLERS =====
  
  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };
  
  const handleQuickView = (event: React.MouseEvent) => {
    event.stopPropagation(); // Ngăn event bubbling
    if (onQuickView) {
      onQuickView(product);
    }
  };
  
  // Quantity controls removed from grid cards; quantity adjusted in Cart page
  
  // ===== RENDER =====
  return (
    <Card
      className={className}
      onClick={handleProductClick}
      sx={{
        width: cardWidthStyles,
        ...(hasFixedWidth && {
          maxWidth: cardWidthStyles,
          minWidth: cardWidthStyles,
        }),
        height: cardHeightValue,
        ...(hasFixedHeight && {
          minHeight: cardHeightValue,
          maxHeight: cardHeightValue,
        }),
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: 'transform 220ms ease, box-shadow 220ms ease',
        cursor: onProductClick ? 'pointer' : 'default',
        borderRadius: 3,
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
        backgroundColor: 'background.paper',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)',
        },
        opacity: product.is_active ? 1 : 0.6,
        ...sx,
      }}
    >
      {/* Product Image */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: imageHeights,
          minHeight: imageHeights,
          maxHeight: imageHeights,
          overflow: 'hidden',
          bgcolor: 'grey.100',
          borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& img': {
            transition: 'transform 220ms ease',
          },
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            p: 0,
          }}
        />

        <Chip
          label={stockInfo.text}
          color={stockInfo.color as any}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: '0.75rem',
            fontWeight: 600,
            backdropFilter: 'blur(6px)',
          }}
        />

        {onQuickView && (
          <IconButton
            onClick={handleQuickView}
            aria-label="Xem nhanh"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'white',
              },
            }}
            size="small"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Product Content */}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: 1,
          px: { xs: 2, md: 2.5 },
          pt: 2,
          pb: 2.5,
        }}
      >
        {/* Category */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}
        >
          {product.category.name}
        </Typography>

        {/* Product Name */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: { xs: 40, md: 44 },
          }}
        >
          {product.name}
        </Typography>

        {/* Key Specifications */}
        {product.specifications?.brand && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            Thương hiệu: {product.specifications.brand}
          </Typography>
        )}

        {/* Price */}
        <Typography
          variant="h6"
          color="primary"
          sx={{
            fontWeight: 700,
            fontSize: '1.2rem',
            mt: 'auto',
          }}
        >
          {formatPrice(product.price)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default React.memo(ProductCard);
