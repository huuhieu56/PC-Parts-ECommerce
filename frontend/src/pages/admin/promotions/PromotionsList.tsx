import React, { useEffect, useMemo, useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { Box, Button, Card, CardContent, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, Chip, Switch } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { promotionService } from '../../../services/promotion.service';
import { useSnackbar } from '../../../hooks/useSnackbar';
import AdminFiltersBar from '../../../components/common/AdminFiltersBar';

const PAGE_SIZE = 10;

const parseDate = (value?: string | Date | null) => {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const evaluatePromotionTemporalStatus = (promotion: any, referenceTime = Date.now()) => {
  const startDate = parseDate(promotion.start_date ?? promotion.startDate);
  const endDate = parseDate(promotion.end_date ?? promotion.endDate);
  const backendActive = Boolean(promotion.is_active ?? promotion.isActive);
  const hasStarted = !startDate || startDate.getTime() <= referenceTime;
  const isExpired = endDate ? endDate.getTime() < referenceTime : false;
  const isActive = backendActive && hasStarted && !isExpired;

  return { startDate, endDate, isExpired, isActive };
};

const PromotionsList: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [promotions, setPromotions] = useState<any[]>([]);
  // pagination state kept for future extension
  const [page] = useState(0);
  const [filters, setFilters] = useState({ status: '', discountType: '', search: '' });
  const [rawSearch, setRawSearch] = useState('');
  const debouncedSearch = useDebounce(rawSearch, 400);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      // Map UI filter values to backend-friendly params
      const opts: any = { page, size: PAGE_SIZE };
      if (filters.search) opts.search = filters.search;
      if (filters.discountType) opts.discountType = filters.discountType;

      // UI uses 'active'/'inactive' strings. Some backends accept boolean is_active, others expect status enum.
      // Send both to maximize compatibility: status=ACTIVE|INACTIVE and is_active=true|false
      if (filters.status === 'active') {
        opts.isActive = true;
        opts.status = 'ACTIVE';
      } else if (filters.status === 'inactive') {
        opts.isActive = false;
        opts.status = 'INACTIVE';
      }

      // Log final opts to help debug why filters may not apply on backend
      try { console.debug('🔎 PromotionsList: fetching with opts =', JSON.stringify(opts)); } catch { }

      const resp = await promotionService.getPromotions(opts);
      setPromotions(resp.content || []);
    } catch (err: any) {
      showError('Không tải được khuyến mãi: ' + (err.message || err));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPromotions(); }, [page, filters]);

  // Sync debounced search into filters so fetchPromotions triggers only after typing stops
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // delete action intentionally removed by UX decision (frontend-only change)

  const handleToggle = async (id: number, activate: boolean) => {
    try {
      await promotionService.togglePromotionStatus(id, activate);
      showSuccess('Cập nhật trạng thái thành công');
      fetchPromotions();
    } catch (e: any) {
      showError('Cập nhật thất bại: ' + (e.message || e));
    }
  };

  const formatDate = (value?: Date | string | null) => {
    const date = parseDate(value ?? undefined);
    return date ? date.toLocaleDateString('vi-VN') : '-';
  };

  const enrichedPromotions = useMemo(() => {
    const referenceTime = Date.now();
    return promotions.map(item => ({ item, status: evaluatePromotionTemporalStatus(item, referenceTime) }));
  }, [promotions]);

  // Client-side fallback filtering to ensure UX works even if backend ignores params
  const filteredPromotions = useMemo(() => {
    let data = [...enrichedPromotions];
    // filter by status
    if (filters.status === 'active') {
      data = data.filter(({ status }) => status.isActive);
    } else if (filters.status === 'inactive') {
      data = data.filter(({ status }) => !status.isActive);
    }
    // filter by type
    if (filters.discountType) {
      data = data.filter(({ item }) => String(item.discount_type ?? item.discountType) === filters.discountType);
    }
    // filter by search (name/description)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(({ item }) =>
        String(item.name ?? '').toLowerCase().includes(q) ||
        String(item.description ?? '').toLowerCase().includes(q)
      );
    }
    return data;
  }, [enrichedPromotions, filters]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Quản lý khuyến mãi</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/promotions/create')}>Tạo khuyến mãi</Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPromotions} disabled={loading}>Làm mới</Button>
        </Box>
      </Box>

      {/* informational alert removed per UX request */}

      <AdminFiltersBar
        searchValue={rawSearch}
        onSearchChange={(v) => setRawSearch(v)}
        onRefresh={fetchPromotions}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/promotions/create')}>Tạo khuyến mãi</Button>}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select value={filters.status} label="Trạng thái" onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="inactive">Không hoạt động</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Loại</InputLabel>
            <Select value={filters.discountType} label="Loại" onChange={(e) => setFilters({ ...filters, discountType: e.target.value })}>
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="PERCENTAGE">Phần trăm</MenuItem>
              <MenuItem value="FIXED_AMOUNT">Cố định</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </AdminFiltersBar>

      {/* debounced search synchronized via top-level useEffect */}

      <Card>
        <CardContent>
          {loading ? (<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Giá trị</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPromotions.map(({ item: p, status }) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                      </TableCell>
                      <TableCell>{(p.discount_type ?? p.discountType) || '-'}</TableCell>
                      <TableCell>{(p.discount_type ?? p.discountType) === 'PERCENTAGE' ? `${(p.discount_value ?? p.discountValue) ?? 0}%` : `${(p.discount_value ?? p.discountValue) ?? 0} VND`}</TableCell>
                      <TableCell>{formatDate(status.startDate)} - {formatDate(status.endDate)}</TableCell>
                      <TableCell>
                        {status.isActive ? (
                          <Chip label="Hoạt động" color="success" size="small" />
                        ) : status.isExpired ? (
                          <Chip label="Hết hạn" size="small" sx={{ bgcolor: 'error.main', color: 'common.white' }} />
                        ) : (
                          <Chip label="Không hoạt động" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Chỉnh sửa"><IconButton size="small" onClick={() => navigate(`/admin/promotions/${p.id}/edit`)}><EditIcon /></IconButton></Tooltip>
                        {/* Toggle switch (colored) - removed delete button per request */}
                        <Tooltip title={status.isExpired ? 'Khuyến mãi đã hết hạn, vui lòng gia hạn thời gian nếu muốn kích hoạt lại' : 'Kích hoạt/ Vô hiệu hóa khuyến mãi'}>
                          <span>
                            <Switch
                              color="success"
                              checked={status.isActive}
                              disabled={status.isExpired}
                              onChange={(_, checked) => handleToggle(p.id, checked)}
                              inputProps={{ 'aria-label': 'Kích hoạt/ Vô hiệu hóa' }}
                            />
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PromotionsList;
