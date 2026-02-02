import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from '../../hooks/useSnackbar';
import { adminDashboardService } from '../../services/admin.service';
import { orderService } from '../../services/order.service';
import StatCard from '../../components/common/StatCard';

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  activePromotions: number;
  recentComments: number;
}


const AdminPanel: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { showError } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    activePromotions: 0,
    recentComments: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<{ status: string; issues: string[]; uptime: string } | null>(null);
  const [monthlyOrderCount, setMonthlyOrderCount] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [todayRevenue, setTodayRevenue] = useState<number>(0);
  const [monthlyOrdersTrend, setMonthlyOrdersTrend] = useState<number[]>([]);
  const [monthlyRevenueTrend, setMonthlyRevenueTrend] = useState<number[]>([]);
  const [ordersDelta, setOrdersDelta] = useState<number | null>(null);
  const [revenueDelta, setRevenueDelta] = useState<number | null>(null);
  
  // recent activities currently not displayed in simplified dashboard

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminDashboardService.getDashboardStats();
      // normalize stats keys (support snake_case from backend)
      const normalizeStats = (s: any) => ({
        totalProducts: s.totalProducts ?? s.total_products ?? s.total_products_count ?? 0,
        totalUsers: s.totalUsers ?? s.total_users ?? s.total_users_count ?? 0,
        totalOrders: s.totalOrders ?? s.total_orders ?? s.total_orders_count ?? 0,
        totalRevenue: s.totalRevenue ?? s.total_revenue ?? s.revenue ?? 0,
        lowStockProducts: s.lowStockProducts ?? s.low_stock_products ?? s.low_stock_count ?? 0,
        pendingOrders: s.pendingOrders ?? s.pending_orders ?? s.pending ?? 0,
        activePromotions: s.activePromotions ?? s.active_promotions ?? 0,
        recentComments: s.recentComments ?? s.recent_comments ?? 0
      });
      setStats(normalizeStats(statsRes));
      setLoading(false);
    } catch (error: any) {
      showError('Không thể tải dữ liệu dashboard: ' + (error.message || ''));
      setLoading(false);
    }
  };

  const fetchExtras = async () => {
    try {
      const [activities, health] = await Promise.all([
        adminDashboardService.getRecentActivities(6).catch(() => []),
        adminDashboardService.getSystemHealth().catch(() => null)
      ]);
      // Normalize activities coming from backend (snake_case or camelCase)
      const normalizeActivity = (a: any) => {
        if (!a) return null;
        const id = a.id ?? a.activity_id ?? a._id ?? String(Math.random());
        const type = a.type ?? a.activity_type ?? a.kind ?? 'info';
        const message = a.message ?? a.msg ?? a.description ?? '';
        const timestamp = a.timestamp ?? a.created_at ?? a.time ?? a.date ?? null;
        const status = a.status ?? a.level ?? 'info';
        const meta = a.meta ?? a.data ?? a.payload ?? {};
        // try to extract a human actor or target for better secondary text
        const actor = meta.performed_by ?? meta.user ?? meta.actor ?? a.performed_by ?? a.user_name ?? null;
        const targetName = meta.product_name ?? meta.name ?? meta.title ?? a.product_name ?? a.name ?? null;
        return { id, type, message, timestamp, status, meta, actor, targetName };
      };

      setRecentActivities((activities || []).map((a: any) => normalizeActivity(a)).filter(Boolean));
      setSystemHealth(health);

      // compute current-month orders & revenue and monthly trends (client-side fallback)
      try {
        const recentOrdersRes = await orderService.getOrders({ page: 0, size: 1000 });
        const orders = recentOrdersRes.content || [];
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const isCancelledOrder = (o: any) => {
          const s = String(o.status ?? o.order_status ?? '').toUpperCase();
          return s === 'CANCELLED' || s === 'CANCELED' || s === 'CANCEL';
        };

        const monthOrders = orders.filter((o: any) => {
          const d = new Date((o as any).created_at ?? (o as any).createdAt ?? 0);
          return d >= monthStart && d < monthEnd && !isCancelledOrder(o);
        });
        const monthRevenue = monthOrders.reduce((sum: number, o: any) => sum + Number((o as any).final_amount ?? (o as any).finalAmount ?? (o as any).total_amount ?? (o as any).total ?? 0), 0);
        const todayOrders = orders.filter((o: any) => {
          const d = new Date((o as any).created_at ?? (o as any).createdAt ?? 0);
          return d >= dayStart && d < dayEnd && !isCancelledOrder(o);
        });
        const todayRev = todayOrders.reduce((sum: number, o: any) => sum + Number((o as any).final_amount ?? (o as any).finalAmount ?? (o as any).total_amount ?? (o as any).total ?? 0), 0);
        setMonthlyOrderCount(monthOrders.length);
        setMonthlyRevenue(monthRevenue);
        setTodayRevenue(todayRev);

        // fetch monthly trends from admin service (6 months)
        try {
          const trends = await adminDashboardService.getMonthlyTrends(6);
          const ordersTrend = trends.orders || [];
          const revenueTrend = trends.revenue || [];
          setMonthlyOrdersTrend(ordersTrend);
          setMonthlyRevenueTrend(revenueTrend);

          // compute simple delta = (last - prev) / (prev || 1)
          if (ordersTrend.length >= 2) {
            const last = ordersTrend[ordersTrend.length - 1] ?? 0;
            const prev = ordersTrend[ordersTrend.length - 2] ?? 0;
            setOrdersDelta(prev === 0 ? (last === 0 ? 0 : 1) : (last - prev) / prev);
          }
          if (revenueTrend.length >= 2) {
            const lastR = revenueTrend[revenueTrend.length - 1] ?? 0;
            const prevR = revenueTrend[revenueTrend.length - 2] ?? 0;
            setRevenueDelta(prevR === 0 ? (lastR === 0 ? 0 : 1) : (lastR - prevR) / prevR);
          }
        } catch (te) {
          console.warn('AdminPanel: could not fetch monthly trends', te);
        }
      } catch (e) {
        console.warn('AdminPanel: could not compute monthly stats via orders fallback', e);
      }
    } catch (e) {
      // non-fatal
      console.warn('Không thể tải extras dashboard', e);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchDashboardData(), fetchExtras()]);
    })();
  }, []);

  // Note: simplified UI components (avoid complex Grid/List to keep types simple)

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Đang tải dữ liệu dashboard...
        </Typography>
      </Box>
    );
  }

  const nf = new Intl.NumberFormat('vi-VN');
  const currency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

  const formatRelative = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const seconds = Math.round(diff / 1000);
    if (seconds < 60) return `${seconds}s trước`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.round(hours / 24);
    return `${days} ngày trước`;
  };

  // Use shared StatCard component from components/common/StatCard

  return (
    <Box sx={{ p: 3 }}>
  <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }} elevation={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Bảng điều khiển quản trị</Typography>
            <Typography variant="body2" color="text.secondary">Chào mừng, <strong>{user?.full_name || 'Admin'}</strong> — tổng quan hệ thống nhanh.</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Làm mới dữ liệu">
              <IconButton onClick={() => { fetchDashboardData(); fetchExtras(); }}><RefreshIcon /></IconButton>
            </Tooltip>
            <Button variant="contained" color="primary" component={RouterLink} to="/admin/products/create">Thêm sản phẩm</Button>
            <Button variant="outlined" color="inherit" component={RouterLink} to="/">Xem trang</Button>
            <Button variant="text" color="error" onClick={handleLogout}>Đăng xuất</Button>
          </Box>
        </Box>
      </Paper>

      {/* KPI doanh thu nổi bật */}
      <Card
        elevation={2}
        sx={{
          mb: 2,
          p: 0,
          background: (theme) => `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
          color: (theme) => theme.palette.success.contrastText,
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.9 }}>Tổng doanh thu</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>{currency(stats.totalRevenue)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`Hôm nay: ${currency(todayRevenue)}`} color="success" variant="filled" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }} />
            <Chip label={`Tháng này: ${currency(monthlyRevenue)}`} color="success" variant="filled" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }} />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 2 }}>
        <StatCard title="Tổng sản phẩm" value={nf.format(stats.totalProducts)} icon={<Inventory2Icon />} color="#1976d2" hint={`${nf.format(stats.lowStockProducts)} sản phẩm sắp hết`} />
        <StatCard title="Người dùng" value={nf.format(stats.totalUsers)} icon={<PeopleIcon />} color="#9c27b0" hint={`${nf.format(stats.recentComments)} bình luận gần đây`} />
        <StatCard title="Đơn hàng (tháng này)" value={nf.format(monthlyOrderCount)} icon={<ShoppingCartIcon />} color="#ff9800" sparklineData={monthlyOrdersTrend} delta={ordersDelta} />
        <StatCard title="Doanh thu (tháng này)" value={currency(monthlyRevenue)} icon={<AttachMoneyIcon />} color="#2e7d32" sparklineData={monthlyRevenueTrend} delta={revenueDelta} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Box>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Hoạt động gần đây</Typography>
                <Chip icon={<NotificationsActiveIcon />} label={recentActivities.length ? `${recentActivities.length} mục` : 'Không có'} size="small" />
              </Box>

              <Divider sx={{ mb: 1 }} />
              <List dense>
                {recentActivities.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Không có hoạt động gần đây" secondary="Không có mục nào để hiển thị" />
                  </ListItem>
                )}
                {recentActivities.map((a: any) => (
                  <ListItem key={a.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: a.status === 'warning' ? 'warning.main' : a.status === 'success' ? 'success.main' : 'info.main' }}>
                        {a.type === 'order' ? <ShoppingCartIcon /> : a.type === 'user' ? <PeopleIcon /> : <Inventory2Icon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={a.message} secondary={formatRelative(a.timestamp)} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card elevation={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Tình trạng hệ thống</Typography>
                <Chip label={systemHealth?.status ? systemHealth.status.toUpperCase() : 'UNKNOWN'} color={systemHealth?.status === 'healthy' ? 'success' : systemHealth?.status === 'warning' ? 'warning' : 'error'} size="small" />
              </Box>
              <Divider sx={{ mb: 1 }} />
              <Box>
                {systemHealth?.issues?.length ? (
                  <List>
                    {systemHealth.issues.map((issue, i) => (
                      <ListItem key={i}><ListItemText primary={issue} /></ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">Không có vấn đề lớn. Uptime: {systemHealth?.uptime || '—'}</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPanel;
