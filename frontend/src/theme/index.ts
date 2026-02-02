/**
 * 🎨 THEME SYSTEM - Computer Shop E-commerce
 * 
 * Professional theme system inspired by successful computer shops:
 * - GearVN: Blue trust theme with clear product hierarchy
 * - PhongVu: Clean professional appearance
 * - Material Design 3.0: Modern, accessible components
 * 
 * Features:
 * - Custom color palette optimized for computer products
 * - Typography system designed for product information
 * - Component overrides for consistent e-commerce experience
 * - Responsive design tokens
 * - Computer shop specific styling utilities
 */

import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { colors } from './colors';
import { typography, shopTypography } from './typography';
import { components } from './components';

// ===== BASE THEME CONFIGURATION =====
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.common.white,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.common.white,
    },
    error: {
      main: colors.error.main,
      light: colors.error.light,
      dark: colors.error.dark,
      contrastText: colors.common.white,
    },
    warning: {
      main: colors.warning.main,
      light: colors.warning.light,
      dark: colors.warning.dark,
      contrastText: colors.common.white,
    },
    info: {
      main: colors.info.main,
      light: colors.info.light,
      dark: colors.info.dark,
      contrastText: colors.common.white,
    },
    success: {
      main: colors.success.main,
      light: colors.success.light,
      dark: colors.success.dark,
      contrastText: colors.common.white,
    },
    grey: colors.grey,
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    divider: colors.divider,
    common: colors.common,
  },
  
  // Typography system
  typography,
  
  // Responsive breakpoints (optimized for e-commerce)
  breakpoints: {
    values: {
      xs: 0,      // Mobile portrait
      sm: 600,    // Mobile landscape
      md: 900,    // Tablet portrait  
      lg: 1200,   // Desktop (reduced from 1280 for better product grid)
      xl: 1536,   // Large desktop (updated to modern standards)
    },
  },
  
  // Spacing system (8px base)
  spacing: 8,
  
  // Shape system
  shape: {
    borderRadius: 8,
  },
  
  // Enhanced shadow system for product cards
  // Ensure we provide 25 shadow levels (0..24) because some MUI components use high elevations (e.g. Dialog uses 24)
  shadows: (() => {
    const s = [
      'none',
      '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
      '0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)',
      '0px 10px 20px rgba(0, 0, 0, 0.19), 0px 6px 6px rgba(0, 0, 0, 0.23)',
      '0px 14px 28px rgba(0, 0, 0, 0.25), 0px 10px 10px rgba(0, 0, 0, 0.22)',
      '0px 19px 38px rgba(0, 0, 0, 0.30), 0px 15px 12px rgba(0, 0, 0, 0.22)',
      '0px 24px 48px rgba(0, 0, 0, 0.35), 0px 19px 19px rgba(0, 0, 0, 0.22)',
      '0px 30px 60px rgba(0, 0, 0, 0.40), 0px 24px 24px rgba(0, 0, 0, 0.22)',
      '0px 36px 72px rgba(0, 0, 0, 0.45), 0px 30px 30px rgba(0, 0, 0, 0.22)'
    ];
    // Pad by repeating the last defined shadow until we have 25 entries
    while (s.length < 25) s.push(s[s.length - 1]);
    return s as any;
  })(),
  
  // Transitions
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  
  // Z-index layers
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};

// ===== CREATE BASE THEME =====
const baseTheme = createTheme(themeOptions);

// ===== FINAL THEME WITH COMPONENT OVERRIDES =====
export const theme = createTheme({
  ...baseTheme,
  components: components(baseTheme),
});

// ===== COMPUTER SHOP SPECIFIC THEME EXTENSIONS =====
export const shopTheme = {
  ...theme,
  
  // Computer shop specific design tokens
  shop: {
    // Product card specifications
    productCard: {
      width: 280,
      height: 400,
      imageHeight: 200,
      padding: 16,
      borderRadius: 12,
    },
    
    // Category colors for visual distinction
    categoryColors: colors.shop.categories,
    
    // Stock status colors
    stockColors: colors.shop.stock,
    
    // Price display configurations
    priceStyles: shopTypography.price,
    
    // Product information styles
    productStyles: shopTypography.product,
    
    // Status styles
    statusStyles: shopTypography.status,
    
    // Specification styles
    specStyles: shopTypography.spec,
    
    // Common layout dimensions
    layout: {
      headerHeight: 64,
      sidebarWidth: 280,
      footerHeight: 200,
      containerMaxWidth: 1200,
      productGridGap: 16,
    },
    
    // Animation configurations
    animations: {
      cardHover: 200,
      buttonHover: 150,
      pageTransition: 300,
      fadeIn: 250,
    },
  },
  
  // Utility functions for consistent styling
  utils: {
    // Price formatting utilities
    formatPrice: (price: number, currency = 'VND') => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    },
    
    // Discount calculation
    calculateDiscount: (originalPrice: number, salePrice: number) => {
      return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    },
    
    // Stock status color helper
    getStockColor: (status: 'inStock' | 'lowStock' | 'outStock' | 'discontinued') => {
      return colors.shop.stock[status];
    },
    
    // Category color helper
    getCategoryColor: (category: string) => {
      const categoryKey = category.toLowerCase().replace(/\s+/g, '');
      return colors.shop.categories[categoryKey as keyof typeof colors.shop.categories] || colors.grey[500];
    },
    
    // Responsive breakpoint helpers
    responsive: {
      mobile: `@media (max-width: ${baseTheme.breakpoints.values.sm}px)`,
      tablet: `@media (max-width: ${baseTheme.breakpoints.values.md}px)`,
      desktop: `@media (min-width: ${baseTheme.breakpoints.values.lg}px)`,
      largeDesktop: `@media (min-width: ${baseTheme.breakpoints.values.xl}px)`,
    },
    
    // Common spacing helpers
    spacing: {
      section: baseTheme.spacing(8),      // 64px
      component: baseTheme.spacing(4),    // 32px
      element: baseTheme.spacing(2),      // 16px
      tight: baseTheme.spacing(1),        // 8px
    },
  },
};

// ===== EXPORTS =====
export { colors } from './colors';
export { typography, shopTypography } from './typography';
export { components } from './components';

// Main theme export
export default shopTheme;

// ===== TYPE DEFINITIONS =====
export type ShopTheme = typeof shopTheme;

declare module '@mui/material/styles' {
  interface Theme {
    shop?: typeof shopTheme.shop;
    utils?: typeof shopTheme.utils;
  }
  
  interface ThemeOptions {
    shop?: Partial<typeof shopTheme.shop>;
    utils?: Partial<typeof shopTheme.utils>;
  }
}
