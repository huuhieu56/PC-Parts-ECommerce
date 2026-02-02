import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Stack,
  Paper,
  Chip,
  ListItemAvatar,
  Avatar,
  Alert,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useSnackbar } from '../../hooks/useSnackbar';
import { cartService } from '../../services/cart.service';
import { api } from '../../services/api';
import { promotionService } from '../../services/promotion.service';

type DisplayItem = {
  id: string | number;
  name?: string;
  quantity: number;
  price: number;
  total?: number;
  category?: string;
  image?: string | null;
};

type PromotionSummary = {
  id: number | string;
  name: string;
  code?: string | null;
  description?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
  discount_type?: string | null;
  discount_value?: number | null;
  minimumOrderAmount?: number | null;
  minimum_order_amount?: number | null;
  estimatedSavings?: number;
};

type BuildPcItem = {
  product_id: number | string;
  product_name?: string;
  name?: string;
  quantity?: number;
  unit_price?: number;
  category_name?: string;
  thumbnail?: string | null;
  image_url?: string | null;
};

type CartItem = {
  id?: number | string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  product_id?: number | string;
  product?: {
    id?: number | string;
    name?: string;
    price?: number;
    thumbnail?: string | null;
    image_url?: string | null;
    category?: {
      name?: string;
    } | null;
  } | null;
};

type CreatedOrderSummary = {
  id?: number | string;
  order_code?: string;
};

type CartSnapshotEntry = {
  product_id: number;
  quantity: number;
};

type OrderCreatePayload = {
  shipping_address: string;
  shipping_phone: string;
  customer_name: string;
  customer_email: string;
  notes: string;
  promotion_id?: number | string;
};

type BuildPcCheckoutSession = {
  source: 'buildpc';
  created_at?: number;
  items: BuildPcItem[];
};

interface RowProps {
  label: string;
  value?: number;
  formatter?: (value?: number) => ReactNode;
  helperText?: string;
}

const Row: React.FC<RowProps> = ({ label, value, formatter, helperText }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Box>
      <Typography color="text.secondary">{label}</Typography>
      {helperText && (
        <Typography variant="caption" color="text.secondary">{helperText}</Typography>
      )}
    </Box>
    <Typography fontWeight={500}>
      {formatter ? formatter(value ?? 0) : formatCurrency(value)}
    </Typography>
  </Stack>
);

const BUILD_PC_PREFIX = 'BUILD PC';

const normalizeBuildPcNote = (value: string) => {
  const trimmedLeading = (value ?? '').replace(/^\s+/, '');
  const regex = new RegExp(`^${BUILD_PC_PREFIX}\\s*`, 'i');
  const body = trimmedLeading.replace(regex, '').trim();
  if (!body) return `${BUILD_PC_PREFIX} `;
  return `${BUILD_PC_PREFIX} ${body}`;
};

const VAT_RATE = 0.1;
const SHIPPING_FREE_THRESHOLD = 1_000_000;
const SHIPPING_FEE = 50_000;

const formatCurrency = (value?: number) => `${Number(value ?? 0).toLocaleString('vi-VN')} VND`;

const extractCartSnapshot = (cartItems: CartItem[] | undefined | null): CartSnapshotEntry[] => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return [];
  return cartItems
    .map((item) => {
      const candidates = [
        item.product_id,
        (item as any)?.productId,
        item.product?.id,
        (item as any)?.product?.product_id,
      ];
      const productId = candidates
        .map((candidate) => {
          const parsed = Number(candidate);
          return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        })
        .find((parsed) => parsed !== null);
      const quantity = Number(item.quantity ?? 0);
      if (!productId || quantity <= 0 || Number.isNaN(quantity)) return null;
      return { product_id: productId, quantity };
    })
    .filter((entry): entry is CartSnapshotEntry => Boolean(entry));
};

const computeTaxAmount = (subtotal: number) => Math.round(Math.max(subtotal, 0) * VAT_RATE);
const computeShippingCost = (subtotal: number) => (subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FEE);
const computeFinalTotal = (subtotal: number, tax: number, shipping: number, discount: number) =>
  Math.max(0, subtotal + tax + shipping - discount);

