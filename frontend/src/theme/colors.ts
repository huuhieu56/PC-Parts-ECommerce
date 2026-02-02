/**
 * 🎨 COLOR PALETTE - Computer Shop E-commerce
 * 
 * Inspired by successful computer shops:
 * - GearVN: Blue theme (trust, technology)
 * - PhongVu: Clean professional colors
 * - Material Design 3.0 guidelines
 * 
 * Philosophy:
 * - Blue: Technology, trust, reliability
 * - Orange: Energy, call-to-action, highlights
 * - Gray: Balance, sophistication
 * - Green: Success, availability
 * - Red: Alerts, urgency, sale prices
 */

export const colors = {
  // ===== PRIMARY PALETTE =====
  primary: {
    main: '#1976d2',        // Material Blue 700 - Main brand color
    light: '#42a5f5',       // Material Blue 400 - Lighter interactions
    dark: '#1565c0',        // Material Blue 800 - Darker states
    '50': '#e3f2fd',        // Very light blue for backgrounds
    '100': '#bbdefb',       // Light blue for subtle highlights
    '200': '#90caf9',       // Medium light blue
    '300': '#64b5f6',       // Medium blue
    '400': '#42a5f5',       // Light blue (same as light)
    '500': '#2196f3',       // Material Blue 500
    '600': '#1e88e5',       // Material Blue 600
    '700': '#1976d2',       // Main (same as main)
    '800': '#1565c0',       // Dark blue (same as dark)
    '900': '#0d47a1',       // Very dark blue
  },

  // ===== SECONDARY PALETTE =====
  secondary: {
    main: '#ff9800',        // Material Orange 500 - Call-to-action
    light: '#ffb74d',       // Material Orange 300 - Lighter CTAs
    dark: '#f57c00',        // Material Orange 700 - Darker CTAs
    '50': '#fff3e0',        // Very light orange
    '100': '#ffe0b2',       // Light orange for notifications
    '200': '#ffcc80',       // Medium light orange
    '300': '#ffb74d',       // Light orange (same as light)
    '400': '#ffa726',       // Medium orange
    '500': '#ff9800',       // Main orange (same as main)
    '600': '#fb8c00',       // Dark orange
    '700': '#f57c00',       // Darker orange (same as dark)
    '800': '#ef6c00',       // Very dark orange
    '900': '#e65100',       // Deepest orange
  },

  // ===== SEMANTIC COLORS =====
  error: {
    main: '#f44336',        // Material Red 500 - Errors, urgent alerts
    light: '#ef5350',       // Material Red 400 - Lighter error states
    dark: '#d32f2f',        // Material Red 700 - Dark error states
    '50': '#ffebee',        // Very light red for error backgrounds
    '100': '#ffcdd2',       // Light red for error highlights
  },

  warning: {
    main: '#ff9800',        // Material Orange 500 - Warnings
    light: '#ffb74d',       // Light orange for warning highlights
    dark: '#f57c00',        // Dark orange for warning emphasis
    '50': '#fff8e1',        // Very light amber
    '100': '#ffecb3',       // Light amber for warning backgrounds
  },

  info: {
    main: '#2196f3',        // Material Blue 500 - Information
    light: '#64b5f6',       // Light blue for info highlights
    dark: '#1976d2',        // Dark blue for info emphasis
    '50': '#e3f2fd',        // Very light blue for info backgrounds
    '100': '#bbdefb',       // Light blue for info highlights
  },

  success: {
    main: '#4caf50',        // Material Green 500 - Success, in stock
    light: '#81c784',       // Material Green 300 - Success highlights
    dark: '#388e3c',        // Material Green 700 - Success emphasis
    '50': '#e8f5e8',        // Very light green for success backgrounds
    '100': '#c8e6c9',       // Light green for success highlights
  },

  // ===== NEUTRAL COLORS =====
  grey: {
    50: '#fafafa',          // Very light gray - main background
    100: '#f5f5f5',         // Light gray - card backgrounds
    200: '#eeeeee',         // Medium light gray - dividers
    300: '#e0e0e0',         // Medium gray - borders
    400: '#bdbdbd',         // Gray - disabled text
    500: '#9e9e9e',         // Medium gray - secondary text
    600: '#757575',         // Dark gray - primary text light
    700: '#616161',         // Darker gray - secondary text
    800: '#424242',         // Very dark gray - primary text
    900: '#212121',         // Darkest gray - headlines
  },

  // ===== BACKGROUND COLORS =====
  background: {
    default: '#fafafa',     // Main app background (grey.50)
    paper: '#ffffff',       // Card/surface backgrounds
    neutral: '#f5f5f5',     // Alternative background (grey.100)
  },

  // ===== TEXT COLORS =====
  text: {
    primary: '#212121',     // Main text color (grey.900)
    secondary: '#757575',   // Secondary text color (grey.600)
    disabled: '#bdbdbd',    // Disabled text color (grey.400)
    hint: '#9e9e9e',        // Hint text color (grey.500)
  },

  // ===== COMPUTER SHOP SPECIFIC COLORS =====
  shop: {
    // Price & promotions
    price: {
      original: '#9e9e9e',  // Original price (crossed out)
      sale: '#f44336',      // Sale price (red for urgency)
      discount: '#4caf50',  // Discount badge (green for savings)
    },
    
    // Stock status
    stock: {
      inStock: '#4caf50',   // In stock (green)
      lowStock: '#ff9800',  // Low stock warning (orange)
      outStock: '#f44336',  // Out of stock (red)
      discontinued: '#9e9e9e', // Discontinued (gray)
    },
    
    // Product ratings
    rating: {
      star: '#ffb400',      // Rating stars (amber)
      empty: '#e0e0e0',     // Empty stars (light gray)
    },
    
    // Category colors (for visual distinction)
    categories: {
      cpu: '#ff5722',       // Red-orange for CPU
      gpu: '#4caf50',       // Green for Graphics cards
      ram: '#2196f3',       // Blue for RAM
      storage: '#9c27b0',   // Purple for Storage
      motherboard: '#607d8b', // Blue-grey for Motherboards
      psu: '#795548',       // Brown for Power supplies
      cooling: '#00bcd4',   // Cyan for Cooling
      case: '#424242',      // Dark grey for Cases
    },
  },

  // ===== COMMON COLORS =====
  common: {
    black: '#000000',
    white: '#ffffff',
  },

  // ===== DIVIDER COLOR =====
  divider: '#e0e0e0',     // Light gray dividers

  // Legacy aliases for backward compatibility
  categories: {
    cpu: '#ff5722',       // Red-orange for CPU
    gpu: '#4caf50',       // Green for Graphics cards
    ram: '#2196f3',       // Blue for RAM
    storage: '#9c27b0',   // Purple for Storage
    motherboard: '#607d8b', // Blue-grey for Motherboards
    psu: '#795548',       // Brown for Power supplies
    cooling: '#00bcd4',   // Cyan for Cooling
    case: '#424242',      // Dark grey for Cases
  },
  status: {
    inStock: '#4caf50',
    lowStock: '#ff9800',
    outOfStock: '#f44336',
    discontinued: '#9e9e9e',
  },
} as const;

export type ColorPalette = typeof colors;
