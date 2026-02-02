import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { productService } from '../../services/product.service';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactElement;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  maxItems?: number;
  sx?: object;
}

// Route-to-breadcrumb mapping
const ROUTE_BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  '/': [{ label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> }],
  '/products': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Sản phẩm', path: '/products' },
  ],
  '/products/cpu': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Sản phẩm', path: '/products' },
    { label: 'CPU', path: '/products/cpu' },
  ],
  '/products/vga': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Sản phẩm', path: '/products' },
    { label: 'VGA', path: '/products/vga' },
  ],
  '/products/ram': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Sản phẩm', path: '/products' },
    { label: 'RAM', path: '/products/ram' },
  ],
  '/products/mainboard': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Sản phẩm', path: '/products' },
    { label: 'Mainboard', path: '/products/mainboard' },
  ],
  '/products/psu': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Sản phẩm', path: '/products' },
    { label: 'PSU', path: '/products/psu' },
  ],
  '/categories': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Danh mục', path: '/categories' },
  ],
  '/build-pc': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Build PC', path: '/build-pc' },
  ],
  '/cart': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Giỏ hàng', path: '/cart' },
  ],
  '/profile': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Tài khoản', path: '/profile' },
  ],
  '/orders': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Tài khoản', path: '/profile' },
    { label: 'Đơn hàng', path: '/orders' },
  ],
  '/admin': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Quản trị', path: '/admin' },
  ],
  '/admin/users': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Quản trị', path: '/admin' },
    { label: 'Người dùng', path: '/admin/users' },
  ],
  '/admin/products': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Quản trị', path: '/admin' },
    { label: 'Sản phẩm', path: '/admin/products' },
  ],
  '/admin/categories': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Quản trị', path: '/admin' },
    { label: 'Danh mục', path: '/admin/categories' },
  ],
  '/admin/orders': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Quản trị', path: '/admin' },
    { label: 'Đơn hàng', path: '/admin/orders' },
  ],
  '/admin/promotions': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Quản trị', path: '/admin' },
    { label: 'Khuyến mãi', path: '/admin/promotions' },
  ],
  '/admin/inventory': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Quản trị', path: '/admin' },
    { label: 'Kho hàng', path: '/admin/inventory' },
  ],
  '/admin/reports': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Quản trị', path: '/admin' },
    { label: 'Báo cáo', path: '/admin/reports' },
  ],
  '/admin/settings': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Quản trị', path: '/admin' },
    { label: 'Cài đặt', path: '/admin/settings' },
  ],
  // Đơn hàng (khách hàng): tạo đơn, xem chi tiết
  '/order/create': [
    { label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> },
    { label: 'Đơn hàng', path: '/order/create' },
    { label: 'Tạo đơn hàng' },
  ],
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHome = true,
  maxItems = 8,
  sx = {},
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Generate breadcrumbs from current route if items not provided
  const getBreadcrumbsFromRoute = (): BreadcrumbItem[] => {
    const currentPath = location.pathname;
    
    // Try exact match first
    if (ROUTE_BREADCRUMBS[currentPath]) {
      return ROUTE_BREADCRUMBS[currentPath];
    }
    
    // Try to match dynamic routes (e.g., /products/123)
    const pathSegments = currentPath.split('/').filter(Boolean);

    // Bản đồ dịch nhãn cho các segment thường gặp
    const SEGMENT_LABELS: Record<string, string> = {
      // khu vực công khai
      'products': 'Sản phẩm',
      'product': 'Sản phẩm',
      'category': 'Danh mục',
      'cart': 'Giỏ hàng',
      'profile': 'Tài khoản',
      'support': 'Hỗ trợ',
      'policies': 'Chính sách',
      'guides': 'Hướng dẫn',
      'build-pc': 'Build PC',
      'order': 'Đơn hàng',
      'orders': 'Đơn hàng',
      'create': 'Tạo',
      'edit': 'Chỉnh sửa',
      'login': 'Đăng nhập',
      'register': 'Đăng ký',
      'warranty': 'Bảo hành',
      'returns': 'Đổi trả',
      'shipping': 'Vận chuyển',
      // khu vực quản trị
      'admin': 'Quản trị',
      'users': 'Người dùng',
      'products-admin': 'Sản phẩm', // fallback nếu cần
      'categories': 'Danh mục',
      'promotions': 'Khuyến mãi',
      'inventory': 'Kho hàng',
      'reports': 'Báo cáo',
      'settings': 'Cài đặt',
      'comments': 'Bình luận',
    };
    let breadcrumbs: BreadcrumbItem[] = [];
    
    if (showHome) {
      breadcrumbs.push({ label: 'Trang chủ', path: '/', icon: <HomeIcon fontSize="small" /> });
    }
    
    let currentRoute = '';
    pathSegments.forEach((segment, index) => {
      currentRoute += `/${segment}`;

      // Check if we have a predefined breadcrumb for this segment
      if (ROUTE_BREADCRUMBS[currentRoute]) {
        const lastBreadcrumb = ROUTE_BREADCRUMBS[currentRoute][ROUTE_BREADCRUMBS[currentRoute].length - 1];
        breadcrumbs.push(lastBreadcrumb);
      } else {
        // Generate breadcrumb for unknown segments
        const isLast = index === pathSegments.length - 1;

        // Ưu tiên dịch nhãn theo bảng trên
        const translated = SEGMENT_LABELS[segment];
        if (translated) {
          breadcrumbs.push({
            label: translated,
            path: isLast ? undefined : currentRoute,
          });
        } else if (segment === 'product') {
          // Trường hợp đặc biệt: /product/:id => hiển thị "Sản phẩm"
          breadcrumbs.push({
            label: 'Sản phẩm',
            path: isLast ? undefined : '/products',
          });
        } else {
          // Fallback: chuyển đổi slug sang chữ cái đầu viết hoa và thay '-' thành khoảng trắng
          const label = segment
            .split('-')
            .map(s => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');
          breadcrumbs.push({
            label,
            path: isLast ? undefined : currentRoute,
          });
        }
      }
    });
    
    return breadcrumbs;
  };

  const [resolvedBreadcrumbs, setResolvedBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);

  const breadcrumbItems = resolvedBreadcrumbs || items || getBreadcrumbsFromRoute();

  // If route is /product/:id (single product), try to replace numeric id with product name
  useEffect(() => {
    let mounted = true;
    const currentPath = location.pathname;
    const segments = currentPath.split('/').filter(Boolean);

    // match routes like /product/123 or /products/123
    if (segments.length === 2 && (segments[0] === 'product' || segments[0] === 'products')) {
      const last = segments[1];
      const id = Number(last);
      if (!isNaN(id)) {
        // start with route-generated breadcrumbs
        const base = getBreadcrumbsFromRoute();
        // async fetch the product name
        (async () => {
          try {
            const p = await productService.getProductById(id);
            if (!mounted) return;

            // p may be wrapped in ApiResponse or raw Product depending on backend
            const name = (p && p.name) ? p.name : String(id);
            const replaced = base.map((b, idx) => {
              // replace last breadcrumb label
              if (idx === base.length - 1) return { ...b, label: name };
              return b;
            });
            setResolvedBreadcrumbs(replaced);
          } catch (err) {
            // ignore and keep numeric id
            setResolvedBreadcrumbs(base);
          }
        })();
        return () => { mounted = false; };
      }
    }

    // otherwise clear any previous resolution
    setResolvedBreadcrumbs(null);
    return () => { mounted = false; };
  }, [location.pathname]);

  const handleBreadcrumbClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number) => {
    const isLast = index === breadcrumbItems.length - 1;
    
    if (isLast || !item.path) {
      return (
        <Typography
          key={index}
          color="text.primary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontWeight: 500,
          }}
        >
          {item.icon}
          {item.label}
        </Typography>
      );
    }
    
    return (
      <Link
        key={index}
        color="inherit"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleBreadcrumbClick(item.path);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            color: theme.palette.primary.main,
          },
        }}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  };

  // Don't render if only one item (home page)
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        py: 1,
        px: 0,
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${theme.palette.divider}`,
        ...sx,
      }}
    >
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        maxItems={maxItems}
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'wrap',
          },
          '& .MuiBreadcrumbs-separator': {
            color: theme.palette.text.secondary,
          },
        }}
      >
        {breadcrumbItems.map((item, index) => renderBreadcrumbItem(item, index))}
      </MuiBreadcrumbs>
    </Box>
  );
};
