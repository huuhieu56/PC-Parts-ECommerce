import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  MenuItem,
  TablePagination,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Refresh as RefreshIcon, Inventory2Outlined as InventoryAdjustIcon } from '@mui/icons-material';
import { inventoryService } from '../../../services/inventory.service';
import type { InventoryLog, StockAdjustmentRequest } from '../../../services/inventory.service';
import { productService } from '../../../services/product.service';
import type { Product } from '../../../types/product.types';
import type { ApiErrorResponse } from '../../../types/api.types';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useAuth } from '../../../hooks/useAuth';
import AdminFiltersBar from '../../../components/common/AdminFiltersBar';
import { useDebounce } from '../../../hooks/useDebounce';

const PAGE_SIZE = 10;

type InventoryLogChangeType = 'IN' | 'OUT';

interface InventoryLogRow {
  id: number;
  productId: number | null;
  productName: string | null;
  changeType: InventoryLogChangeType;
  quantityChange: number;
  reason: string;
  performedById: number | null;
  performedByUsername: string | null;
  createdAt: string | null;
}

interface LogFilters {
  changeType: InventoryLogChangeType | '';
  search: string;
  dateFrom?: string;
  dateTo?: string;
}

interface ProductOption {
  id: number;
  name: string;
  quantity: number;
  low_stock_threshold?: number | null;
}

type ChangeType = StockAdjustmentRequest['change_type'];

const CHANGE_OPTIONS: Array<{ value: ChangeType; label: string; direction: InventoryLogChangeType; }> = [
  { value: 'IN', label: 'Nhập kho (IN)', direction: 'IN' },
  { value: 'OUT', label: 'Xuất kho (OUT)', direction: 'OUT' },
];

const formatDate = (value: string | null): string => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('vi-VN');
};

interface AdjustInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

