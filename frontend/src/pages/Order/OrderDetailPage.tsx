import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Paper, List, ListItem, Divider, CircularProgress,
  Alert, Button, Stack, Chip, Container, TextField, MenuItem, ListItemAvatar, Avatar
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import { ORDER_STATUSES } from '../../types/order.types';
import { getOrderStatusColor as colorOf, getOrderStatusLabel as labelOf, isCancelableStatus } from '../../utils/orderStatus';
import { api } from '../../services/api';
import { orderService } from '../../services/order.service';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from '../../hooks/useSnackbar';

type OrderItem = {
  id: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  thumbnail?: string | null;
  image_url?: string | null;
};

type NormalizedOrder = {
  id: number;
  order_code?: string;
  customer_name?: string;
  customer_email?: string;
  shipping_address?: string;
  shipping_phone?: string;
  notes?: string;
  status?: string;
  subtotal?: number;
  total_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  tax_amount?: number;
  shipping_cost?: number;
  created_at?: string;
  promotion_code?: string | null;
  promotion_name?: string | null;
  promotion_id?: number | null;
  order_items: OrderItem[];
};

const normalizeOrder = (payload: any): NormalizedOrder => ({
  id: payload.id,
  order_code: payload.order_code ?? payload.orderCode,
  customer_name: payload.customer_name ?? payload.customerName,
  customer_email: payload.customer_email ?? payload.customerEmail,
  shipping_address: payload.shipping_address ?? payload.shippingAddress,
  shipping_phone: payload.shipping_phone ?? payload.shippingPhone,
  notes: payload.notes ?? undefined,
  status: payload.status ?? undefined,
  subtotal: payload.subtotal ?? payload.total_amount ?? payload.totalAmount ?? 0,
  total_amount: payload.total_amount ?? payload.totalAmount ?? payload.total ?? 0,
  discount_amount: payload.discount_amount ?? payload.discountAmount ?? 0,
  final_amount:
    payload.final_amount ?? payload.finalAmount ?? payload.total_amount ?? payload.totalAmount ?? payload.total ?? 0,
  tax_amount: payload.tax_amount ?? payload.taxAmount ?? 0,
  shipping_cost: payload.shipping_cost ?? payload.shippingCost ?? 0,
  created_at: payload.created_at ?? payload.createdAt ?? undefined,
  promotion_code: payload.promotion?.code ?? payload.promotion_code ?? null,
  promotion_name: payload.promotion?.name ?? payload.promotion_name ?? null,
  promotion_id: payload.promotion?.id ?? payload.promotion_id ?? null,
  order_items: (payload.order_items ?? payload.orderItems ?? payload.items ?? []).map((it: any) => {
    const productData = it.product ?? it.productDto ?? {};
    const resolvedThumbnail =
      productData.thumbnail
      ?? productData.image_url
      ?? productData.imageUrl
      ?? it.product_thumbnail
      ?? it.productThumbnail
      ?? it.product_image_url
      ?? it.productImageUrl
      ?? it.thumbnail
      ?? it.image_url
      ?? it.imageUrl
      ?? null;
    const resolvedImageUrl =
      productData.image_url
      ?? productData.imageUrl
      ?? productData.thumbnail
      ?? it.product_image_url
      ?? it.productImageUrl
      ?? it.product_thumbnail
      ?? it.productThumbnail
      ?? it.image_url
      ?? it.imageUrl
      ?? it.thumbnail
      ?? null;
    return {
      id: it.id,
      product_id: it.product_id ?? it.productId ?? it.product_id,
      product_name: it.product_name ?? it.productName ?? it.name ?? it.product_name,
      quantity: it.quantity ?? it.qty ?? 0,
      unit_price: it.unit_price ?? it.unitPrice ?? it.price ?? 0,
      total_price: it.total_price ?? it.totalPrice ?? (Number(it.quantity ?? 0) * Number(it.price ?? it.unit_price ?? 0)),
      thumbnail: resolvedThumbnail,
      image_url: resolvedImageUrl,
    };
  }) as OrderItem[],
});

const getStatusColor = (s?: string): ChipProps['color'] => colorOf(s);

type SummaryRowProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

