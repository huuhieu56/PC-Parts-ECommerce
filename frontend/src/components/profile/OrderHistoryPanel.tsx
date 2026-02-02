import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, CircularProgress,
  Alert, IconButton, Collapse, Divider, Link, Paper, Chip, Stack, Button, Avatar, FormControl, InputLabel, Select
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import { getOrderStatusColor as colorOf, getOrderStatusLabel as labelOf } from '../../utils/orderStatus';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Link as RouterLink } from 'react-router-dom';

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image?: string | null;
};

type OrderSummary = {
  id: string;
  order_code?: string;
  status?: string;
  total_amount: number;
  final_amount?: number;
  discount_amount?: number;
  promotion_code?: string;
  created_at?: string;
  order_items?: OrderItem[];
};

type LooseRecord = Record<string, unknown>;

const toRecord = (value: unknown): LooseRecord | null => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as LooseRecord
    : null
);

const pickString = (...candidates: unknown[]): string | undefined => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
};

const pickNumber = (...candidates: unknown[]): number | undefined => {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
};

const pickArray = (value: unknown): unknown[] | undefined => (Array.isArray(value) ? value : undefined);

const coerceId = (value: unknown, fallback: string): string => {
  const str = pickString(value); if (str) return str;
  const num = pickNumber(value); if (typeof num === 'number') return String(num);
  return fallback;
};

const parseOrderItem = (raw: unknown, index: number): OrderItem | null => {
  const rec = toRecord(raw);
  if (!rec) return null;

  const id = coerceId(rec.id ?? rec.item_id ?? rec.itemId, `item-${index}`);
  const productId = coerceId(rec.product_id ?? rec.productId ?? rec.productID, `${id}-product`);
  const productName = pickString(rec.product_name, rec.productName, rec.name) ?? 'Không xác định';
  const quantity = pickNumber(rec.quantity, rec.qty) ?? 0;
  const unitPrice = pickNumber(rec.unit_price, rec.price) ?? 0;
  const totalPrice = pickNumber(rec.total_price, rec.total, quantity * unitPrice) ?? 0;
  const product = toRecord(rec.product);
  const imageSource = pickString(
    product?.thumbnail,
    product?.image_url,
    product?.imageUrl,
    product?.image,
    rec.product_thumbnail,
    rec.productThumbnail,
    rec.product_image_url,
    rec.productImageUrl,
    rec.thumbnail,
    rec.image_url,
    rec.imageUrl,
    rec.image
  ) ?? null;

  return {
    id,
    product_id: productId,
    product_name: productName,
    quantity,
    unit_price: unitPrice,
    total_price: totalPrice,
    image: imageSource,
  };
};

const parseOrder = (raw: unknown, index: number): OrderSummary | null => {
  const rec = toRecord(raw);
  if (!rec) return null;

  const id = coerceId(rec.id ?? rec.order_id, `order-${index}`);
  const orderCode = pickString(
    rec.order_code,
    rec.orderCode,
    rec.order_number,
    rec.orderNumber,
    rec.order_no,
    rec.orderNo,
    rec.code
  );
  const promotion = toRecord(rec.promotion);
  const promotionCode = pickString(
    promotion?.code,
    promotion?.name,
    rec.promotion_code,
    rec.promotionCode
  );
  const discountAmount = pickNumber(rec.discount_amount, rec.discountAmount, rec.discount);
  const status = pickString(rec.status, rec.order_status, rec.state);
  const createdAt = pickString(rec.created_at, rec.createdAt, rec.order_date, rec.createdDate);

  const itemsRaw = pickArray(rec.order_items)
    ?? pickArray(rec.orderItems)
    ?? pickArray(rec.items)
    ?? pickArray(rec.orderDetails)
    ?? [];

  const orderItems = itemsRaw
    .map((item, idx) => parseOrderItem(item, idx))
    .filter((item): item is OrderItem => Boolean(item));

  const finalAmount = pickNumber(rec.final_amount, rec.total_amount, rec.total) ?? 0;
  const totalAmount = pickNumber(rec.total_amount, rec.final_amount, rec.total) ?? finalAmount;

  return {
    id,
    order_code: orderCode,
    status,
    total_amount: totalAmount,
    final_amount: finalAmount,
    discount_amount: discountAmount,
    promotion_code: promotionCode,
    created_at: createdAt,
    order_items: orderItems,
  };
};

