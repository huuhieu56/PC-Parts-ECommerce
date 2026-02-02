import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    LinearProgress,
    Pagination,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { InputAdornment } from '@mui/material';
import {
    LocalShipping as LocalShippingIcon,
    PendingActions as PendingActionsIcon,
    Refresh as RefreshIcon,
    DoneAll as DoneAllIcon,
    Inventory2 as Inventory2Icon,
    Cancel as CancelIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useDebounce } from '../../../hooks/useDebounce';
import { orderService, type Order } from '../../../services/order.service';
import { ORDER_STATUSES, type OrderStatus } from '../../../types/order.types';
import { getOrderStatusColor, getOrderStatusLabel } from '../../../utils/orderStatus';

const PAGE_SIZE = 12;

const STATUS_META: Record<Exclude<OrderStatus, 'CONFIRMED'> | 'CONFIRMED', {
    label: string;
    color: 'primary' | 'warning' | 'info' | 'success' | 'default' | 'error';
    icon: React.ReactNode;
}> = {
    PENDING: { label: 'Chờ xử lý', color: 'warning', icon: <PendingActionsIcon fontSize="small" /> },
    CONFIRMED: { label: 'Đã xác nhận', color: 'info', icon: <Inventory2Icon fontSize="small" /> },
    PROCESSING: { label: 'Đang xử lý', color: 'info', icon: <Inventory2Icon fontSize="small" /> },
    SHIPPED: { label: 'Đã gửi hàng', color: 'primary', icon: <LocalShippingIcon fontSize="small" /> },
    DELIVERED: { label: 'Đã giao', color: 'success', icon: <DoneAllIcon fontSize="small" /> },
    CANCELLED: { label: 'Đã hủy', color: 'error', icon: <CancelIcon fontSize="small" /> },
};

const DEFAULT_STATS = {
    total_orders: 0,
    pending_orders: 0,
    processing_orders: 0,
    shipped_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
};
type BaseStat = typeof DEFAULT_STATS;
type OrderStats = BaseStat & { total_revenue?: number };
type StatCardKey = keyof BaseStat;

const formatCurrency = (value?: number | null) => {
    if (value == null) return '—';
    try {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    } catch {
        return `${value.toLocaleString('vi-VN')} ₫`;
    }
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN');
};