const SummaryRow: React.FC<SummaryRowProps> = ({ label, value, highlight = false }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Typography color="text.secondary">{label}</Typography>
    <Typography fontWeight={highlight ? 700 : 500} color={highlight ? 'primary.main' : 'text.primary'}>
      {value}
    </Typography>
  </Stack>
);

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const { canManageOrders } = useAuth();

  const [order, setOrder] = useState<NormalizedOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const currency = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }), []);
  const fmt = (n?: number) => currency.format(Number(n ?? 0));

  const fetchOrder = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
  const resp = await api.get<any>(`/orders/${id}`, { signal });
      if (!resp) {
        throw new Error('No response received');
      }

      // Robust unwrap logic similar to OrderHistoryPanel
      let payload: any = null;
      const anyResp: any = resp;
      if (anyResp.data && typeof anyResp.data === 'object' && !Array.isArray(anyResp.data)) {
        // ApiResponse wrapper: { message, data: order, status_code }
        payload = anyResp.data;
      } else {
        // Raw order object
        payload = anyResp;
      }

      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid order data received');
      }

      const normalized = normalizeOrder(payload);
      setOrder(normalized);
    } catch (e: any) {
      if (e?.name !== 'CanceledError' && e?.message !== 'canceled') {
        console.error('OrderDetail Fetch error:', e);
        setError(e?.message || 'Không thể tải chi tiết đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrder(controller.signal);
    return () => controller.abort();
  }, [fetchOrder]);

  const cancelOrder = useCallback(async () => {
    if (!id) return;
    // Xác nhận từ người dùng trước khi hủy
    const confirmed = window.confirm('Bạn có chắc muốn hủy đơn hàng này?');
    if (!confirmed) return;
    try {
      // Theo API_TESTING_GUIDE: PATCH /api/v1/orders/{id}/cancel
      await orderService.cancelOrder(Number(id));
      showSuccess('Đơn hàng đã được hủy');
      await fetchOrder(); // reload để cập nhật trạng thái & tổng tiền
    } catch (err: any) {
      // Hiển thị chi tiết lỗi nếu backend trả về message cụ thể
      const msg = err?.message || (err?.data?.message) || 'Hủy đơn hàng thất bại';
      showError(msg);
    }
  }, [id, fetchOrder, showSuccess, showError]);

  const [updating, setUpdating] = useState<boolean>(false);
  const [nextStatus, setNextStatus] = useState<string>(ORDER_STATUSES[0]);
  useEffect(() => {
    setNextStatus(order?.status || ORDER_STATUSES[0]);
  }, [order?.status]);

  const handleUpdateStatus = useCallback(async () => {
    if (!id) return;
    const statusToSend = (nextStatus || ORDER_STATUSES[0]).toUpperCase();
    try {
      setUpdating(true);
      await orderService.updateOrderStatus(Number(id), statusToSend);
      showSuccess('Cập nhật trạng thái đơn hàng thành công');
      await fetchOrder();
    } catch (err: any) {
      const msg = err?.message || (err?.data?.message) || 'Cập nhật trạng thái thất bại';
      showError(msg);
    } finally {
      setUpdating(false);
    }
  }, [id, nextStatus, fetchOrder, showSuccess, showError]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!order) return <Typography>Không tìm thấy đơn hàng</Typography>;

  const createdAtDisplay = order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : 'Chưa cập nhật';
  const subtotalDisplay = fmt(order.subtotal ?? order.total_amount);
  const discountDisplay = order.discount_amount ? `- ${fmt(order.discount_amount)}` : fmt(0);
  const finalDisplay = fmt(order.final_amount ?? order.total_amount);
  const taxDisplay = fmt(order.tax_amount);
  const shippingDisplay = order.shipping_cost && order.shipping_cost > 0 ? fmt(order.shipping_cost) : 'Miễn phí';
  const promotionLabel = order.promotion_name
    ? `${order.promotion_name}${order.promotion_code ? ` (${order.promotion_code})` : ''}`
    : order.promotion_code ?? '';
  const canCancelOrder = isCancelableStatus(order.status);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={1.5}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>Chi tiết đơn hàng</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {order.order_code ? `Mã đơn: #${order.order_code}` : `Mã đơn: #${order.id}`} · {createdAtDisplay}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={labelOf(order.status)} color={getStatusColor(order.status)} />
            <Button variant="outlined" onClick={() => navigate(-1)}>Quay lại</Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'stretch',
            gap: 3,
          }}
        >
          <Box sx={{ flex: { md: 1.6 }, width: '100%' }}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600}>Thông tin nhận hàng</Typography>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {[
                    { label: 'Người nhận', value: order.customer_name ?? '-' },
                    { label: 'Email', value: order.customer_email ?? '-' },
                    { label: 'Số điện thoại', value: order.shipping_phone ?? '-' },
                    { label: 'Địa chỉ nhận hàng', value: order.shipping_address ?? '-' },
                  ].map((row) => (
                    <Stack key={row.label} direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{row.label}:</Typography>
                      <Typography variant="body2" color="text.primary">{row.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600}>Sản phẩm</Typography>
                <List sx={{ mt: 2 }}>
                  {order.order_items.map((it, index) => (
                    <React.Fragment key={it.id}>
                      <ListItem disableGutters sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar sx={{ minWidth: 52 }}>
                          <Avatar
                            variant="rounded"
                            src={(it.thumbnail ?? it.image_url) ?? undefined}
                            alt={it.product_name}
                            sx={{ width: 48, height: 48 }}
                          >
                            {it.product_name?.charAt(0) ?? 'P'}
                          </Avatar>
                        </ListItemAvatar>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          spacing={1.5}
                          sx={{ width: '100%' }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography component="div" fontWeight={600}>{it.product_name}</Typography>
                            <Stack
                              component="div"
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              sx={{ color: 'text.secondary', mt: 0.5 }}
                            >
                              <Typography component="span" variant="body2">
                                Số lượng: {it.quantity}
                              </Typography>
                              <Typography component="span" variant="body2">
                                Đơn giá: {fmt(it.unit_price)}
                              </Typography>
                            </Stack>
                          </Box>
                          <Stack
                            direction={{ xs: 'row', sm: 'column' }}
                            spacing={1}
                            alignItems={{ xs: 'center', sm: 'flex-end' }}
                            sx={{ minWidth: { sm: 140 }, width: { sm: 'auto' } }}
                          >
                            <Typography component="div" fontWeight={600}>{fmt(it.total_price)}</Typography>
                            {it.product_id && (
                              <Button
                                component={RouterLink}
                                to={`/product/${it.product_id}`}
                                size="small"
                                variant="outlined"
                              >
                                Xem
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      </ListItem>
                      {index < order.order_items.length - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>

              {order.notes && (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Ghi chú từ khách hàng</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{order.notes}</Typography>
                </Paper>
              )}
            </Stack>
          </Box>

          <Box sx={{ flex: 1, width: '100%' }}>
            <Stack spacing={3}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600}>Tổng quan đơn hàng</Typography>
                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  <SummaryRow label="Tổng tạm tính" value={subtotalDisplay} />
                  <SummaryRow label="Thuế VAT (10%)" value={taxDisplay} />
                  <SummaryRow label="Phí vận chuyển" value={shippingDisplay} />
                  <SummaryRow label="Ưu đãi" value={discountDisplay} />
                  <Divider />
                  <SummaryRow label="Giá trị cuối" value={finalDisplay} highlight />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Ngày tạo: {createdAtDisplay}
                </Typography>
                {promotionLabel && (
                  <Chip label={promotionLabel} color="primary" variant="outlined" sx={{ mt: 1.5 }} />
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                  Theo dõi tiến trình xử lý tại mục lịch sử đơn hàng của bạn.
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600}>Thao tác</Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={!canCancelOrder}
                    onClick={cancelOrder}
                  >
                    Hủy đơn hàng
                  </Button>
                  {canManageOrders && (
                    <>
                      <TextField
                        select
                        label="Trạng thái"
                        size="small"
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value)}
                        disabled={updating}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {labelOf(status)}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button variant="contained" onClick={handleUpdateStatus} disabled={updating}>
                        {updating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                      </Button>
                    </>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Container>
  );
};

export default OrderDetailPage;
