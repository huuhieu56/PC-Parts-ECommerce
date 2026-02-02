import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BarChartIcon from '@mui/icons-material/BarChart';
import StorageIcon from '@mui/icons-material/Storage';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
// icons for product categories mapping removed — we no longer render category children here
import { useAppSelector, useAppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import type { AuthState } from '../../types/auth.types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  // Hỗ trợ đầy đủ các variant của MUI Drawer: temporary | permanent | persistent
  variant?: 'temporary' | 'permanent' | 'persistent';
  anchor?: 'left' | 'right';
}

interface SidebarItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
  children?: SidebarItem[];
}

const SIDEBAR_WIDTH = 280;

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  variant = 'temporary',
  anchor = 'left',
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth) as AuthState;
  // no local expanded state — sidebar is flattened (children always visible)

  // Parse single role string to array format  
  const userRoles = user?.role ? [user.role] : [];
  const hasRole = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return roles.some(role => userRoles.includes(role));
  };

  const mapRoleLabel = (r?: string) => {
    if (!r) return 'Không có vai trò';
    const up = String(r).toUpperCase();
    switch (up) {
      case 'ADMIN': return 'Quản trị';
      case 'STAFF': return 'Nhân viên';
      case 'CUSTOMER': return 'Khách hàng';
      default: return up;
    }
  };

  // Debug: measure approximate size of sidebar payload and render time to detect heavy renders
  React.useEffect(() => {
    try {
      const t0 = performance.now();
      // rough size estimate
      const approxSize = JSON.stringify(sidebarItems).length;
      const t1 = performance.now();
      if (import.meta.env.DEV) {
        // log timing and size info useful to trace freezes
        // eslint-disable-next-line no-console
        console.debug('[Sidebar] approxPayloadBytes=', approxSize, 'serializeMs=', (t1 - t0).toFixed(2));
      }
      // If size is huge, warn (but don't mutate)
      if (approxSize > 200 * 1024 && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[Sidebar] Large sidebar payload detected; consider trimming server response or lazy-loading items');
      }
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[Sidebar] size measurement failed', err);
    }
  }, []);

  // Note: category children removed from sidebar to keep sidebar concise.

  // Note: we intentionally do not toggle expand/collapse in the sidebar anymore.
  // Categories (children) will always be rendered for easier access.

  const sidebarItems: SidebarItem[] = [
    {
      text: 'Trang tổng quan',
      icon: <DashboardIcon />,
      path: '/admin',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Quản lý người dùng',
      icon: <PeopleIcon />,
      path: '/admin/users',
      roles: ['ADMIN'],
    },
    {
      text: 'Quản lý danh mục',
      icon: <CategoryIcon />,
      path: '/admin/categories',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Quản lý sản phẩm',
      icon: <InventoryIcon />,
      path: '/admin/products',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Quản lý kho',
      icon: <StorageIcon />,
      path: '/admin/inventory',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Quản lý đơn hàng',
      icon: <ShoppingCartIcon />,
      path: '/admin/orders',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Quản lý khuyến mãi',
      icon: <LocalOfferIcon />,
      path: '/admin/promotions',
      roles: ['ADMIN', 'STAFF'],
    },
    {
      text: 'Báo cáo thống kê',
      icon: <BarChartIcon />,
      path: '/admin/reports',
      roles: ['ADMIN'],
    },
    
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
    onClose();
  };

  const isItemActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    if (!hasRole(item.roles)) {
      return null;
    }

    const isActive = isItemActive(item.path);
    const paddingLeft = level * 2 + 2;
    const hasChildren = !!item.children && item.children.length > 0;

    // Clicking an item should navigate; do not collapse/expand children.
    const onItemClick = () => {
      handleItemClick(item.path);
    };

    return (
      <React.Fragment key={item.path}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={onItemClick}
            selected={isActive}
            sx={{
              pl: paddingLeft,
              '&.Mui-selected': {
                bgcolor: theme.palette.primary.main + '20',
                borderRight: `3px solid ${theme.palette.primary.main}`,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
                '& .MuiListItemText-primary': {
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                },
              },
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: level > 0 ? '0.875rem' : '1rem',
                fontWeight: isActive ? 600 : 400,
              }}
            />
            {/* intentionally no chevron - children are shown by default */}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <List component="div" disablePadding>
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </List>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ width: SIDEBAR_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.92)}, ${alpha(theme.palette.primary.dark, 0.92)})`,
          color: theme.palette.primary.contrastText,
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          fontWeight: 700,
          letterSpacing: 0.4,
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800 }}>
          Quản trị
        </Typography>
      </Box>

      <Divider />

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Xin chào,
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {user.full_name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {mapRoleLabel(user.role)}
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Navigation Items */}
      <List sx={{ pt: 1, flexGrow: 1 }}>
        {sidebarItems.map(item => renderSidebarItem(item))}
      </List>

      <Divider />

      {/* Logout */}
      <List sx={{ mt: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{
            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
          }}>
            <ListItemIcon sx={{ color: theme.palette.error.main }}>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      anchor={anchor}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          background: theme.palette.background.paper,
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
