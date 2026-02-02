/**
 * 🛍️ PRODUCT CARD TYPES - Computer Shop E-commerce
 * 
 * Simplified TypeScript definitions cho ProductCard component
 * Chỉ sử dụng backend ProductResponse data
 */

// Import backend types
import type { Product, Category } from '../../../types/product.types';
import type { SxProps, Theme } from '@mui/material';

// ===== COMPONENT PROPS =====
export interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  className?: string;
  sx?: SxProps<Theme>;
  imageAspectRatio?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
}

// ===== RE-EXPORT BACKEND TYPES WITH ALIASES =====
export type ProductCardProduct = Product;
export type ProductCardCategory = Category;
