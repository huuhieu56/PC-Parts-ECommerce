/**
 * 🛒 TRANG GIỎ HÀNG - Computer Shop E-commerce
 *
 * Trang giỏ hàng với quản lý mục (item)
 * Hỗ trợ giỏ hàng cho khách (guest) và người dùng đã đăng nhập
 */

import React, { useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

// Hooks
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from '../../hooks/useSnackbar';

// Types
import type { CartItem } from '../../types/cart.types';

// Định dạng tiền tệ VND
const formatVND = (value?: number | null) =>
  (value ?? 0).toLocaleString('vi-VN') + ' VND';

const CartPage: React.FC = () => {
  const {
    items,
    summary,
    updateItemQuantity,
    removeItem,
    clearAllItems,
    loading,
    error
  } = useCart();

  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  // Sắp xếp item để hiển thị ổn định
  const sortedItems = useMemo(() => {
    return (items || [])
      .slice()
      .sort((a: CartItem, b: CartItem) => {
        const aKey = (a.id ?? a.product?.id) ?? 0;
        const bKey = (b.id ?? b.product?.id) ?? 0;
        return aKey - bKey;
      });
  }, [items]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('Trang Giỏ Hàng: danh sách mục', items);
      console.debug('Trang Giỏ Hàng: tóm tắt', summary);
    }
  }, [items, summary]);

  // Xử lý đổi số lượng
  const handleQuantityChange = async (
    productId: number,
    newQuantity: number,
    cartItemId?: number
  ) => {
    if (newQuantity < 1) return;
    try {
      await updateItemQuantity(productId, newQuantity, cartItemId);
      showSuccess('Cập nhật số lượng thành công');
    } catch {
      showError('Cập nhật số lượng thất bại');
    }
  };

  // Xóa 1 mục khỏi giỏ
  const handleRemoveItem = async (productId: number, cartItemId?: number) => {
    try {
      const result = await removeItem(productId, cartItemId);
      if (result) showSuccess('Đã xóa mục khỏi giỏ hàng');
      else showError('Xóa mục thất bại');
    } catch {
      showError('Xóa mục thất bại');
    }
  };

  // Xóa toàn bộ giỏ
  const handleClearCart = async () => {
    try {
      await clearAllItems();
      showSuccess('Đã xóa toàn bộ giỏ hàng');
    } catch {
      showError('Xóa giỏ hàng thất bại');
    }
  };

  // Trạng thái đang tải
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải giỏ hàng...
        </Typography>
      </Container>
    );
  }

  // Lỗi tải giỏ
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Giỏ trống
  if (!sortedItems || sortedItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingCartIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Giỏ hàng của bạn trống
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Hãy thêm vài sản phẩm để bắt đầu!
          </Typography>
          <Button
            variant="contained"
            component={RouterLink}
            to="/products"
          >
            Tiếp tục mua sắm
          </Button>
        </Box>
      </Container>
    );
  }

  // Nội dung chính
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Giỏ hàng
      </Typography>

      {!isAuthenticated && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Bạn đang mua hàng với tư cách khách. Đăng nhập để lưu giỏ hàng.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Bảng sản phẩm */}
        <Box sx={{ flex: 2 }}>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={2}>
              {sortedItems.map((item: CartItem) => {
                const product = item.product;
                const productId = product?.id;
                const key = item.id ? `cartitem-mobile-${item.id}` : `product-mobile-${productId ?? 'unknown'}`;
                const imageSrc = product?.image_url || '/placeholder-product.jpg';
                const productName = product?.name || 'Sản phẩm không xác định';
                const unitPrice = item.unit_price ?? 0;
                const totalPrice = item.total_price ?? (unitPrice * (item.quantity ?? 0));

                return (
                  <Card key={key} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Box
                          component={productId ? RouterLink : 'div'}
                          to={productId ? `/product/${productId}` : undefined}
                          sx={{
                            display: 'flex',
                            gap: 2,
                            textDecoration: 'none',
                            color: 'inherit',
                            flex: 1
                          }}
                        >
                          <Box
                            component="img"
                            src={imageSrc}
                            alt={productName}
                            sx={{
                              width: 72,
                              height: 72,
                              objectFit: 'contain',
                              borderRadius: 1,
                              bgcolor: 'grey.100'
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                              {productName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Đơn giá: {formatVND(unitPrice)}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => productId && handleRemoveItem(productId, item.id)}
                          aria-label="Xóa khỏi giỏ hàng"
                          size="small"
                          sx={{ ml: 'auto' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => productId && handleQuantityChange(productId, (item.quantity ?? 1) - 1, item.id)}
                            disabled={!productId || (item.quantity ?? 1) <= 1}
                            aria-label="Giảm số lượng"
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body1" sx={{ minWidth: 32, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => productId && handleQuantityChange(productId, (item.quantity ?? 0) + 1, item.id)}
                            aria-label="Tăng số lượng"
                            disabled={!productId}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                          <Typography variant="body2" color="text.secondary">
                            Thành tiền
                          </Typography>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {formatVND(totalPrice)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Box>

          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell align="center">Giá</TableCell>
                  <TableCell align="center">Số lượng</TableCell>
                  <TableCell align="center">Tổng</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedItems.map((item: CartItem) => {
                  const product = item.product;
                  const productId = product?.id;
                  const key = item.id
                    ? `cartitem-${item.id}`
                    : `product-${productId ?? 'unknown'}`;

                  const imageSrc = product?.image_url || '/placeholder-product.jpg';
                  const productName = product?.name || 'Sản phẩm không xác định';
                  const unitPrice = item.unit_price ?? 0;
                  const totalPrice = item.total_price ?? (unitPrice * (item.quantity ?? 0));

                  return (
                    <TableRow key={key}>
                      <TableCell>
                        {productId ? (
                          <Box
                            component={RouterLink}
                            to={`/product/${productId}`}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              textDecoration: 'none',
                              color: 'inherit'
                            }}
                          >
                            <Box
                              component="img"
                              src={imageSrc}
                              alt={productName}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'contain',
                                borderRadius: 1,
                                bgcolor: 'grey.100'
                              }}
                            />
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {productName}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              component="img"
                              src={imageSrc}
                              alt={productName}
                              sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'contain',
                                borderRadius: 1,
                                bgcolor: 'grey.100'
                              }}
                            />
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {productName}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        {formatVND(unitPrice)}
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              productId && handleQuantityChange(productId, (item.quantity ?? 1) - 1, item.id)
                            }
                            disabled={(item.quantity ?? 1) <= 1}
                            aria-label="Giảm số lượng"
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>

                          <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>

                          <IconButton
                            size="small"
                            onClick={() =>
                              productId && handleQuantityChange(productId, (item.quantity ?? 0) + 1, item.id)
                            }
                            aria-label="Tăng số lượng"
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        {formatVND(totalPrice)}
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          color="error"
                          onClick={() => productId && handleRemoveItem(productId, item.id)}
                          aria-label="Xóa khỏi giỏ hàng"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ mt: 2 }}
          >
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearCart}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Xóa giỏ hàng
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/products"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Tiếp tục mua sắm
            </Button>
          </Stack>
        </Box>

  {/* Tóm tắt đơn hàng */}
  <Box sx={{ flex: 1, order: { xs: 1, md: 0 }, mt: { xs: 2, md: 0 } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tóm tắt đơn hàng
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Số mục ({summary?.total_quantity || 0})
                  </Typography>
                  <Typography variant="body2">
                    {formatVND(summary?.subtotal ?? 0)}
                  </Typography>
                </Box>

                {summary?.shipping_cost && summary.shipping_cost > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Phí vận chuyển</Typography>
                    <Typography variant="body2">
                      {formatVND(summary.shipping_cost)}
                    </Typography>
                  </Box>
                )}

                {summary?.tax_amount && summary.tax_amount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Thuế</Typography>
                    <Typography variant="body2">
                      {formatVND(summary.tax_amount)}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Tổng cộng</Typography>
                <Typography variant="h6">
                  {formatVND(summary?.total_amount ?? 0)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={!isAuthenticated}
                component={RouterLink}
                to={isAuthenticated ? '/order/create' : '/login?returnUrl=/order/create'}
              >
                {isAuthenticated ? 'Mua hàng' : 'Đăng nhập để mua hàng'}
              </Button>

              {!isAuthenticated && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block', textAlign: 'center' }}
                >
                  Bạn cần đăng nhập để thanh toán
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default CartPage;
