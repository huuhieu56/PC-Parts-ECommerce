/**
 * 📝 TYPOGRAPHY SYSTEM - Computer Shop E-commerce
 * 
 * Design Philosophy:
 * - Roboto: Clean, modern, tech-focused
 * - Clear hierarchy for product information
 * - Optimized for readability on various screen sizes
 * - Consistent spacing and sizing
 * 
 * Inspiration from:
 * - GearVN: Clear product names and pricing
 * - PhongVu: Professional technical specifications
 * - Material Design 3.0 type scale
 */

// MUI v7 compatible - no explicit TypographyOptions import needed
export const typography = {
  // ===== FONT FAMILY =====
  fontFamily: [
    'Roboto',           // Primary - clean, modern
    'Inter',            // Fallback - excellent readability
    '-apple-system',    // macOS system font
    'BlinkMacSystemFont', // macOS fallback
    '"Segoe UI"',       // Windows system font
    '"Helvetica Neue"', // Alternative sans-serif
    'Arial',            // Universal fallback
    'sans-serif',       // Generic fallback
  ].join(','),
  
  // ===== HEADLINES =====
  // Hero sections, main page titles
  h1: {
    fontSize: '2.5rem',       // 40px
    fontWeight: 700,          // Bold for impact
    lineHeight: 1.2,
    letterSpacing: '-0.025em', // Tighter for large text
    '@media (max-width:600px)': {
      fontSize: '2rem',       // 32px on mobile
    },
  },
  
  // Section titles, category headers
  h2: {
    fontSize: '2rem',         // 32px
    fontWeight: 600,          // Semi-bold
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
    '@media (max-width:600px)': {
      fontSize: '1.75rem',    // 28px on mobile
    },
  },
  
  // Product category headers, card titles
  h3: {
    fontSize: '1.75rem',      // 28px
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    '@media (max-width:600px)': {
      fontSize: '1.5rem',     // 24px on mobile
    },
  },
  
  // Product names, subsection titles
  h4: {
    fontSize: '1.5rem',       // 24px
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '0em',
    '@media (max-width:600px)': {
      fontSize: '1.25rem',    // 20px on mobile
    },
  },
  
  // Filter labels, small headers
  h5: {
    fontSize: '1.25rem',      // 20px
    fontWeight: 500,          // Medium weight
    lineHeight: 1.4,
    letterSpacing: '0em',
  },
  
  // Specification labels, form headers
  h6: {
    fontSize: '1.125rem',     // 18px
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
  
  // ===== SUBTITLES =====
  // Large descriptive text
  subtitle1: {
    fontSize: '1rem',         // 16px
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.01em',
  },
  
  // Medium descriptive text
  subtitle2: {
    fontSize: '0.875rem',     // 14px
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },
  
  // ===== BODY TEXT =====
  // Main content, product descriptions
  body1: {
    fontSize: '1rem',         // 16px
    fontWeight: 400,
    lineHeight: 1.6,          // Optimal for reading
    letterSpacing: '0.01em',
  },
  
  // Secondary content, specifications
  body2: {
    fontSize: '0.875rem',     // 14px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },
  
  // ===== INTERACTIVE ELEMENTS =====
  // Buttons, CTAs
  button: {
    fontSize: '0.875rem',     // 14px
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: '0.02em',
    textTransform: 'none' as const, // Keep natural casing
  },
  
  // Small UI text, helper text
  caption: {
    fontSize: '0.75rem',      // 12px
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: '0.03em',
  },
  
  // Labels, tags, very small text
  overline: {
    fontSize: '0.75rem',      // 12px
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
};

// ===== COMPUTER SHOP SPECIFIC TYPOGRAPHY =====
export const shopTypography = {
  // Price display
  price: {
    primary: {
      fontSize: '1.5rem',     // 24px - main price
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      color: '#f44336',       // Sale price red
    },
    secondary: {
      fontSize: '1.25rem',    // 20px - smaller contexts
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '0em',
      color: '#f44336',
    },
    original: {
      fontSize: '1rem',       // 16px - crossed out
      fontWeight: 400,
      lineHeight: 1.2,
      textDecoration: 'line-through',
      color: '#9e9e9e',
    },
  },
  
  // Product information
  product: {
    name: {
      fontSize: '1.125rem',   // 18px
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0em',
      color: '#212121',
    },
    code: {
      fontFamily: '"Roboto Mono", monospace',
      fontSize: '0.75rem',    // 12px
      fontWeight: 400,
      lineHeight: 1.2,
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      color: '#757575',
    },
    category: {
      fontSize: '0.75rem',    // 12px
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: '0.02em',
      textTransform: 'uppercase' as const,
      color: '#1976d2',
    },
  },
  
  // Status indicators
  status: {
    stock: {
      fontSize: '0.875rem',   // 14px
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: '0.01em',
      textTransform: 'capitalize' as const,
    },
    badge: {
      fontSize: '0.75rem',    // 12px
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: '0.02em',
      textTransform: 'uppercase' as const,
    },
  },
  
  // Technical specifications
  spec: {
    label: {
      fontSize: '0.875rem',   // 14px
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0em',
      color: '#424242',
    },
    value: {
      fontSize: '0.875rem',   // 14px
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0em',
      color: '#757575',
    },
  },
};

export type TypographySystem = typeof typography;
export type ShopTypographySystem = typeof shopTypography;