const unwrapOrders = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  const rootRecord = toRecord(value);
  if (!rootRecord) return [];

  const directContent = pickArray(rootRecord.content);
  if (directContent) return directContent;

  const directOrders = pickArray(rootRecord.orders);
  if (directOrders) return directOrders;

  const dataRecord = toRecord(rootRecord.data);
  if (dataRecord) {
    const nestedContent = pickArray(dataRecord.content);
    if (nestedContent) return nestedContent;

    const nestedOrders = pickArray(dataRecord.orders);
    if (nestedOrders) return nestedOrders;
  }

  const dataArray = pickArray(rootRecord.data);
  if (dataArray) return dataArray;

  return [];
};

const getStatusColor = (s?: string): ChipProps['color'] => colorOf(s);

const OrderHistoryPanel: React.FC = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const vnd = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }), []);
  const fmtVnd = useCallback((n?: number) => vnd.format(Number(n ?? 0)), [vnd]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get<unknown>('/orders/my-orders', { signal: controller.signal });
        if (!mounted) return;

        const rawOrders = unwrapOrders(resp);
        const list = rawOrders
          .map((order, idx) => parseOrder(order, idx))
          .filter((order): order is OrderSummary => Boolean(order));

        setOrders(list);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if ((err as { name?: string })?.name === 'CanceledError') return;
        const message = (err as { message?: string })?.message ?? 'Không thể tải lịch sử đơn hàng';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (user?.id || token) {
      load();
    }
    return () => { mounted = false; controller.abort(); };
  }, [user?.id]);

  const toggle = (id: string) => setOpenMap((m) => ({ ...m, [id]: !m[id] }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  const filteredOrders = statusFilter
    ? orders.filter(o => (o.status || '').toUpperCase() === statusFilter.toUpperCase())
    : orders;

  if (!filteredOrders.length) return <Typography>Không có đơn hàng phù hợp</Typography>;

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom> Lịch sử đơn hàng </Typography>
      {/* Bộ lọc trạng thái client-side */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label="Tất cả"
          size="small"
          color={!statusFilter ? 'primary' : 'default'}
          onClick={() => setStatusFilter('')}
        />
        {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
          <Chip
            key={s}
            label={labelOf(s) || s}
            size="small"
            color={statusFilter === s ? 'primary' : 'default'}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </Stack>
      <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
        <InputLabel>Trạng thái</InputLabel>
        <Select
          native
          value={statusFilter}
          onChange={(e: any) => setStatusFilter(e.target.value)}
          label="Trạng thái"
        >
          <option value="">Tất cả</option>
          {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
            <option key={s} value={s}>{labelOf(s)}</option>
          ))}
        </Select>
      </FormControl>
      <Stack spacing={2}>
        {filteredOrders.map((o) => {
          const expanded = Boolean(openMap[o.id]);
          const createdLabel = o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : 'Chưa cập nhật';
          return (
            <Paper key={o.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1.5}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>#{o.order_code ?? o.id}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ngày tạo: {createdLabel}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={labelOf(o.status) || 'Không xác định'} size="small" color={getStatusColor(o.status)} />
                    <Button size="small" component={RouterLink} to={`/order/${o.id}`} variant="outlined">
                      Xem chi tiết
                    </Button>
                    <IconButton onClick={() => toggle(o.id)} aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}>
                      {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Stack>
                </Stack>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Giá trị cuối:&nbsp;
                    <Typography component="span" color="text.primary" fontWeight={600}>
                      {fmtVnd(o.final_amount ?? o.total_amount)}
                    </Typography>
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    {o.promotion_code && (
                      <Chip label={`Mã ưu đãi ${o.promotion_code}`} size="small" color="primary" variant="outlined" />
                    )}
                    {o.discount_amount ? (
                      <Typography variant="body2" color="success.main">
                        Đã giảm {fmtVnd(o.discount_amount)}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>
              </Stack>

              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  {(o.order_items || []).map((it) => (
                    <Stack
                      key={it.id}
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                      justifyContent="space-between"
                    >
                      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
                        <Avatar
                          variant="rounded"
                          src={it.image ?? undefined}
                          alt={it.product_name}
                          sx={{ width: 46, height: 46 }}
                        >
                          {it.product_name?.charAt(0) ?? 'P'}
                        </Avatar>
                        <Box>
                          <Link component={RouterLink} to={`/product/${it.product_id}`} underline="hover">
                            {it.product_name}
                          </Link>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {it.quantity} x {fmtVnd(it.unit_price)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>{fmtVnd(it.total_price)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
};

export default OrderHistoryPanel;
