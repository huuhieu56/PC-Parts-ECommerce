import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, CircularProgress, Paper, Divider, Grid } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CancelIcon from '@mui/icons-material/Cancel';
import { adminDashboardService } from '../../../services/admin.service';
import { orderService } from '../../../services/order.service';
import { productService } from '../../../services/product.service';
import { userService } from '../../../services/user.service';
import { useSnackbar } from '../../../hooks/useSnackbar';

type StatColor = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

const getStatColor = (theme: Theme, color: StatColor): string => {
  switch (color) {
    case 'primary':
      return theme.palette.primary.main;
    case 'secondary':
      return theme.palette.secondary.main;
    case 'success':
      return theme.palette.success.main;
    case 'error':
      return theme.palette.error.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'info':
      return theme.palette.info.main;
    default:
      return theme.palette.text.secondary;
  }
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color?: StatColor; }>
  = ({ icon, label, value, color = 'default' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ color: (theme) => getStatColor(theme as Theme, color) }}>{icon}</Box>
        <Box>
          <Typography variant="overline" color="text.secondary">{label}</Typography>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const currencyVN = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const ReportsPage: React.FC = () => {
  const { showError } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  const [orderStats, setOrderStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    processing_orders: 0,
    shipped_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    total_revenue: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<number>(0);
  const [activePromotions, setActivePromotions] = useState<number>(0);
  const [monthlyOrderCount, setMonthlyOrderCount] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Prefer a single admin dashboard endpoint that aggregates many stats; fall back to individual calls
  const dashboard = await adminDashboardService.getDashboardStats().catch(() => null);
        if (dashboard) {
          if (!mounted) return;
          setProductCount(dashboard.totalProducts || 0);
          setUserCount(dashboard.totalUsers || 0);
          setOrderStats({
            total_orders: dashboard.totalOrders || 0,
            // dashboard currently exposes pendingOrders and totalRevenue; other breakdowns may be absent
            pending_orders: (dashboard as any).pendingOrders ?? 0,
            processing_orders: (dashboard as any).processingOrders ?? 0,
            shipped_orders: (dashboard as any).shippedOrders ?? 0,
            delivered_orders: (dashboard as any).deliveredOrders ?? 0,
            cancelled_orders: (dashboard as any).cancelledOrders ?? 0,
            total_revenue: (dashboard as any).totalRevenue ?? 0,
          });
          setLowStockProducts(dashboard.lowStockProducts || 0);
          setActivePromotions(dashboard.activePromotions || 0);
        } else {
          // Nếu dashboard không có, tính toán từ các endpoint hiện có
          const [products, users] = await Promise.all([
            productService.getProductCount().catch(() => 0),
            userService.getAllUsers({ page: 0, size: 1 }).then(r => r.totalElements || 0).catch(() => 0),
          ]);
          if (!mounted) return;
          setProductCount(products || 0);
          setUserCount(users || 0);
          // Lấy breakdown theo status và doanh thu từ đơn DELIVERED
          try {
            const pageSize = 200;
            const deliveredFirst = await orderService.getOrdersByStatus('DELIVERED', { page: 0, size: pageSize });
            const totalDelivered = deliveredFirst.totalElements || 0;
            let totalRevenue = 0;
            const sumArr = (arr: any[]) => {
              for (const o of arr) totalRevenue += Number(o.final_amount ?? o.finalAmount ?? o.total_amount ?? o.total ?? 0);
            };
            sumArr(deliveredFirst.content || []);
            const pages = Math.ceil(totalDelivered / pageSize);
            for (let p = 1; p < pages; p++) {
              const pg = await orderService.getOrdersByStatus('DELIVERED', { page: p, size: pageSize });
              sumArr(pg.content || []);
            }
            const statuses = ['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED'] as const;
            const counts: Record<string, number> = {};
            await Promise.all(statuses.map(async s => {
              try { const pg = await orderService.getOrdersByStatus(s as any, { page: 0, size: 1 }); counts[s] = pg.totalElements || 0; } catch { counts[s] = 0; }
            }));
            setOrderStats({
              total_orders: (await orderService.getOrders({ page: 0, size: 1 })).totalElements || 0,
              pending_orders: counts['PENDING'] || 0,
              processing_orders: counts['PROCESSING'] || 0,
              shipped_orders: counts['SHIPPED'] || 0,
              delivered_orders: counts['DELIVERED'] || 0,
              cancelled_orders: counts['CANCELLED'] || 0,
              total_revenue: totalRevenue,
            });
          } catch (e) {
            console.warn('ReportsPage: fallback stats failed', e);
          }
        }

        // Additionally compute current-month orders & revenue as a derived metric (client-side fallback)
        try {
          const recentOrdersRes = await orderService.getOrders({ page: 0, size: 1000 });
          const orders = recentOrdersRes.content || [];
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const isCancelledOrder = (o: any) => {
            const s = String(o.status ?? o.order_status ?? '').toUpperCase();
            return s === 'CANCELLED' || s === 'CANCELED' || s === 'CANCEL';
          };

          const monthOrders = orders.filter((o: any) => {
            const d = new Date(o.created_at ?? o.createdAt ?? o.createdAtString ?? 0);
            return d >= monthStart && d < monthEnd && !isCancelledOrder(o);
          });
          const monthRevenue = monthOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount ?? o.totalPrice ?? o.total ?? 0), 0);
          if (mounted) {
            setMonthlyOrderCount(monthOrders.length);
            setMonthlyRevenue(monthRevenue);
          }
        } catch (e) {
          console.warn('ReportsPage: could not compute monthly stats via orders fallback', e);
        }
      } catch (err: any) {
        showError('Không tải được số liệu thống kê');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Báo cáo thống kê</Typography>
        <Chip size="small" label="Dữ liệu trực tiếp" color="info" variant="outlined" />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard icon={<InventoryIcon />} label="Tổng sản phẩm" value={productCount} color="primary" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard icon={<PeopleIcon />} label="Tổng người dùng" value={userCount} color="secondary" />
            </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <StatCard icon={<ShoppingCartIcon />} label="Tổng đơn hàng" value={orderStats.total_orders} color="info" />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <StatCard icon={<MonetizationOnIcon />} label="Tổng doanh thu" value={currencyVN(orderStats.total_revenue)} color="success" />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <StatCard icon={<ShoppingCartIcon />} label="Đơn hàng (tháng này)" value={monthlyOrderCount} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <StatCard icon={<MonetizationOnIcon />} label="Doanh thu (tháng này)" value={currencyVN(monthlyRevenue)} color="success" />
              </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <StatCard icon={<ShoppingCartIcon />} label="Chờ xử lý" value={orderStats.pending_orders} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <StatCard icon={<LocalShippingIcon />} label="Đang xử lý" value={orderStats.processing_orders} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <StatCard icon={<LocalShippingIcon />} label="Đã giao" value={orderStats.shipped_orders} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <StatCard icon={<DoneAllIcon />} label="Hoàn tất" value={orderStats.delivered_orders} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <StatCard icon={<CancelIcon />} label="Đã hủy" value={orderStats.cancelled_orders} color="error" />
            </Grid>
          </Grid>

          {/* Additional stats row: low stock, promotions, recent comments, pending orders (from dashboard) */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard icon={<InventoryIcon />} label="Sản phẩm sắp hết" value={lowStockProducts} color="warning" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard icon={<LocalShippingIcon />} label="Đơn hàng chờ" value={orderStats.pending_orders} color="info" />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard icon={<LocalShippingIcon />} label="Đang xử lý (tổng)" value={orderStats.processing_orders} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <StatCard icon={<LocalShippingIcon />} label="Khuyến mãi đang chạy" value={activePromotions} color="secondary" />
            </Grid>
          </Grid>

          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Ghi chú</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              - Số liệu đơn hàng lấy từ endpoint thống kê của backend (nếu không có sẽ hiển thị 0 theo mặc định).<br/>
              - Tổng sản phẩm lấy từ /products/count; tổng người dùng lấy từ trang đầu danh sách người dùng (totalElements).<br/>
              - Bạn có thể mở rộng phần này với biểu đồ khi bổ sung thư viện chart.
            </Typography>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ReportsPage;
