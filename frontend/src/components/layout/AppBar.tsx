import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Button,
  Avatar,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Stack,
  useTheme,
  useMediaQuery,
  keyframes,
  Container,
  alpha,
  useScrollTrigger,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloseIcon from '@mui/icons-material/Close';
import { useAppSelector, useAppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { SearchField } from '../common/SearchField';
import { useCart } from '../../hooks/useCart';
import { categoryService } from '../../services/category.service';
import type { CategoryTree } from '../../services/category.service';

// ========= HẰNG SỐ / TIỆN ÍCH NGOÀI COMPONENT =========
const CACHE_KEY = 'category_tree_v1';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

// Shake animation (giữ ngoài để không tạo lại mỗi render)
const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-3px) rotate(-5deg); }
  50% { transform: translateX(3px) rotate(5deg); }
  75% { transform: translateX(-2px) rotate(-3deg); }
  100% { transform: translateX(0) rotate(0deg); }
`;

// Xây cây danh mục từ danh sách phẳng
const buildTreeFromFlat = (flat: Array<Record<string, any>>): CategoryTree[] => {
  const map = new Map<number, any>();
  flat.forEach((c) => {
    const id = Number(c.id);
    map.set(id, {
      id,
      name: c.name || c.title || '',
      slug: c.slug || c.code || '',
      children: [],
    });
  });

  flat.forEach((c) => {
    const parentIdRaw =
      c.parent_category_id ?? c.parent_id ?? c.parent?.id ?? c.parent_category?.id ?? null;
    const parentId = parentIdRaw == null ? null : Number(parentIdRaw);
    const id = Number(c.id);
    if (parentId != null && map.has(parentId) && map.has(id)) {
      map.get(parentId).children.push(map.get(id));
    }
  });

  const roots: CategoryTree[] = [];
  flat.forEach((c) => {
    const parentIdRaw =
      c.parent_category_id ?? c.parent_id ?? c.parent?.id ?? c.parent_category?.id ?? null;
    if (!parentIdRaw) {
      roots.push(map.get(Number(c.id)));
    }
  });

  if (import.meta.env.DEV) {
    try {
      console.debug(
        '📂 Danh mục: đã dựng cây gốc',
        roots.map((r: any) => ({
          id: r.id,
          name: r.name,
          childrenCount: (r.children || []).length,
        }))
      );
    } catch {}
  }

  return roots;
};

// ========= PROPS =========
interface AppBarProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export const AppBar: React.FC<AppBarProps> = ({ onMenuToggle, showMenuButton = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isScrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { items: cartItems, getTotalQuantity, summary, is_guest_mode } = useCart();

  // Chỉ select field cần thiết để giảm re-render
  // IMPORTANT: return primitives from selectors (not a new object) to avoid
  // creating a new reference each render which causes unnecessary rerenders.
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (import.meta.env.DEV) {
    console.debug('🔎 AppBar: trạng thái xác thực thay đổi', {
      isAuthenticated,
      user: user?.username,
    });
  }

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isCartShaking, setIsCartShaking] = useState(false);
  const [catAnchorEl, setCatAnchorEl] = useState<null | HTMLElement>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hoverCloseTimer = useRef<number | null>(null);
  const shouldShowMenuButton = showMenuButton || isMobile;

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const handleMenuButtonClick = useCallback(() => {
    if (!showMenuButton && isMobile) {
      setMobileNavOpen(true);
      return;
    }
    if (onMenuToggle) onMenuToggle();
  }, [isMobile, onMenuToggle, showMenuButton]);

  // Số lượng items giỏ hàng (memo hoá)
  const cartItemCount = useMemo(() => {
    const count = getTotalQuantity();
    if (import.meta.env.DEV) {
      console.debug('🛒 AppBar: số lượng trong giỏ:', count);
      console.debug('🛒 AppBar: tổng quan giỏ:', summary);
      console.debug('🛒 AppBar: chế độ khách:', is_guest_mode);
      console.debug('🛒 AppBar: số dòng items:', cartItems?.length);
    }
    return count;
  }, [getTotalQuantity, summary, is_guest_mode, cartItems]);

  const prevCartCount = useRef(cartItemCount);

  // Hiệu ứng rung khi giỏ tăng
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('🛒 AppBar: thay đổi số lượng giỏ', {
        hiện_tại: cartItemCount,
        trước_đó: prevCartCount.current,
      });
    }
    if (cartItemCount > prevCartCount.current) {
      if (import.meta.env.DEV) console.debug('🛒 AppBar: kích hoạt hiệu ứng rung');
      setIsCartShaking(true);
      prevCartCount.current = cartItemCount;
      const timer = window.setTimeout(() => setIsCartShaking(false), 600);
      return () => window.clearTimeout(timer);
    }
    prevCartCount.current = cartItemCount;
  }, [cartItemCount]);

  // Tải cây danh mục khi mở menu (lazy)
  const loadCategories = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoadingCategories(true);

        if (!forceRefresh) {
          try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.ts && parsed?.data) {
                const age = Date.now() - parsed.ts;
                if (age < CACHE_TTL) {
                  setCategoryTree(parsed.data);
                  setLoadingCategories(false);
                  return;
                }
              }
            }
          } catch (err) {
            if (import.meta.env.DEV) console.debug('📂 Cache danh mục lỗi khi parse', err);
          }
        }

        // Gọi endpoint tree trước
        try {
          if (import.meta.env.DEV) console.debug('📂 Danh mục: gọi getCategoryTree()');
          const tree = await categoryService.getCategoryTree();
          if (Array.isArray(tree) && tree.length > 0) {
            const normalizeNode = (n: any): CategoryTree => {
              const childrenRaw = n.children || n.subcategories || n.children_categories || [];
              return {
                id: Number(n.id),
                name: n.name || n.title || n.label || '',
                slug: n.slug || n.code || '',
                children: Array.isArray(childrenRaw) ? childrenRaw.map((c: any) => normalizeNode(c)) : [],
              };
            };
            const normalized = tree.map((n: any) => normalizeNode(n));

            // Phòng trường hợp dữ liệu quá lớn
            let toStore = normalized;
            try {
              const approxSize = JSON.stringify(normalized).length;
              if (approxSize > 200 * 1024) {
                if (import.meta.env.DEV) console.warn('📂 Cây danh mục quá lớn, cắt bớt:', approxSize);
                toStore = normalized.slice(0, 200).map((n: any) => ({
                  ...n,
                  children: (n.children || []).slice(0, 20),
                }));
              }
            } catch {}

            setCategoryTree(toStore);
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: toStore }));
            } catch {}
            setLoadingCategories(false);
            return;
          }
        } catch (err) {
          if (import.meta.env.DEV) console.debug('📂 getCategoryTree() thất bại', err);
        }

        // Fallback: lấy danh sách phẳng rồi dựng cây
        if (import.meta.env.DEV) console.debug('📂 Fallback: gọi getCategories() và tự dựng cây');
        const flat = await categoryService.getCategories();
        if (!flat || flat.length === 0) {
          setCategoryTree([]);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: [] }));
          } catch {}
          setLoadingCategories(false);
          return;
        }

        const roots = buildTreeFromFlat(flat || []);

        let toStoreRoots = roots;
        try {
          const approxSize = JSON.stringify(roots).length;
          if (approxSize > 200 * 1024) {
            if (import.meta.env.DEV) console.warn('📂 Cây từ danh sách phẳng quá lớn, cắt bớt:', approxSize);
            toStoreRoots = roots.slice(0, 200).map((n: any) => ({
              ...n,
              children: (n.children || []).slice(0, 20),
            }));
          }
        } catch {}

        setCategoryTree(toStoreRoots);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: toStoreRoots }));
        } catch {}
        setLoadingCategories(false);
      } catch (err) {
        console.error('❌ Không tải được cây danh mục/fallback', err);
        setCategoryTree([]);
        setLoadingCategories(false);
      }
    },
    []
  );

  // Khi menu mở có dữ liệu mà chưa có parent active -> set parent đầu tiên
  useEffect(() => {
    if (menuOpen && categoryTree.length > 0 && activeParentId == null) {
      setActiveParentId(categoryTree[0].id);
    }
  }, [menuOpen, categoryTree, activeParentId]);

  // Cleanup timer hover khi unmount
  useEffect(() => {
    return () => {
      if (hoverCloseTimer.current) {
        window.clearTimeout(hoverCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mobileNavOpen && categoryTree.length === 0 && !loadingCategories) {
      void loadCategories();
    }
  }, [mobileNavOpen, categoryTree.length, loadingCategories, loadCategories]);

  const handleUserMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  // Mega menu handlers
  const openCategoryMenu = useCallback(
    (target: HTMLElement) => {
      if (hoverCloseTimer.current) {
        window.clearTimeout(hoverCloseTimer.current);
        hoverCloseTimer.current = null;
      }
      setCatAnchorEl(target);
      setMenuOpen(true);

      // Lazy-load lần đầu
      if (!loadingCategories && categoryTree.length === 0) {
        void loadCategories();
      }

      // Mặc định chọn parent đầu để hiển thị children ngay
      setTimeout(() => {
        setActiveParentId((prev) => prev ?? (categoryTree.length > 0 ? categoryTree[0].id : null));
      }, 0);
    },
    [categoryTree.length, loadCategories, loadingCategories]
  );

  const handleCategoryMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      openCategoryMenu(e.currentTarget);
    },
    [openCategoryMenu]
  );

  const handleCategoryButtonClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      openCategoryMenu(e.currentTarget);
    },
    [openCategoryMenu]
  );

  const handleCategoryMouseLeave = useCallback(() => {
    // Trì hoãn đóng để chuột kịp vào popper
    hoverCloseTimer.current = window.setTimeout(() => {
      setMenuOpen(false);
      setActiveParentId(null);
      setCatAnchorEl(null);
    }, 150);
  }, []);

  const handlePopperMouseEnter = useCallback(() => {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  }, []);

  const handlePopperMouseLeave = useCallback(() => {
    setMenuOpen(false);
    setActiveParentId(null);
    setCatAnchorEl(null);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(() => {
    if (import.meta.env.DEV) console.debug('👋 AppBar: đăng xuất');
    dispatch(logoutUser());
    setAnchorEl(null);
    closeMobileNav();
    navigate('/');
  }, [closeMobileNav, dispatch, navigate]);

  const handleSearch = useCallback(
    (query: string) => {
      const q = query.trim();
      if (q) {
        navigate(`/products?search=${encodeURIComponent(q)}`);
      }
    },
    [navigate]
  );

  const handleCartClick = useCallback(() => {
    navigate('/cart');
  }, [navigate]);

  const handleNavClick = useCallback((path: string) => {
    closeMobileNav();
    navigate(path);
  }, [closeMobileNav, navigate]);

  const handleProfileClick = useCallback(() => {
    setAnchorEl(null);
    navigate('/profile');
  }, [navigate]);

  const handleDashboardClick = useCallback(() => {
    setAnchorEl(null);
    if (user?.role === 'ADMIN') navigate('/admin');
    else if (user?.role === 'STAFF') navigate('/staff');
    closeMobileNav();
  }, [closeMobileNav, user?.role, navigate]);

  const appBarSurface = useMemo(() => {
    const baseGradient = `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isScrolled ? 0.92 : 0.7)}, ${alpha(theme.palette.primary.dark, isScrolled ? 0.92 : 0.7)})`;
    return {
      backgroundImage: baseGradient,
      color: theme.palette.common.white,
      backdropFilter: isScrolled ? 'none' : 'blur(14px)',
      borderBottom: `1px solid ${alpha(theme.palette.common.white, isScrolled ? 0.08 : 0.15)}`,
      boxShadow: isScrolled ? theme.shadows[4] : 'none',
      transition: 'all 0.25s ease-in-out',
    };
  }, [isScrolled, theme]);

  // Menu người dùng (memo hoá để không render lại vô ích)
  const userMenu = useMemo(
    () => (
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
        PaperProps={{
          elevation: 4,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 200,
            '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileClick}>
          <Avatar sx={{ width: 24, height: 24, mr: 1 }} />
          Tài khoản của tôi
        </MenuItem>

        {user?.role === 'ADMIN' && [
          <Divider key="admin-divider" />,
          <MenuItem key="admin-dashboard" onClick={handleDashboardClick}>
            <DashboardIcon sx={{ mr: 1, fontSize: 20 }} />
            Quản trị hệ thống
          </MenuItem>,
        ]}

        {user?.role === 'STAFF' && [
          <Divider key="staff-divider" />,
          <MenuItem
            key="staff-panel"
            onClick={() => {
              setAnchorEl(null);
              navigate('/staff');
            }}
          >
            <DashboardIcon sx={{ mr: 1, fontSize: 20 }} />
            Panel nhân viên
          </MenuItem>,
        ]}

        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
          Đăng xuất
        </MenuItem>
      </Menu>
    ),
    [anchorEl, handleUserMenuClose, handleProfileClick, user?.role, handleDashboardClick, handleLogout, navigate]
  );

  return (
    <>
      <MuiAppBar
        position="sticky"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          ...appBarSurface,
        }}
      >
      <Container maxWidth="xl" disableGutters>
      <Toolbar disableGutters sx={{ px: { xs: 2, md: 3 }, minHeight: { xs: 64, md: 80 }, gap: { xs: 1.5, md: 2 } }}>
        {/* Nút menu (mobile/sidebar) */}
        {shouldShowMenuButton && (
          <IconButton
            color="inherit"
            aria-label="mở/đóng menu"
            onClick={handleMenuButtonClick}
            edge="start"
            sx={{ mr: { xs: 1, sm: 2 } }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo */}
        <Typography
          variant="h6"
          component="div"
          onClick={() => navigate('/')}
          sx={{
            flexGrow: 0,
            mr: { xs: 2, sm: 4 },
            cursor: 'pointer',
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            '&:hover': { opacity: 0.85 },
          }}
        >
          Computer Shop
        </Typography>

        {/* Link điều hướng (desktop) */}
        {!isMobile && (
          <Box sx={{ display: 'flex', flexGrow: 1, ml: 2 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/products')}
              sx={{
                mr: 2,
                fontWeight: 600,
                letterSpacing: 0.2,
              }}
            >
              Sản phẩm
            </Button>

            {/* Danh mục (hover) */}
            <Box sx={{ mr: 2 }} onMouseEnter={handleCategoryMouseEnter} onMouseLeave={handleCategoryMouseLeave}>
              <Button
                color="inherit"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label="mở danh mục"
                onClick={handleCategoryButtonClick}
              >
                Danh mục
              </Button>

              {/* Mega menu */}
              {catAnchorEl && (
                <Box
                  onMouseEnter={handlePopperMouseEnter}
                  onMouseLeave={handlePopperMouseLeave}
                  sx={{ position: 'absolute', zIndex: theme.zIndex.modal }}
                >
                  {menuOpen && (
                    <Box
                      sx={{
                        display: 'flex',
                        bgcolor: 'background.paper',
                        color: theme.palette.text.primary,
                        boxShadow: 3,
                        borderRadius: 1,
                        mt: 1,
                        p: 2,
                      }}
                    >
                      <Box sx={{ minWidth: 220, maxHeight: 400, overflow: 'auto', pr: 2 }}>
                        {loadingCategories ? (
                          <Typography variant="body2" color="text.secondary">
                            Đang tải danh mục...
                          </Typography>
                        ) : categoryTree.length === 0 ? (
                          <Box sx={{ p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Không có danh mục nào.
                            </Typography>
                            <Button
                              size="small"
                              sx={{ mt: 1 }}
                              onClick={() => {
                                (async () => {
                                  try {
                                    localStorage.removeItem(CACHE_KEY);
                                  } catch {}
                                  setLoadingCategories(true);
                                  try {
                                    const flat = await categoryService.getCategories();
                                    const roots = buildTreeFromFlat(flat || []);
                                    setCategoryTree(roots);
                                    try {
                                      localStorage.setItem(
                                        CACHE_KEY,
                                        JSON.stringify({ ts: Date.now(), data: roots })
                                      );
                                    } catch {}
                                  } catch (err) {
                                    console.error('❌ Tải lại danh mục thất bại', err);
                                  } finally {
                                    setLoadingCategories(false);
                                  }
                                })();
                              }}
                            >
                              Tải lại
                            </Button>
                          </Box>
                        ) : (
                          categoryTree.map((parent) => (
                            <Box
                              key={parent.id}
                              onMouseEnter={() => setActiveParentId(parent.id)}
                              onClick={() => navigate(`/products?category=${parent.id}`)}
                              onKeyDown={(ev) => {
                                if (ev.key === 'Enter') navigate(`/products?category=${parent.id}`);
                              }}
                              role="menuitem"
                              tabIndex={0}
                              sx={{
                                py: 1,
                                px: 1.5,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' },
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {parent.name}
                              </Typography>
                            </Box>
                          ))
                        )}
                      </Box>

                      <Box sx={{ minWidth: 320, maxHeight: 400, overflow: 'auto', pl: 2 }}>
                        {categoryTree.map((parent) => (
                          <Box
                            key={`children-${parent.id}`}
                            sx={{ display: parent.id === activeParentId ? 'block' : 'none' }}
                          >
                            {parent.children?.map((child) => (
                              <Box
                                key={child.id}
                                sx={{ py: 0.5, cursor: 'pointer' }}
                                onClick={() => navigate(`/products?category=${child.id}`)}
                              >
                                <Typography variant="body2" color="text.primary">
                                  {child.name}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Button
              color="inherit"
              onClick={() => navigate('/build-pc')}
              sx={{
                mr: 2,
                fontWeight: 600,
                letterSpacing: 0.2,
              }}
            >
              Build PC
            </Button>
          </Box>
        )}

        {/* Ô tìm kiếm (desktop) */}
        {!isMobile && (
          <Box
            sx={{
              flexGrow: 1,
              maxWidth: 420,
              mx: 2,
            }}
          >
            <Box
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.common.white, 0.12),
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '& fieldset': { borderColor: alpha(theme.palette.common.white, 0.18) },
                  '&:hover fieldset': { borderColor: alpha(theme.palette.common.white, 0.35) },
                  '&.Mui-focused fieldset': { borderColor: alpha(theme.palette.common.white, 0.75) },
                  '& .MuiSvgIcon-root': {
                    color: alpha(theme.palette.common.white, 0.85),
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: 'white',
                  '&::placeholder': { color: 'rgba(255, 255, 255, 0.7)', opacity: 1 },
                },
              }}
            >
              <SearchField
                placeholder="Tìm kiếm sản phẩm..."
                onSearch={handleSearch}
                autoSearch={false}
                size="small"
              />
            </Box>
          </Box>
        )}

        {/* Tìm kiếm (mobile) */}
        {isMobile && (
          <IconButton color="inherit" onClick={() => navigate('/search')} sx={{ ml: 'auto', mr: 1 }} aria-label="tìm kiếm">
            <SearchIcon />
          </IconButton>
        )}

        {/* Giỏ hàng */}
        <IconButton
          color="inherit"
          onClick={handleCartClick}
          aria-label="mở giỏ hàng"
          sx={{
            mr: 1,
            animation: isCartShaking ? `${shakeAnimation} 0.6s ease-in-out` : 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': { transform: 'scale(1.1)' },
          }}
        >
          <Badge
            badgeContent={cartItemCount > 0 ? cartItemCount : null}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#ff4444',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                animation:
                  cartItemCount > prevCartCount.current ? 'pulse 0.3s ease-in-out' : 'none',
              },
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.2)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          >
            <ShoppingCartIcon />
          </Badge>
        </IconButton>

        {/* Tài khoản */}
        {isAuthenticated ? (
          <>
            <IconButton
              size="large"
              edge="end"
              aria-label="mở menu tài khoản"
              aria-controls="user-menu"
              aria-haspopup="true"
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
            {userMenu}
          </>
        ) : (
          isMobile ? (
            <IconButton
              color="inherit"
              onClick={() => navigate('/login')}
              aria-label="đăng nhập"
            >
              <AccountCircleIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                size="small"
                sx={{ fontWeight: 600 }}
              >
                Đăng nhập
              </Button>
              <Button
                color="inherit"
                variant="outlined"
                onClick={() => navigate('/register')}
                size="small"
                sx={{
                  borderColor: alpha(theme.palette.common.white, 0.55),
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: alpha(theme.palette.common.white, 0.85),
                    bgcolor: alpha(theme.palette.common.white, 0.16),
                  },
                }}
              >
                Đăng ký
              </Button>
            </Box>
          )
        )}
      </Toolbar>
      </Container>
    </MuiAppBar>

      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={closeMobileNav}
        ModalProps={{ keepMounted: true }}
      >
        <Box
          role="presentation"
          sx={{
            width: 300,
            maxWidth: '85vw',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Typography variant="h6">Menu</Typography>
            <IconButton onClick={closeMobileNav} aria-label="đóng menu">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <List>
              <ListItemButton onClick={() => handleNavClick('/')}> 
                <ListItemText primary="Trang chủ" />
              </ListItemButton>
              <ListItemButton onClick={() => handleNavClick('/products')}>
                <ListItemText primary="Sản phẩm" />
              </ListItemButton>
              <ListItemButton onClick={() => handleNavClick('/build-pc')}>
                <ListItemText primary="Build PC" />
              </ListItemButton>
              <ListItemButton onClick={() => handleNavClick('/cart')}>
                <ListItemText primary="Giỏ hàng" />
              </ListItemButton>
            </List>

            <Divider />

            <List
              subheader={
                <ListSubheader component="div" disableSticky>
                  Danh mục nổi bật
                </ListSubheader>
              }
            >
              {loadingCategories ? (
                <ListItem>
                  <ListItemText primary="Đang tải danh mục..." />
                </ListItem>
              ) : categoryTree.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Không có danh mục" />
                </ListItem>
              ) : (
                categoryTree.map((parent) => (
                  <ListItemButton
                    key={parent.id}
                    onClick={() => handleNavClick(`/products?category=${parent.id}`)}
                  >
                    <ListItemText primary={parent.name} />
                  </ListItemButton>
                ))
              )}
            </List>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            {isAuthenticated ? (
              <Stack spacing={1.5}>
                <Button variant="contained" onClick={() => handleNavClick('/profile')}>
                  Tài khoản của tôi
                </Button>
                {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                  <Button variant="outlined" onClick={handleDashboardClick}>
                    Bảng điều khiển
                  </Button>
                )}
                <Button color="error" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Button variant="contained" onClick={() => handleNavClick('/login')}>
                  Đăng nhập
                </Button>
                <Button variant="outlined" onClick={() => handleNavClick('/register')}>
                  Đăng ký
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
};