const OrderCreatePage: React.FC = () => {
  const { items, summary, refreshCart, is_guest_mode } = useCart() as any;
  const { showSuccess, showError } = useSnackbar();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { items?: BuildPcItem[]; source?: string } | null;
  const checkoutSource = locationState?.source;
  const isBuildPcRoute = location.pathname?.includes('/order/build-pc');
  const allowBuildPcCheckout = checkoutSource === 'buildpc' || isBuildPcRoute;

  const restoreCartSnapshot = useCallback(async (snapshot: CartSnapshotEntry[]) => {
    try {
      await cartService.clearCart();
    } catch (err) {
      console.warn('OrderCreatePage: clear cart before restore failed', err);
    }

    if (snapshot.length > 0) {
      for (const line of snapshot) {
        try {
          await cartService.addToCart({ product_id: line.product_id, quantity: line.quantity });
        } catch (err) {
          console.error('OrderCreatePage: restore cart item failed', err);
        }
      }
    }

    try {
      await refreshCart();
    } catch (err) {
      console.warn('OrderCreatePage: refresh cart after restore failed', err);
    }
  }, [refreshCart]);

  // Nếu đi từ Build PC, có thể có danh sách linh kiện truyền qua state hoặc sessionStorage
  const buildPcItems = useMemo<BuildPcItem[] | null>(() => {
    if (!allowBuildPcCheckout) return null;
    const stateItems = locationState?.items;
    if (Array.isArray(stateItems) && stateItems.length > 0) return stateItems;
    try {
      const persisted = sessionStorage.getItem('build_pc_checkout');
      if (persisted) {
        const parsed: unknown = JSON.parse(persisted);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as BuildPcItem[];
        if (parsed && typeof parsed === 'object') {
          const sessionPayload = parsed as BuildPcCheckoutSession;
          if (sessionPayload.source === 'buildpc' && Array.isArray(sessionPayload.items) && sessionPayload.items.length > 0) {
            return sessionPayload.items;
          }
        }
      }
    } catch {
      /* noop */
    }
    return null;
  }, [allowBuildPcCheckout, locationState]);

  const buildSubtotal = useMemo(() => {
    return Array.isArray(buildPcItems)
      ? buildPcItems.reduce((sum: number, it) => (
        sum + Number(it.unit_price ?? 0) * Number(it.quantity ?? 1)
      ), 0)
      : 0;
  }, [buildPcItems]);

  // Trường thông tin khách hàng & giao hàng
  const [shippingAddress, setShippingAddress] = useState<string>((summary as any)?.shipping_address || '');
  const [shippingPhone, setShippingPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{ customerName?: string; shippingPhone?: string; shippingAddress?: string }>({});

  // Khuyến mãi
  const [applying, setApplying] = useState(false);
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [promotions, setPromotions] = useState<PromotionSummary[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);

  // Đơn hàng tạo thành công
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderSummary | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const usingBuildPc = useMemo(() => allowBuildPcCheckout && Array.isArray(buildPcItems) && buildPcItems.length > 0, [allowBuildPcCheckout, buildPcItems]);

  // If the user came from the Build PC flow, prefill and lock the notes with a BUILD PC prefix
  useEffect(() => {
    if (usingBuildPc) {
      setNotes((prev) => normalizeBuildPcNote(prev));
    }
  }, [usingBuildPc]);

  const computedBuildPcQuantity = useMemo(() => {
    if (!usingBuildPc || !Array.isArray(buildPcItems)) return 0;
    return buildPcItems.reduce((sum, it) => sum + Number(it.quantity ?? 1), 0);
  }, [usingBuildPc, buildPcItems]);

  const baseSummary = useMemo(() => {
    if (usingBuildPc) {
      const taxAmount = computeTaxAmount(buildSubtotal);
      const shippingCost = computeShippingCost(buildSubtotal);
      const totalAmount = buildSubtotal + taxAmount + shippingCost;
      const finalAmount = computeFinalTotal(buildSubtotal, taxAmount, shippingCost, 0);
      return {
        subtotal: buildSubtotal,
        total_amount: totalAmount,
        final_amount: finalAmount,
        total_quantity: computedBuildPcQuantity,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        discount_amount: 0,
        promotion: null,
      };
    }

    if (summary) {
      const subtotal = Number(summary.subtotal ?? summary.total_amount ?? 0);
      const taxAmount = Number(summary.tax_amount ?? 0);
      const shippingCost = Number(summary.shipping_cost ?? 0);
      const discountAmount = Number(summary.discount_amount ?? 0);
      const totalAmount = Number(summary.total_amount ?? (subtotal + taxAmount + shippingCost));
      const finalAmount = Number(summary.final_amount ?? computeFinalTotal(subtotal, taxAmount, shippingCost, discountAmount));
      return {
        subtotal,
        total_amount: totalAmount,
        final_amount: finalAmount,
        total_quantity: Number(summary.total_quantity ?? 0),
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        promotion: summary.promotion ?? null,
      };
    }

    return {
      subtotal: 0,
      total_amount: 0,
      final_amount: 0,
      total_quantity: 0,
      shipping_cost: 0,
      tax_amount: 0,
      discount_amount: 0,
      promotion: null,
    };
  }, [usingBuildPc, buildSubtotal, computedBuildPcQuantity, summary]);

  const baseSignature = useMemo(() => {
    return [
      usingBuildPc ? 'buildpc' : 'cart',
      Number(baseSummary.subtotal ?? 0),
      Number(baseSummary.total_amount ?? 0),
      Number(baseSummary.final_amount ?? 0),
      Number(baseSummary.total_quantity ?? 0),
      Number(baseSummary.shipping_cost ?? 0),
      Number(baseSummary.tax_amount ?? 0),
    ].join('|');
  }, [usingBuildPc, baseSummary]);

  const [localSummary, setLocalSummary] = useState<any>(() => ({ ...baseSummary, __baseSignature: baseSignature }));

  useEffect(() => {
    setLocalSummary((prev: any) => {
      if (!prev || prev.__baseSignature !== baseSignature) {
        return { ...baseSummary, __baseSignature: baseSignature };
      }
      return prev;
    });
  }, [baseSummary, baseSignature]);

  const promotionEligibleSubtotal = Math.max(0, Number(baseSummary?.subtotal ?? 0));

  const estimatePromotionSavings = useCallback((promo: PromotionSummary, orderAmount: number) => {
    if (!promo || orderAmount <= 0) return 0;
    const minOrder = Number(promo.minimumOrderAmount ?? promo.minimum_order_amount ?? 0);
    if (minOrder > 0 && orderAmount < minOrder) return 0;
    const rawValue = Number(promo.discountValue ?? promo.discount_value ?? 0);
    if (!rawValue || Number.isNaN(rawValue)) return 0;
    const type = String(promo.discountType ?? promo.discount_type ?? '').toUpperCase();
    if (type === 'PERCENTAGE') {
      return Math.max(0, Math.round((orderAmount * rawValue) / 100));
    }
    return Math.max(0, Math.min(orderAmount, Math.round(rawValue)));
  }, []);

  const openPromoDialog = () => {
    setError(null);
    setPromoDialogOpen(true);
  };

  useEffect(() => {
    if (!promoDialogOpen) return;
    let cancelled = false;
    const fetchPromotions = async () => {
      setLoadingPromotions(true);
      try {
        const price = promotionEligibleSubtotal;
        const list = price > 0
          ? await promotionService.getApplicablePromotions(price)
          : await promotionService.getActivePromotions();
        if (cancelled) return;
        const normalized = Array.isArray(list)
          ? list.map((promo: any) => {
            const normalizedItem: PromotionSummary = {
              id: promo.id,
              name: promo.name,
              code: promo.code ?? promo.promotion_code ?? null,
              description: promo.description ?? null,
              discountType: promo.discount_type ?? promo.discountType ?? null,
              discountValue: Number(promo.discount_value ?? promo.discountValue ?? 0) || null,
              discount_type: promo.discount_type ?? null,
              discount_value: Number(promo.discount_value ?? promo.discountValue ?? 0) || null,
              minimumOrderAmount: promo.minimum_order_amount ?? promo.minimumOrderAmount ?? null,
              minimum_order_amount: promo.minimum_order_amount ?? null,
            };
            normalizedItem.estimatedSavings = estimatePromotionSavings(normalizedItem, price);
            return normalizedItem;
          })
          : [];
        normalized.sort((a, b) => (b.estimatedSavings ?? 0) - (a.estimatedSavings ?? 0));
        setPromotions(normalized);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        console.error('OrderCreatePage: load promotions failed', e);
        setPromotions([]);
        setError('Không thể tải danh sách khuyến mãi');
      } finally {
        if (!cancelled) {
          setLoadingPromotions(false);
        }
      }
    };

    fetchPromotions();
    return () => {
      cancelled = true;
    };
  }, [promoDialogOpen, promotionEligibleSubtotal, estimatePromotionSavings]);

  const handleApplyPromotionFromList = async (promo: PromotionSummary) => {
    setApplying(true);
    try {
      const promoIdNumber = Number(promo.id);
      if (Number.isNaN(promoIdNumber)) throw new Error('Mã khuyến mãi không hợp lệ');
      const calc = await cartService.calculateDiscountForPromotion(
        promoIdNumber,
        Array.isArray(buildPcItems) ? buildSubtotal : Number(summary?.subtotal ?? summary?.total_amount ?? 0)
      );
      if (!calc) throw new Error('Không thể tính toán giảm giá');
      const discountValue = Number(calc.discount_amount || 0);
      setLocalSummary((prev: any) => {
        const subtotal = Number((prev?.subtotal ?? baseSummary.subtotal) ?? 0);
        const taxAmount = Number((prev?.tax_amount ?? baseSummary.tax_amount) ?? 0);
        const shippingCost = Number((prev?.shipping_cost ?? baseSummary.shipping_cost) ?? 0);
        const finalAmount = computeFinalTotal(subtotal, taxAmount, shippingCost, discountValue);
        return {
          ...prev,
          discount_amount: discountValue,
          promotion: { id: promo.id, code: promo.code || promo.name, name: promo.name },
          final_amount: finalAmount,
        };
      });
      setError(null);
      setPromoDialogOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Áp mã thất bại');
    } finally {
      setApplying(false);
    }
  };

  const handleRemovePromotion = () => {
    setLocalSummary((prev: any) => {
      const subtotal = Number((prev?.subtotal ?? baseSummary.subtotal) ?? 0);
      const taxAmount = Number((prev?.tax_amount ?? baseSummary.tax_amount) ?? 0);
      const shippingCost = Number((prev?.shipping_cost ?? baseSummary.shipping_cost) ?? 0);
      const finalAmount = computeFinalTotal(subtotal, taxAmount, shippingCost, 0);
      return {
        ...prev,
        discount_amount: 0,
        promotion: null,
        final_amount: finalAmount,
      };
    });
  };

  const handleCreateOrder = async () => {
    setCreating(true);
    const cartSnapshot = usingBuildPc ? extractCartSnapshot(items as CartItem[]) : [];
    let cartSyncedWithBuildPc = false;
    let shouldRefreshCartAfterOrder = false;
    try {
      if (!usingBuildPc && (!items || items.length === 0)) {
        showError('Không thể tạo đơn: giỏ hàng không có sản phẩm');
        return;
      }

      // Validate
      const errors: { customerName?: string; shippingPhone?: string; shippingAddress?: string } = {};
      if (!customerName.trim()) errors.customerName = 'Tên khách hàng không được để trống';
      if (!shippingPhone.trim()) errors.shippingPhone = 'Số điện thoại giao hàng không được để trống';
      else if (!/^[0-9]+$/.test(shippingPhone)) errors.shippingPhone = 'Số điện thoại chỉ chứa chữ số';
      if (!shippingAddress.trim()) errors.shippingAddress = 'Địa chỉ giao hàng không được để trống';
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        showError('Vui lòng sửa các lỗi trên form');
        return;
      }

      // Ensure orders created from Build PC have the BUILD PC prefix in notes
      let notesToSend = notes ?? '';
      if (usingBuildPc) {
        notesToSend = normalizeBuildPcNote(notesToSend).trimEnd();
      }

      const payload: OrderCreatePayload = {
        shipping_address: shippingAddress,
        shipping_phone: shippingPhone,
        customer_name: customerName,
        customer_email: customerEmail,
        notes: notesToSend,
      };

      if (localSummary?.promotion?.id) {
        const promoIdRaw = localSummary.promotion.id;
        const promoId = Number(promoIdRaw);
        if (Number.isNaN(promoId)) {
          showError('Mã khuyến mãi không hợp lệ hoặc không áp dụng cho đơn hàng này');
          return;
        }
        const subtotal = Number(localSummary?.subtotal ?? baseSummary.subtotal ?? summary?.subtotal ?? 0);
        const calc = await cartService.calculateDiscountForPromotion(promoId, subtotal);
        if (!calc || Number(calc.discount_amount) <= 0) {
          showError('Mã khuyến mãi không hợp lệ hoặc không áp dụng cho đơn hàng này');
          return;
        }
        payload.promotion_id = promoId;
      }

      if (usingBuildPc && Array.isArray(buildPcItems)) {
        if (is_guest_mode) {
          showError('Vui lòng đăng nhập để tạo đơn hàng từ cấu hình này');
          navigate('/login', { state: { returnUrl: '/order/create' } });
          return;
        }
        try {
          await cartService.clearCart();
          cartSyncedWithBuildPc = true;
          for (const it of buildPcItems) {
            const productId = Number(it.product_id);
            if (!productId || Number.isNaN(productId)) {
              throw new Error(`Sản phẩm ${it.product_name || it.name || 'không xác định'} không hợp lệ`);
            }
            const quantity = Math.max(1, Number(it.quantity ?? 1) || 1);
            await cartService.addToCart({ product_id: productId, quantity });
          }
        } catch (syncError: any) {
          console.error('OrderCreatePage: sync build pc items failed', syncError);
          const syncMessage = syncError?.message || syncError?.response?.data?.message || 'Không thể đồng bộ cấu hình Build PC vào giỏ hàng. Vui lòng thử lại.';
          showError(syncMessage);
          return;
        }
      }

      const resp = await api.post<any>('/orders/from-cart', payload);
      const body = resp && resp.data ? resp.data : resp;
      const created: any = body?.data || body;
      showSuccess('Tạo đơn hàng thành công');
      try { sessionStorage.removeItem('build_pc_checkout'); } catch { }
      setCreatedOrder(created);
      setSuccessDialogOpen(true);
      shouldRefreshCartAfterOrder = !usingBuildPc;
    } catch (e) {
      console.error('OrderCreatePage: create order error', e);
      const resp = (e as any)?.response?.data;
      if (resp) {
        const msg = resp.message || 'Tạo đơn hàng thất bại';
        const data = resp.data;
        if (Array.isArray(data) && data.length > 0) showError(data.join('; '));
        else showError(msg);
      } else showError('Tạo đơn hàng thất bại');
    } finally {
      if (usingBuildPc && cartSyncedWithBuildPc) {
        await restoreCartSnapshot(cartSnapshot);
      } else if (!usingBuildPc && shouldRefreshCartAfterOrder) {
        try {
          await refreshCart();
        } catch (err) {
          console.warn('OrderCreatePage: refresh cart after order failed', err);
        }
      }
      setCreating(false);
    }
  };

  const displayItems = useMemo<DisplayItem[]>(() => {
    if (Array.isArray(buildPcItems) && buildPcItems.length > 0) {
      return buildPcItems.map((it) => ({
        id: `${it.product_id}-buildpc`,
        name: it.product_name || it.name,
        quantity: it.quantity ?? 1,
        price: Number(it.unit_price ?? 0),
        category: it.category_name,
        image: it.thumbnail || it.image_url,
      }));
    }
    return ((items || []) as CartItem[]).map((it, index) => ({
      id: it.id || it.product?.id || `cart-${index}`,
      name: it.product?.name,
      quantity: it.quantity,
      price: Number(it.unit_price ?? it.product?.price ?? 0),
      total: Number(it.total_price ?? (it.unit_price ?? it.product?.price ?? 0) * it.quantity),
      category: it.product?.category?.name ?? undefined,
      image: it.product?.thumbnail || it.product?.image_url || null,
    }));
  }, [buildPcItems, items]);

  const summaryDisplay = useMemo(() => {
    const subtotal = Number(localSummary?.subtotal ?? baseSummary.subtotal ?? 0);
    const taxAmount = Number(localSummary?.tax_amount ?? baseSummary.tax_amount ?? 0);
    const shippingCost = Number(localSummary?.shipping_cost ?? baseSummary.shipping_cost ?? 0);
    const discountAmount = Number(localSummary?.discount_amount ?? baseSummary.discount_amount ?? 0);
    const totalAmount = Number(localSummary?.total_amount ?? baseSummary.total_amount ?? 0);
    const finalAmount = Number(localSummary?.final_amount ?? baseSummary.final_amount ?? 0);
    const totalQuantity = Number(localSummary?.total_quantity ?? baseSummary.total_quantity ?? displayItems.length ?? 0);
    return {
      subtotal,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      final_amount: finalAmount,
      total_quantity: totalQuantity,
    };
  }, [localSummary, baseSummary, displayItems.length]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Tạo đơn hàng mới</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Hoàn thiện thông tin giao hàng và xác nhận đơn hàng của bạn.
          </Typography>
        </Box>

        {is_guest_mode && (
          <Alert severity="info">
            Bạn đang ở chế độ khách. Vui lòng đăng nhập để lưu lịch sử và theo dõi trạng thái đơn hàng dễ dàng hơn.
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'stretch',
            gap: 3,
          }}
        >
          <Box sx={{ flex: { lg: 1 }, width: '100%' }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600}>Thông tin giao hàng</Typography>
              <Stack spacing={2.25} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Tên khách hàng"
                  value={customerName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomerName(v);
                    if (formErrors.customerName && v.trim().length > 0) setFormErrors(prev => ({ ...prev, customerName: undefined }));
                  }}
                  error={Boolean(formErrors.customerName)}
                  helperText={formErrors.customerName}
                />
                <TextField
                  fullWidth
                  label="Email"
                  placeholder="example@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Số điện thoại giao hàng"
                  value={shippingPhone}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || /^[0-9]*$/.test(v)) {
                      setShippingPhone(v);
                      if (formErrors.shippingPhone && v.trim().length > 0) setFormErrors(prev => ({ ...prev, shippingPhone: undefined }));
                    }
                  }}
                  error={Boolean(formErrors.shippingPhone)}
                  helperText={formErrors.shippingPhone}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Địa chỉ giao hàng"
                  value={shippingAddress}
                  onChange={(e) => {
                    const v = e.target.value;
                    setShippingAddress(v);
                    if (formErrors.shippingAddress && v.trim().length > 0) setFormErrors(prev => ({ ...prev, shippingAddress: undefined }));
                  }}
                  error={Boolean(formErrors.shippingAddress)}
                  helperText={formErrors.shippingAddress}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Ghi chú thêm"
                  helperText={usingBuildPc ? 'Đơn hàng Build PC luôn có tiền tố BUILD PC trong ghi chú.' : undefined}
                  value={notes}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (usingBuildPc) {
                      setNotes(normalizeBuildPcNote(value));
                    } else {
                      setNotes(value);
                    }
                  }}
                />
              </Stack>
            </Paper>
          </Box>

          <Box sx={{ flex: { lg: 1.2 }, width: '100%' }}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>Danh sách sản phẩm</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {Array.isArray(buildPcItems) && buildPcItems.length > 0
                        ? 'Đơn hàng đang sử dụng cấu hình PC đã lưu.'
                        : 'Kiểm tra lại sản phẩm trước khi gửi yêu cầu.'}
                    </Typography>
                  </Box>
                  {Array.isArray(buildPcItems) && buildPcItems.length > 0 && (
                    <Chip size="small" color="primary" label="Build PC" />
                  )}
                </Stack>

                {displayItems.length === 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography color="text.secondary">
                      Giỏ hàng đang trống. Bạn hãy thêm sản phẩm trước khi tạo đơn nhé.
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ mt: 2 }}>
                    {displayItems.map((item, index) => (
                      <ListItem
                        key={item.id}
                        disableGutters
                        sx={{
                          alignItems: 'flex-start',
                          px: 0,
                          py: 1.5,
                          borderBottom: index === displayItems.length - 1 ? 'none' : '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            variant="rounded"
                            src={item.image ?? undefined}
                            alt={item.name}
                            sx={{ width: 56, height: 56, mr: 2 }}
                          >
                            {item.name?.charAt(0) ?? 'P'}
                          </Avatar>
                        </ListItemAvatar>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          justifyContent="space-between"
                          sx={{ flex: 1 }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography component="div" fontWeight={600}>
                              {item.name || 'Không xác định'}
                            </Typography>
                            <Stack
                              component="div"
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              sx={{ mt: 0.5, color: 'text.secondary' }}
                            >
                              <Typography component="span" variant="body2">
                                Số lượng: {item.quantity}
                              </Typography>
                              {item.category && (
                                <Typography component="span" variant="body2">
                                  | {item.category}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                          <Typography component="div" fontWeight={600} color="text.primary">
                            {((item.total ?? item.price * item.quantity) || 0).toLocaleString('vi-VN')} VND
                          </Typography>
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600}>Khuyến mãi</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={openPromoDialog} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    Chọn mã giảm giá
                  </Button>
                  {localSummary?.promotion && (
                    <Chip
                      label={localSummary.promotion?.code || localSummary.promotion?.name}
                      onDelete={handleRemovePromotion}
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Các chương trình ưu đãi có thể thay đổi theo thời gian. Vui lòng kiểm tra điều kiện áp dụng trước khi gửi đơn.
                </Typography>
              </Paper>

              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>Tóm tắt đơn hàng</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Kiểm tra nhanh chi tiết giá trước khi tạo đơn hàng.
                    </Typography>
                  </Box>
                  <Stack spacing={1.25}>
                    <Row
                      label={`Sản phẩm (${summaryDisplay.total_quantity || displayItems.length})`}
                      value={summaryDisplay.subtotal}
                    />
                    <Row
                      label="Thuế VAT (10%)"
                      value={summaryDisplay.tax_amount}
                    />
                    <Row
                      label="Phí vận chuyển"
                      value={summaryDisplay.shipping_cost}
                      formatter={(value) => (value && value > 0 ? formatCurrency(value) : 'Miễn phí')}
                      helperText={summaryDisplay.shipping_cost === 0 ? 'Miễn phí cho đơn từ 1.000.000đ' : undefined}
                    />
                    {summaryDisplay.discount_amount > 0 && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography color="text.secondary">Khuyến mãi</Typography>
                        <Typography color="success.main">- {formatCurrency(summaryDisplay.discount_amount)}</Typography>
                      </Stack>
                    )}
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Tổng giá trị</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {formatCurrency(summaryDisplay.final_amount || summaryDisplay.total_amount)}
                    </Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 1, py: 1.5, fontWeight: 600 }}
                    onClick={handleCreateOrder}
                    disabled={creating || displayItems.length === 0}
                  >
                    {creating ? 'Đang tạo đơn...' : 'Tạo đơn hàng'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Sau khi gửi yêu cầu, đội ngũ Computer Shop sẽ liên hệ để xác nhận chi tiết giao hàng.
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Stack>

      {/* Dialog chọn khuyến mãi */}
      <Dialog open={promoDialogOpen} onClose={() => setPromoDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Chọn mã giảm giá</DialogTitle>
        <DialogContent>
          {loadingPromotions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <List>
              {promotions.length === 0 && <Typography>Không có mã giảm giá nào</Typography>}
              {promotions.map((p) => {
                const minAmount = p.minimumOrderAmount ? `Đơn tối thiểu: ${formatCurrency(p.minimumOrderAmount)}` : 'Không yêu cầu giá trị tối thiểu';
                const discountLabel = p.discountType === 'PERCENTAGE'
                  ? `${p.discountValue ?? 0}%`
                  : `${formatCurrency(p.discountValue ?? 0)}`;
                return (
                  <ListItem key={p.id} secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" onClick={() => handleApplyPromotionFromList(p)} disabled={applying}>
                        {applying ? <CircularProgress size={18} /> : 'Áp dụng'}
                      </Button>
                    </Box>
                  }>
                    <ListItemText
                      primary={`${p.name}${p.code ? ` (${p.code})` : ''}`}
                      secondary={
                        <Stack spacing={0.5}>
                          {p.description && <Typography variant="body2">{p.description}</Typography>}
                          <Typography variant="caption" color="text.secondary">
                            Giá trị giảm: {discountLabel}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{minAmount}</Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog thành công */}
      <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Tạo đơn hàng thành công</DialogTitle>
        <DialogContent>
          <Typography>Đơn hàng của bạn đã được tạo thành công.</Typography>
          {createdOrder?.id && <Typography sx={{ mt: 1 }}>ID đơn hàng: {createdOrder.id}</Typography>}
          {createdOrder?.order_code && <Typography>Mã đơn hàng: {createdOrder.order_code}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSuccessDialogOpen(false);
            setTimeout(() => navigate(`/order/${createdOrder?.id}`), 100);
          }}>Xem đơn hàng</Button>
          <Button onClick={() => { setSuccessDialogOpen(false); navigate('/products'); }} autoFocus>Tiếp tục mua sắm</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
export default OrderCreatePage;