const StaffOrdersDashboard: React.FC = () => {
    const { showError } = useSnackbar();

    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [stats, setStats] = useState<OrderStats>(DEFAULT_STATS);
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);

    const debouncedKeyword = useDebounce(searchKeyword.trim(), 400);

    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await orderService.getOrderStats();
            setStats({ ...DEFAULT_STATS, ...response });
        } catch (error: any) {
            console.warn('StaffOrdersDashboard: không thể tải thống kê', error);
            setStats(DEFAULT_STATS);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const baseParams = { page, size: PAGE_SIZE, sort: 'updatedAt,desc' } as const;
            const response = statusFilter === 'all'
                ? await orderService.getOrders({
                    ...baseParams,
                    search: debouncedKeyword.length > 0 ? debouncedKeyword : undefined,
                })
                : await orderService.getOrdersByStatus(statusFilter, baseParams);

            let content = response.content ?? [];
            let totalElements = response.totalElements ?? content.length ?? 0;

            if (statusFilter !== 'all' && debouncedKeyword.length > 0) {
                content = content.filter((order) => matchesOrderSearch(order, debouncedKeyword));
                totalElements = content.length;
            }

            setOrders(content);
            setTotal(totalElements);
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || 'Không thể tải danh sách đơn hàng';
            showError(message);
            setOrders([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [debouncedKeyword, page, showError, statusFilter]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    useEffect(() => {
        setPage(0);
    }, [statusFilter, debouncedKeyword]);

    const derivedStats = useMemo(() => {
        if (!stats || Object.values(stats).every((val) => val === 0)) {
            // fallback từ dữ liệu trang hiện tại
            const fallback = orders.reduce(
                (acc, order) => {
                    acc.total_orders += 1;
                    switch ((order.status || 'PENDING').toUpperCase()) {
                        case 'PENDING': acc.pending_orders += 1; break;
                        case 'PROCESSING': acc.processing_orders += 1; break;
                        case 'SHIPPED': acc.shipped_orders += 1; break;
                        case 'DELIVERED': acc.delivered_orders += 1; break;
                        case 'CANCELLED': acc.cancelled_orders += 1; break;
                        default: break;
                    }
                    return acc;
                },
                { ...DEFAULT_STATS },
            );
            return fallback;
        }
        return stats;
    }, [orders, stats]);

    const handleRefresh = () => {
        loadStats();
        loadOrders();
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const statusOptions: Array<'all' | OrderStatus> = ['all', ...ORDER_STATUSES];

    const closeDetailDialog = () => {
        setDetailOpen(false);
        setDetailOrder(null);
        setDetailLoading(false);
    };

    const handleViewDetails = async (orderId: number) => {
        setDetailOpen(true);
        setDetailLoading(true);
        try {
            const response = await orderService.getOrderById(orderId);
            setDetailOrder(response);
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || 'Không thể tải chi tiết đơn hàng';
            showError(message);
            setDetailOrder(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const renderOrderCard = (order: Order) => {
        const statusMeta = STATUS_META[(order.status || 'PENDING').toUpperCase() as OrderStatus] || STATUS_META.PENDING;
        const orderAny = order as Record<string, any>;
        const amount = orderAny.final_amount ?? order.total_amount;
        return (
            <Card key={order.id} variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Mã đơn</Typography>
                            <Typography variant="h6" fontWeight={700}>{order.order_code ?? orderAny.orderCode ?? `#${order.id}`}</Typography>
                        </Box>
                        <Chip
                            label={getOrderStatusLabel(order.status)}
                            color={getOrderStatusColor(order.status) as any}
                            size="small"
                        />
                    </Box>

                    <Stack direction="row" spacing={2} divider={<Divider flexItem orientation="vertical" />}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Khách hàng</Typography>
                            <Typography variant="body1" fontWeight={600}>
                                {order.customer_name ?? orderAny.customerName ?? order.user_name ?? '—'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {order.customer_email ?? orderAny.customerEmail ?? order.user_email ?? '—'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Số điện thoại</Typography>
                            <Typography variant="body1">{order.shipping_phone ?? order.user_phone ?? '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">{order.payment_method ?? orderAny.paymentMethod ?? 'Không rõ'}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Tổng tiền</Typography>
                            <Typography variant="h6" color="primary" fontWeight={700}>{formatCurrency(amount)}</Typography>
                            <Typography variant="caption" color="text.secondary">Cập nhật: {formatDateTime(order.updated_at ?? orderAny.updatedAt)}</Typography>
                        </Box>
                    </Stack>
                </CardContent>
                <Divider />
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center" color={`${statusMeta.color}.main`}>
                        {statusMeta.icon}
                        <Typography variant="body2" fontWeight={600}>{statusMeta.label}</Typography>
                    </Stack>
                    <Button variant="outlined" size="small" onClick={() => handleViewDetails(order.id)}>
                        Xem chi tiết
                    </Button>
                </Box>
            </Card>
        );
    };

    return (
        <Box sx={{ py: 4, px: { xs: 1, md: 2 }, maxWidth: '1400px', mx: 'auto' }}>
            <Paper
                sx={{
                    p: { xs: 3, md: 4 },
                    mb: 4,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 3,
                    alignItems: { xs: 'flex-start', md: 'center' },
                    borderRadius: 3,
                    border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    boxShadow: (theme) => theme.shadows[3],
                }}
            >
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Theo dõi đơn hàng
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Tổng quan tình trạng giao hàng thời gian thực dành cho đội ngũ kho và CSKH.
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                    <TextField
                        size="small"
                        placeholder="Tìm mã đơn, khách hàng, email..."
                        value={searchKeyword}
                        onChange={(event) => setSearchKeyword(event.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
                        Làm mới
                    </Button>
                </Stack>
            </Paper>

            <Box
                sx={{
                    mb: 4,
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                        xs: 'repeat(1, minmax(0, 1fr))',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        md: 'repeat(3, minmax(0, 1fr))',
                        lg: 'repeat(6, minmax(0, 1fr))',
                    },
                }}
            >
                {[
                    { key: 'total_orders', label: 'Tổng đơn', color: 'primary', icon: <Inventory2Icon /> },
                    { key: 'pending_orders', label: 'Chờ xử lý', color: 'warning', icon: <PendingActionsIcon /> },
                    { key: 'processing_orders', label: 'Đang xử lý', color: 'info', icon: <Inventory2Icon /> },
                    { key: 'shipped_orders', label: 'Đã gửi', color: 'primary', icon: <LocalShippingIcon /> },
                    { key: 'delivered_orders', label: 'Đã giao', color: 'success', icon: <DoneAllIcon /> },
                    { key: 'cancelled_orders', label: 'Đã hủy', color: 'error', icon: <CancelIcon /> },
                ].map((card) => (
                    <Card key={card.key} sx={{ height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                {card.icon}
                                <Typography variant="subtitle2" color="text.secondary">{card.label}</Typography>
                            </Stack>
                            <Typography variant="h5" fontWeight={700}>
                                {statsLoading ? '—' : derivedStats[card.key as StatCardKey] ?? 0}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={(() => {
                                    const value = derivedStats[card.key as StatCardKey] ?? 0;
                                    const totalValue = derivedStats.total_orders || 1;
                                    return Math.min(100, Math.round((value / totalValue) * 100));
                                })()}
                                sx={{
                                    mt: 1,
                                    borderRadius: 999,
                                    height: 6,
                                    backgroundColor: (theme) => {
                                        const paletteColor = ((theme.palette as unknown) as Record<string, any>)[card.color]?.main ?? theme.palette.primary.main;
                                        return alpha(paletteColor, 0.12);
                                    },
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: (theme) => ((theme.palette as unknown) as Record<string, any>)[card.color]?.main ?? theme.palette.primary.main,
                                    },
                                }}
                            />
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Lọc trạng thái
                    </Typography>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={statusFilter}
                        onChange={(_, value) => value && setStatusFilter(value)}
                        aria-label="order status filter"
                        sx={{ flexWrap: 'wrap' }}
                    >
                        {statusOptions.map((option) => (
                            <ToggleButton key={option} value={option} aria-label={option}>
                                {option === 'all' ? 'Tất cả' : getOrderStatusLabel(option)}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Stack>
            </Paper>

            {loading ? (
                <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : orders.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <Typography variant="h6">Không có đơn hàng phù hợp</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Điều chỉnh bộ lọc tìm kiếm hoặc trạng thái để xem thêm kết quả.
                    </Typography>
                </Paper>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))' },
                    }}
                >
                    {orders.map((order) => (
                        <Box key={order.id}>{renderOrderCard(order)}</Box>
                    ))}
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Trang {page + 1} / {totalPages} &nbsp;•&nbsp; Hiển thị {orders.length} / {total} đơn hàng
                </Typography>
                <Pagination
                    color="primary"
                    page={page + 1}
                    count={totalPages}
                    onChange={(_, value) => setPage(value - 1)}
                    showFirstButton
                    showLastButton
                />
            </Box>

            <Dialog open={detailOpen} onClose={closeDetailDialog} fullWidth maxWidth="md">
                <DialogTitle>Chi tiết đơn hàng</DialogTitle>
                <DialogContent dividers>
                    {detailLoading ? (
                        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress />
                        </Box>
                    ) : !detailOrder ? (
                        <Alert severity="error">
                            Không tìm thấy dữ liệu đơn hàng. Vui lòng thử lại.
                        </Alert>
                    ) : (
                        <Stack spacing={3}>
                            <Alert severity="info">
                                Chế độ xem chỉ đọc dành cho nhân viên. Không thể cập nhật trạng thái từ màn hình này.
                            </Alert>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Mã đơn</Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                        {detailOrder.order_code || (detailOrder as any).orderCode || `#${detailOrder.id}`}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Cập nhật: {formatDateTime(detailOrder.updated_at || (detailOrder as any).updatedAt)}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Khách hàng</Typography>
                                    <Typography variant="body1" fontWeight={600}>{detailOrder.customer_name || (detailOrder as any).customerName || detailOrder.user_name || '—'}</Typography>
                                    <Typography variant="body2" color="text.secondary">{detailOrder.customer_email || (detailOrder as any).customerEmail || detailOrder.user_email || '—'}</Typography>
                                    <Typography variant="body2">{detailOrder.shipping_phone || detailOrder.user_phone || '—'}</Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Tổng giá trị</Typography>
                                    <Typography variant="h6" color="primary" fontWeight={700}>
                                        {formatCurrency((detailOrder as any).final_amount ?? detailOrder.total_amount)}
                                    </Typography>
                                    <Chip label={getOrderStatusLabel(detailOrder.status)} color={getOrderStatusColor(detailOrder.status) as any} size="small" sx={{ mt: 1, alignSelf: 'flex-start' }} />
                                </Box>
                            </Stack>

                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Thông tin giao hàng</Typography>
                                <Typography variant="body1">{detailOrder.shipping_address || 'Chưa cập nhật'}</Typography>
                                {detailOrder.notes && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Ghi chú: {detailOrder.notes}
                                    </Typography>
                                )}
                            </Paper>

                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Danh sách sản phẩm</Typography>
                                {(() => {
                                    const orderAny = detailOrder as Record<string, any>;
                                    const items = Array.isArray(detailOrder.order_items)
                                        ? detailOrder.order_items
                                        : Array.isArray(orderAny.orderItems)
                                            ? orderAny.orderItems
                                            : [];
                                    if (!items.length) {
                                        return (
                                            <Typography variant="body2" color="text.secondary">
                                                Đơn hàng chưa có thông tin sản phẩm.
                                            </Typography>
                                        );
                                    }
                                    return (
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Sản phẩm</TableCell>
                                                    <TableCell align="right">SL</TableCell>
                                                    <TableCell align="right">Đơn giá</TableCell>
                                                    <TableCell align="right">Thành tiền</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {items.map((item) => (
                                                    <TableRow key={item.id || `${item.product_id}-${item.product_name}`}>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}>{item.product_name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">Mã sản phẩm: {item.product_id}</Typography>
                                                        </TableCell>
                                                        <TableCell align="right">{item.quantity}</TableCell>
                                                        <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.total_price)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    );
                                })()}
                            </Paper>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDetailDialog}>Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StaffOrdersDashboard;

const matchesOrderSearch = (order: Order, keyword: string) => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return true;

    const orderAny = order as Record<string, any>;
    const candidates = [
        order.order_code ?? orderAny.orderCode,
        order.customer_name ?? orderAny.customerName,
        order.customer_email ?? orderAny.customerEmail ?? order.user_email,
        order.shipping_phone ?? orderAny.shippingPhone ?? order.user_phone,
        orderAny.userUsername ?? order.user_username,
        orderAny.orderCode,
        String(order.id ?? ''),
    ];

    return candidates.some((value) => typeof value === 'string' && value.toLowerCase().includes(normalized));
};