const AdjustInventoryDialog: React.FC<AdjustInventoryDialogProps> = ({ open, onClose, onSuccess }) => {
  const { showSuccess, showApiError, showError } = useSnackbar();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [changeTypeSelection, setChangeTypeSelection] = useState<ChangeType>('IN');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const debouncedSearch = useDebounce(productSearch.trim(), 400);
  const selectedProductRef = useRef<ProductOption | null>(null);

  const resetForm = useCallback(() => {
    setSelectedProduct(null);
    setChangeTypeSelection('IN');
    setQuantity(1);
    setReason('');
    setProductSearch('');
    setProductOptions([]);
    setSubmitting(false);
    selectedProductRef.current = null;
  }, []);

  useEffect(() => {
    selectedProductRef.current = selectedProduct;
  }, [selectedProduct]);

  const loadProducts = useCallback(async () => {
    if (!open) {
      return;
    }
    setLoadingProducts(true);
    try {
      const hasKeyword = debouncedSearch.length >= 2;
      const response = hasKeyword
        ? await productService.searchProducts(debouncedSearch, { page: 0, size: 20, sort: 'name,asc' })
        : await productService.getAllProducts({ page: 0, size: 20, sort: 'name,asc' });

      const options = (response.content ?? []).map<ProductOption>((product: Product) => ({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        low_stock_threshold: product.low_stock_threshold,
      }));

      const currentSelection = selectedProductRef.current;
      setProductOptions(() => {
        if (currentSelection && !options.some((option) => option.id === currentSelection.id)) {
          return [...options, currentSelection];
        }
        return options;
      });
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      showApiError('Tải danh sách sản phẩm', apiError?.message);
    } finally {
      setLoadingProducts(false);
    }
  }, [debouncedSearch, open, showApiError]);

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    void loadProducts();
  }, [loadProducts, open, resetForm]);

  const handleDialogClose = useCallback((_: unknown, reason?: 'backdropClick' | 'escapeKeyDown') => {
    if (submitting) {
      return;
    }
    if (reason === 'backdropClick') {
      onClose();
      return;
    }
    onClose();
  }, [onClose, submitting]);

  const handleSubmit = useCallback(async () => {
    if (!selectedProduct) {
      showError('Vui lòng chọn sản phẩm cần điều chỉnh.');
      return;
    }
    if (quantity <= 0) {
      showError('Số lượng phải lớn hơn 0.');
      return;
    }
    if (!reason.trim()) {
      showError('Vui lòng nhập lý do điều chỉnh.');
      return;
    }

    setSubmitting(true);
    try {
      if (!user?.id) {
        showError('Không xác định được người thực hiện thao tác. Vui lòng đăng nhập lại.');
        return;
      }

      const payload: StockAdjustmentRequest = {
        change_type: changeTypeSelection,
        quantity,
        reason: reason.trim(),
        performed_by_id: user.id,
      };

      await inventoryService.adjustInventory(selectedProduct.id, payload);
      showSuccess('Điều chỉnh tồn kho thành công');
      try {
        await onSuccess();
      } catch (refreshError) {
        console.error('❌ InventoryList: Không thể làm mới lịch sử sau khi điều chỉnh', refreshError);
      }
      onClose();
    } catch (error) {
      const apiError = error as ApiErrorResponse;
      showApiError('Điều chỉnh tồn kho', apiError?.message);
    } finally {
      setSubmitting(false);
    }
  }, [changeTypeSelection, onClose, onSuccess, quantity, reason, selectedProduct, showApiError, showError, showSuccess, user]);

  const selectedChangeOption = useMemo(
    () => CHANGE_OPTIONS.find((option) => option.value === changeTypeSelection),
    [changeTypeSelection]
  );

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete
            options={productOptions}
            value={selectedProduct}
            loading={loadingProducts}
            onChange={(_, value) => setSelectedProduct(value)}
            onInputChange={(_, value, reason) => {
              if (reason === 'reset') {
                return;
              }
              setProductSearch(value);
            }}
            inputValue={productSearch}
            filterOptions={(options) => options}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" fontWeight={500}>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {option.id} · Tồn kho: {option.quantity}
                  </Typography>
                </Box>
              </li>
            )}
            noOptionsText={debouncedSearch.length >= 2 ? 'Không tìm thấy sản phẩm phù hợp' : 'Nhập ít nhất 2 ký tự để tìm kiếm'}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sản phẩm"
                placeholder="Tìm theo tên sản phẩm"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingProducts ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {selectedProduct && (
            <Typography variant="body2" color="text.secondary">
              Tồn kho hiện tại: {selectedProduct.quantity} sản phẩm
            </Typography>
          )}

          <TextField
            select
            label="Loại thay đổi"
            value={changeTypeSelection}
            onChange={(event) => setChangeTypeSelection(event.target.value as ChangeType)}
            fullWidth
          >
            {CHANGE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {selectedChangeOption && (
            <Chip
              label={selectedChangeOption.direction === 'IN' ? 'Tăng tồn kho' : 'Giảm tồn kho'}
              color={selectedChangeOption.direction === 'IN' ? 'success' : 'error'}
              size="small"
            />
          )}

          {user && (
            <Typography variant="body2" color="text.secondary">
              Người thực hiện: ID {user.id} · {user.full_name || user.username}
            </Typography>
          )}

          <TextField
            label="Số lượng"
            type="number"
            inputProps={{ min: 1 }}
            value={quantity}
            onChange={(event) => {
              const value = Number(event.target.value);
              setQuantity(Number.isNaN(value) ? 0 : value);
            }}
            fullWidth
          />

          <TextField
            label="Lý do"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder="Mô tả ngắn gọn lý do điều chỉnh"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Đang xử lý...' : 'Xác nhận'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InventoryList: React.FC = () => {
  const { showInfo } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<InventoryLogRow[]>([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [total, setTotal] = useState<number>(0);
  const [filters, setFilters] = useState<LogFilters>({ changeType: '', search: '' });
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);

  const { changeType, search, dateFrom, dateTo } = filters;
  const debouncedSearch = useDebounce(search ?? '', 400);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getInventoryLogs({
        page,
        size: pageSize,
        changeType: changeType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: debouncedSearch.trim() || undefined,
      });
      const rawLogs = (response?.content ?? []) as InventoryLog[];

      const mapped: InventoryLogRow[] = rawLogs.map((log) => {
        const change = (log.change_type ?? log.changeType ?? '').toString().toUpperCase();
        const normalizedChange: InventoryLogChangeType = change === 'OUT' ? 'OUT' : 'IN';
        const performerId = typeof log.performed_by === 'number' ? log.performed_by : null;

        return {
          id: log.id,
          productId: typeof log.product_id === 'number' ? log.product_id : log.productId ?? null,
          productName: log.product_name ?? log.productName ?? null,
          changeType: normalizedChange,
          quantityChange: log.quantity_change ?? log.quantityChange ?? 0,
          reason: log.reason ?? '',
          performedById: performerId ?? log.performed_by_id ?? log.performedById ?? log.performedBy ?? null,
          performedByUsername: log.performed_by_username ?? log.performedByUsername ?? null,
          createdAt: log.created_at ?? log.createdAt ?? null,
        };
      });

      const filtered = mapped.filter((entry) => {
        const matchesType = changeType ? entry.changeType === changeType : true;
        const keyword = debouncedSearch.trim().toLowerCase();
        const matchesKeyword = keyword
          ? entry.reason.toLowerCase().includes(keyword)
            || `${entry.productId ?? ''}`.includes(keyword)
            || (entry.productName ?? '').toLowerCase().includes(keyword)
            || `${entry.performedById ?? ''}`.includes(keyword)
          : true;

        const entryDate = entry.createdAt ? new Date(entry.createdAt) : null;
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

        const matchesFrom = fromDate ? (entryDate ? entryDate >= fromDate : false) : true;
        const matchesTo = toDate ? (entryDate ? entryDate <= toDate : false) : true;

        return matchesType && matchesKeyword && matchesFrom && matchesTo;
      });

      const totalElements = typeof (response as any)?.total_elements === 'number'
        ? (response as any).total_elements
        : (response as any)?.totalElements ?? filtered.length;
      const responsePage = typeof (response as any)?.page_number === 'number'
        ? (response as any).page_number
        : (response as any)?.pageNumber;

      setLogs(filtered);
      setTotal(totalElements);

      if (typeof responsePage === 'number' && responsePage !== page) {
        setPage(responsePage);
      }
    } catch (error) {
      console.error('❌ InventoryList: Không thể tải lịch sử tồn kho', error);
      setLogs([]);
      setTotal(0);
      showInfo('Môi trường hiện tại chưa hỗ trợ Inventory Logs.');
    } finally {
      setLoading(false);
    }
  }, [changeType, dateFrom, dateTo, debouncedSearch, page, pageSize, showInfo]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleSearchChange = useCallback((value: string) => {
    if (value === search) {
      return;
    }
    if (page !== 0) {
      setPage(0);
    }
    setFilters((prev) => ({ ...prev, search: value }));
  }, [page, search]);

  const handleChangeType = useCallback((value: InventoryLogChangeType | '') => {
    if (value === changeType) {
      return;
    }
    if (page !== 0) {
      setPage(0);
    }
    setFilters((prev) => ({ ...prev, changeType: value }));
  }, [changeType, page]);

  const handleDateFromChange = useCallback((value?: string) => {
    const normalized = value || undefined;
    if (normalized === dateFrom) {
      return;
    }
    if (page !== 0) {
      setPage(0);
    }
    setFilters((prev) => ({ ...prev, dateFrom: normalized }));
  }, [dateFrom, page]);

  const handleDateToChange = useCallback((value?: string) => {
    const normalized = value || undefined;
    if (normalized === dateTo) {
      return;
    }
    if (page !== 0) {
      setPage(0);
    }
    setFilters((prev) => ({ ...prev, dateTo: normalized }));
  }, [dateTo, page]);

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleAdjustmentSuccess = useCallback(async () => {
    if (page !== 0) {
      setPage(0);
      return;
    }
    await fetchLogs();
  }, [fetchLogs, page]);

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    if (newPage === page) {
      return;
    }
    setPage(newPage);
  }, [page]);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) {
      return;
    }
    if (value === pageSize) {
      return;
    }
    setPageSize(value);
    setPage(0);
  }, [pageSize]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Lịch sử kho (Nhập / Xuất)</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<InventoryAdjustIcon />} onClick={handleOpenDialog}>
            Điều chỉnh tồn kho
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchLogs} disabled={loading}>
            Làm mới
          </Button>
        </Box>
      </Box>

      <AdminFiltersBar
        searchValue={search}
        onSearchChange={handleSearchChange}
        placeholder="Tìm kiếm (sản phẩm / lý do / ID)"
        loading={loading}
        onRefresh={fetchLogs}
      >
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel>Loại thay đổi</InputLabel>
          <Select
            native
            value={changeType}
            onChange={(event) => handleChangeType(event.target.value as InventoryLogChangeType | '')}
            label="Loại thay đổi"
            size="small"
          >
            <option value="">Tất cả</option>
            <option value="IN">Nhập (IN)</option>
            <option value="OUT">Xuất (OUT)</option>
          </Select>
        </FormControl>

        <TextField
          label="Từ ngày"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={dateFrom ?? ''}
          onChange={(event) => handleDateFromChange(event.target.value || undefined)}
        />

        <TextField
          label="Đến ngày"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={dateTo ?? ''}
          onChange={(event) => handleDateToChange(event.target.value || undefined)}
        />
      </AdminFiltersBar>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Loại thay đổi</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell>Lý do</TableCell>
                    <TableCell>Thực hiện bởi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{formatDate(row.createdAt)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {row.productName ?? '---'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {row.productId ?? '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.changeType === 'IN' ? 'Nhập (IN)' : 'Xuất (OUT)'}
                          size="small"
                          color={row.changeType === 'IN' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{row.quantityChange}</TableCell>
                      <TableCell>{row.reason}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          ID: {row.performedById ?? '-'}
                        </Typography>
                        {row.performedByUsername && (
                          <Typography variant="caption" color="text.secondary">
                            {row.performedByUsername}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography variant="body2">
              Hiển thị {logs.length} trên tổng {total} bản ghi
            </Typography>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Số dòng mỗi trang"
            />
          </Box>
        </CardContent>
      </Card>

      <AdjustInventoryDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleAdjustmentSuccess}
      />
    </Box>
  );
};

export default InventoryList;
