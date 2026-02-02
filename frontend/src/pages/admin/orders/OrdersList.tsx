import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Stack
} from '@mui/material';
import { Visibility as ViewIcon, MoreVert as MoreVertIcon, Refresh as RefreshIcon, Edit as EditIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderService } from '../../../services/order.service';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useDebounce } from '../../../hooks/useDebounce';
import AdminFiltersBar from '../../../components/common/AdminFiltersBar';
import { ORDER_STATUSES } from '../../../types/order.types';
import { getOrderStatusColor, getOrderStatusLabel, isCancelableStatus } from '../../../utils/orderStatus';

const PAGE_SIZE = 10;

const OrdersList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const parsedUserId = userIdParam ? Number(userIdParam) : NaN;
  const hasUserScope = Number.isFinite(parsedUserId);
  const userIdFilter = hasUserScope ? parsedUserId : undefined;
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [filters, setFilters] = useState({ status: '' });
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);
  const title = userIdFilter !== undefined ? 'Lịch sử đơn hàng' : 'Quản lý đơn hàng';
  const subtitle = userIdFilter !== undefined ? `Người dùng #${userIdFilter}` : '';

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let response: any;
      if (userIdFilter !== undefined) {
        const userOpts: any = { page, size: PAGE_SIZE };
        if (filters.status) userOpts.status = filters.status;
        if (debouncedSearchKeyword && debouncedSearchKeyword.trim()) {
          userOpts.search = debouncedSearchKeyword.trim();
        }
        response = await orderService.getUserOrders(userIdFilter, userOpts);
      } else {
        const opts: any = { page, size: PAGE_SIZE, sort: 'createdAt,desc' };
        if (filters.status) opts.status = filters.status;
        if (debouncedSearchKeyword && debouncedSearchKeyword.trim()) {
          opts.search = debouncedSearchKeyword.trim();
        }

        // Ưu tiên gọi endpoint theo trạng thái nếu có chọn status để đảm bảo backend thực sự lọc
        if (filters.status) {
          try {
            response = await orderService.getOrdersByStatus(filters.status, { page, size: PAGE_SIZE, sort: 'createdAt,desc' });
          } catch (_) {
            // Fallback về endpoint chung (một số backend chỉ hỗ trợ /orders?status=...)
            response = await orderService.getOrders(opts);
          }
        } else {
          // Không có status -> gọi endpoint chung
          response = await orderService.getOrders(opts);
        }
      }

      // Chuẩn hóa dữ liệu và fallback lọc client-side nếu backend bỏ qua tham số status
      const rawItems = response.content || [];
      const items = filters.status
        ? rawItems.filter((o: any) => ((o?.status || '') as string).toUpperCase() === filters.status)
        : rawItems;
      setOrders(items);
      // Nếu dùng fallback client-side, total sẽ phản ánh số phần tử trang hiện tại; còn nếu backend trả đúng thì total từ server
      const serverTotal = response.totalElements || response.total_elements;
      setTotal(typeof serverTotal === 'number' && !Number.isNaN(serverTotal) ? serverTotal : items.length);
    } catch (err: any) {
      showError('Không tải được danh sách đơn hàng: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page, status or debounced search changes
  useEffect(() => { fetchOrders(); }, [page, filters.status, debouncedSearchKeyword, userIdFilter]);

  useEffect(() => {
    setPage(0);
  }, [userIdFilter]);

  useEffect(() => {
    setSearchKeyword('');
  }, [userIdFilter]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };
  const handleMenuClose = () => { setAnchorEl(null); };
  const handleViewOrder = (order: any) => { navigate(`/admin/orders/${order.id}`); handleMenuClose(); setSelectedOrder(null); };
  const handleUpdateStatus = (order: any) => {
    setSelectedOrder(order);
    setNewStatus((order.status || 'PENDING').toUpperCase());
    setStatusDialogOpen(true);
    setAnchorEl(null); // close only the menu, keep selectedOrder for dialog
  };

  const handleCancelOrder = async (order: any) => {
    try {
      if (!order) return;
      if ((order.status || '').toUpperCase() !== 'PENDING') {
        showError('Chỉ có thể hủy đơn ở trạng thái CHỜ XỬ LÝ');
        return;
      }
      const confirmed = window.confirm(`Bạn có chắc muốn hủy đơn #${order.order_code ?? order.orderCode ?? order.id}?`);
      if (!confirmed) return;
      await orderService.cancelOrder(order.id);
      showSuccess('Hủy đơn hàng thành công');
      await fetchOrders();
    } catch (err: any) {
      showError('Hủy đơn thất bại: ' + (err?.message || err));
    } finally {
      handleMenuClose();
      setSelectedOrder(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    try {
      const statusToSend = (newStatus || 'PENDING').toUpperCase();
      await orderService.updateOrderStatus(selectedOrder.id, statusToSend);
      showSuccess('Cập nhật trạng thái đơn hàng thành công');
      setStatusDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      showError('Cập nhật trạng thái thất bại: ' + (err.message || err));
    }
  };

  const getStatusColor = (status: string) => getOrderStatusColor(status);
  const getStatusLabel = (status: string) => getOrderStatusLabel(status);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleString('vi-VN') : '-';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchOrders()} disabled={loading}>Làm mới</Button>
        </Box>
      </Box>

      <AdminFiltersBar
        searchValue={searchKeyword}
        onSearchChange={(v) => setSearchKeyword(v)}
  placeholder={userIdFilter !== undefined ? 'Tìm trong lịch sử đơn (giới hạn theo trang hiện tại)...' : 'Tìm mã đơn / username / email / số điện thoại'}
        loading={loading}
        onRefresh={fetchOrders}
        actions={userIdFilter !== undefined ? (
          <Button size="small" onClick={() => navigate('/admin/orders')}>
            Xem tất cả đơn
          </Button>
        ) : undefined}
      >
        {/* Chips lọc nhanh theo trạng thái */}
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Tất cả"
            size="small"
            color={!filters.status ? 'primary' : 'default'}
            onClick={() => setFilters({ ...filters, status: '' })}
          />
          {ORDER_STATUSES.map((s) => (
            <Chip
              key={s}
              label={getOrderStatusLabel(s)}
              size="small"
              color={filters.status?.toUpperCase() === s ? 'primary' : 'default'}
              onClick={() => setFilters({ ...filters, status: s })}
            />
          ))}
        </Stack>

        {/* Đã loại bỏ ô Select trạng thái theo yêu cầu; giữ lại chip lọc nhanh ở trên */}
      </AdminFiltersBar>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã đơn</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Họ tên / Email</TableCell>
                    <TableCell>SĐT</TableCell>
                    <TableCell>Tổng tiền</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell><Typography variant="body2" fontWeight="medium">{order.order_code ?? order.orderCode ?? order.orderCode}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">{order.user_username ?? order.userUsername ?? '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">{order.customer_name ?? order.customerName ?? (order.user_name ?? order.userName) ?? '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">{order.customer_email ?? order.customerEmail ?? order.user_email ?? order.userEmail ?? '-'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{order.shipping_phone ?? order.shippingPhone ?? order.user_phone ?? order.userPhone ?? '-'}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight="medium">{formatCurrency(order.final_amount ?? order.finalAmount)}</Typography></TableCell>
                      <TableCell><Chip label={getStatusLabel(order.status)} color={getStatusColor(order.status) as any} size="small" /></TableCell>
                      <TableCell><Typography variant="body2">{formatDate(order.created_at ?? order.createdAt)}</Typography></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Xem chi tiết"><IconButton size="small" onClick={() => navigate(`/admin/orders/${order.id}`)}><ViewIcon /></IconButton></Tooltip>
                        {isCancelableStatus(order.status) && (
                          <Tooltip title="Hủy đơn">
                            <IconButton size="small" color="error" onClick={() => handleCancelOrder(order)}>
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Thao tác khác"><IconButton size="small" onClick={(e) => handleMenuClick(e, order)}><MoreVertIcon /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2">Hiển thị {orders.length} trên tổng {total} đơn hàng</Typography>
            <Box>
              <Button disabled={page <= 0} onClick={() => setPage(0)}>Đầu</Button>
              <Button disabled={page <= 0} onClick={() => setPage(page - 1)}>Trước</Button>
              <Button disabled>{page + 1}</Button>
              <Button disabled={page >= Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)} onClick={() => setPage(page + 1)}>Sau</Button>
              <Button disabled={page >= Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)} onClick={() => setPage(Math.ceil(total / PAGE_SIZE) - 1)}>Cuối</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => selectedOrder && handleViewOrder(selectedOrder)}><ViewIcon sx={{ mr: 1 }} /> Xem chi tiết</MenuItem>
        <MenuItem onClick={() => selectedOrder && handleUpdateStatus(selectedOrder)}><EditIcon sx={{ mr: 1 }} /> Cập nhật trạng thái</MenuItem>
        {selectedOrder && isCancelableStatus(selectedOrder.status) && (
          <MenuItem onClick={() => handleCancelOrder(selectedOrder)}>
            <CancelIcon sx={{ mr: 1 }} /> Hủy đơn
          </MenuItem>
        )}
      </Menu>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>Đơn hàng: {selectedOrder?.order_code ?? selectedOrder?.orderCode}</Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Trạng thái mới</InputLabel>
              <Select native value={newStatus} onChange={(e: any) => setNewStatus(e.target.value)} label="Trạng thái mới">
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleStatusUpdate} variant="contained">Cập nhật</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersList;
