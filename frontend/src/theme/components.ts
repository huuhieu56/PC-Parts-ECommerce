/**
 * 🎨 COMPONENT THEME OVERRIDES - Computer Shop E-commerce
 * 
 * Design Philosophy:
 * - Professional, clean appearance inspired by successful computer shops
 * - Consistent interaction patterns across all components
 * - Optimized for product browsing and e-commerce workflows
 * - Accessibility-first design
 * 
 * Component Strategy:
 * - Buttons: Clear CTAs with proper contrast
 * - Cards: Clean product presentation
 * - Inputs: Professional forms
 * - Navigation: Intuitive hierarchy
 */

import type { Theme, Components } from '@mui/material/styles';

export const components = (theme: Theme): Components => ({
  // ===== BUTTONS =====
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        padding: theme.spacing(1, 2),
        // Consistent subtle hover across all buttons: no movement, slight tint
        // and modest shadow for contained variants. Use action.hover so it
        // respects light/dark themes.
        transition: 'background-color 150ms ease, box-shadow 150ms ease, color 150ms ease',
        willChange: 'background-color, box-shadow',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          transform: 'none',
        },
      },
      contained: {
        boxShadow: theme.shadows[2],
        '&:hover': {
          // Keep color stable; highlight via shadow
          boxShadow: theme.shadows[4],
          backgroundColor: theme.palette.action.hover,
        },
      },
      containedPrimary: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        '&:hover': {
          // Don't hard-darken primary; keep same hue and elevate via shadow
          backgroundColor: theme.palette.primary.main,
          boxShadow: theme.shadows[4],
        },
      },
      containedSecondary: {
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.common.white,
        '&:hover': {
          backgroundColor: theme.palette.secondary.main,
          boxShadow: theme.shadows[4],
        },
      },
      outlined: {
        borderWidth: 1.5,
        '&:hover': {
          borderWidth: 1.5,
          backgroundColor: theme.palette.action.hover,
        },
      },
      text: {
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      },
      sizeLarge: {
        padding: theme.spacing(1.5, 3),
        fontSize: '1rem',
        borderRadius: 10,
      },
      sizeSmall: {
        padding: theme.spacing(0.75, 1.5),
        fontSize: '0.75rem',
        borderRadius: 6,
      },
    },
  },

  // ===== CARDS =====
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        // Make card hover match IconButton: subtle background tint and shadow,
        // no movement to keep interactions stable and consistent.
        transition: 'box-shadow 180ms ease',
      },
    },
  },

  // ===== ICON BUTTONS =====
  MuiIconButton: {
    styleOverrides: {
      root: {
        transition: 'background-color 150ms ease, color 150ms ease',
        borderRadius: 6,
        // Do not translate or scale on hover — keep interaction subtle and stable
        transform: 'none',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      },
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: theme.spacing(2),
        '&:last-child': {
          paddingBottom: theme.spacing(2),
        },
      },
    },
  },

  // ===== TEXT FIELDS =====
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
          },
        },
        '& .MuiInputLabel-root': {
          '&.Mui-focused': {
            color: theme.palette.primary.main,
          },
        },
      },
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
        },
      },
    },
  },

  // ===== APP BAR =====
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
    },
  },

  // ===== TOOLBAR =====
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: '64px !important',
        padding: theme.spacing(0, 2),
        [theme.breakpoints.up('sm')]: {
          padding: theme.spacing(0, 3),
        },
      },
    },
  },

  // ===== CHIPS =====
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        fontSize: '0.75rem',
        fontWeight: 500,
        height: 28,
      },
      filled: {
        '&.MuiChip-colorPrimary': {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.common.white,
        },
        '&.MuiChip-colorSecondary': {
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.common.white,
        },
      },
      outlined: {
        borderWidth: 1.5,
        '&.MuiChip-colorPrimary': {
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
        },
      },
    },
  },

  // ===== PAPER =====
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        transition: undefined,
      },
      outlined: {
        border: `1px solid ${theme.palette.divider}`,
      },
      elevation1: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      },
      elevation2: {
        boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      },
      elevation4: {
        boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      },
    },
  },

  // ===== DIALOGS =====
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        padding: 0,
      },
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '1.25rem',
        fontWeight: 600,
        padding: theme.spacing(2.5, 3, 2),
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
    },
  },

  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: theme.spacing(2.5, 3),
      },
    },
  },

  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: theme.spacing(2, 3, 2.5),
        borderTop: `1px solid ${theme.palette.divider}`,
        gap: theme.spacing(1),
      },
    },
  },

  // ===== DRAWER =====
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRadius: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      },
    },
  },

  // ===== TABS =====
  MuiTabs: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      indicator: {
        backgroundColor: theme.palette.primary.main,
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },
  },

  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontSize: '0.875rem',
        fontWeight: 500,
        minHeight: 48,
        color: theme.palette.text.secondary,
        '&.Mui-selected': {
          color: theme.palette.primary.main,
          fontWeight: 600,
        },
        '&:hover': {
          color: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}08`,
        },
      },
    },
  },

  // ===== LISTS =====
  MuiListItem: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: theme.spacing(0.25, 0),
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}08`,
        },
      },
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}08`,
        },
        '&.Mui-selected': {
          backgroundColor: `${theme.palette.primary.main}12`,
          '&:hover': {
            backgroundColor: `${theme.palette.primary.main}16`,
          },
        },
      },
    },
  },

  // ===== BADGES =====
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontSize: '0.75rem',
        fontWeight: 600,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
      },
      colorPrimary: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
      },
      colorSecondary: {
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.common.white,
      },
      colorError: {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.common.white,
      },
    },
  },

  // ===== ALERTS =====
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontSize: '0.875rem',
      },
      standardSuccess: {
        backgroundColor: `${theme.palette.success.main}12`,
        color: theme.palette.success.dark,
        '& .MuiAlert-icon': {
          color: theme.palette.success.main,
        },
      },
      standardError: {
        backgroundColor: `${theme.palette.error.main}12`,
        color: theme.palette.error.dark,
        '& .MuiAlert-icon': {
          color: theme.palette.error.main,
        },
      },
      standardWarning: {
        backgroundColor: `${theme.palette.warning.main}12`,
        color: theme.palette.warning.dark,
        '& .MuiAlert-icon': {
          color: theme.palette.warning.main,
        },
      },
      standardInfo: {
        backgroundColor: `${theme.palette.info.main}12`,
        color: theme.palette.info.dark,
        '& .MuiAlert-icon': {
          color: theme.palette.info.main,
        },
      },
    },
  },

  // ===== SKELETON =====
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        backgroundColor: theme.palette.grey[200],
      },
      rectangular: {
        borderRadius: 8,
      },
      rounded: {
        borderRadius: '50%',
      },
    },
  },
});
