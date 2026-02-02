import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography, 
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { Checkbox } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../../../services/product.service';
import { categoryService } from '../../../services/category.service';
import type { Product, Category } from '../../../types/product.types';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useDebounce } from '../../../hooks/useDebounce';
import AdminFiltersBar from '../../../components/common/AdminFiltersBar';

const PAGE_SIZE = 24;

const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Search and filter states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  // Đơn giản hóa theo yêu cầu: bỏ lọc trạng thái và sắp xếp
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  
  // Bulk selection state (UI actions removed)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  
  // Debounced search
  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = debouncedSearchKeyword.trim().toLowerCase();
      const query: {
        page: number;
        size: number;
        sort: string;
        categoryId?: number;
        stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
        search?: string;
      } = {
        page: page - 1,
        size: PAGE_SIZE,
        sort: 'updatedAt,desc'
      };

      if (selectedCategory) {
        query.categoryId = Number(selectedCategory);
      }

      if (stockFilter !== 'all') {
        query.stockStatus = stockFilter;
      }

      if (q) {
        query.search = q;
      }

      const resp = await productService.getManagementProducts(query);
      const list = resp.content || [];
      setProducts(list);
      setTotal(resp.totalElements || 0);
    } catch (err: any) {
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Không tải được sản phẩm: ' + (serverMsg || String(err)) + details);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await categoryService.getActiveCategories();
      setCategories(cats);
    } catch (err: any) {
      console.warn('Could not load categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Sync selectedCategory with URL query (?categoryId=123)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idStr = params.get('category') || params.get('categoryId') || params.get('category_id') || '';
    const idNum = Number(idStr);
    if (idStr === '') {
      setSelectedCategory('');
    } else if (!Number.isNaN(idNum)) {
      setSelectedCategory(idNum);
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearchKeyword, selectedCategory, stockFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchKeyword, selectedCategory, stockFilter]);

  const handleEdit = (id?: number) => navigate(`/admin/products/${id}/edit`);
  const handleView = (id?: number) => navigate(`/product/${id}`);
  
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này không?')) return;
    try {
      await productService.deleteProduct(id);
      showSuccess('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (err: any) {
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Xóa sản phẩm thất bại: ' + (serverMsg || String(err)) + details);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      // Create minimal payload for status update
      const updatePayload = {
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock_quantity: product.quantity,
        low_stock_threshold: product.low_stock_threshold || 10,
        category_id: product.category?.id || 0,
        specifications: product.specifications || {},
        is_active: !product.is_active
      };
      
      await productService.updateProduct(product.id!, updatePayload);
      showSuccess(`Sản phẩm đã được ${product.is_active ? 'ẩn' : 'hiển thị'}`);
      fetchProducts();
    } catch (err: any) {
      showError('Cập nhật trạng thái thất bại: ' + (err.message || err));
    }
  };

  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedCategory('');
    setStockFilter('all');
  // giữ nguyên sort mặc định (updated_at,desc)
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { label: 'Hết hàng', color: 'error' as const };
    if (product.is_low_stock) return { label: 'Sắp hết', color: 'warning' as const };
    return { label: 'Còn hàng', color: 'success' as const };
  };

  const handleSelectProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id!));
    } else {
      setSelectedProducts([]);
    }
  };

  // bulk action UI removed; keep selection state for other uses

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Quản lý sản phẩm</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/products/create')}>
          Tạo sản phẩm
        </Button>
      </Box>

      {/* Unified filters bar */}
      <AdminFiltersBar
        searchValue={searchKeyword}
        onSearchChange={(v) => setSearchKeyword(v)}
        placeholder="Tìm kiếm sản phẩm..."
        loading={loading}
        onRefresh={fetchProducts}
        actions={(
          <Button variant="outlined" startIcon={<FilterIcon />} onClick={clearFilters} size="small">
            Xóa lọc
          </Button>
        )}
      >
        {/* left/inline filter controls */}
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Danh mục</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as number | '')}
            label="Danh mục"
            size="small"
          >
            <MenuItem value="">Tất cả</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Bỏ lọc Trạng thái */}

        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel>Tồn kho</InputLabel>
          <Select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            label="Tồn kho"
            size="small"
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="in_stock">Còn hàng</MenuItem>
            <MenuItem value="low_stock">Sắp hết</MenuItem>
            <MenuItem value="out_of_stock">Hết hàng</MenuItem>
          </Select>
        </FormControl>

        {/* Bỏ lựa chọn Sắp xếp và Thứ tự */}
      </AdminFiltersBar>

      {/* Bulk operations panel intentionally removed per UX request */}

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
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedProducts.length === products.length && products.length > 0}
                        indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Tên sản phẩm</TableCell>
                    <TableCell>Danh mục</TableCell>
                    <TableCell>Giá (VNĐ)</TableCell>
                    <TableCell>Tồn kho</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày cập nhật</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => {
                    const stockStatus = getStockStatus(p);
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedProducts.includes(p.id!)}
                            onChange={(e) => handleSelectProduct(p.id!, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{p.id}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {p.name}
                            </Typography>
                            {p.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.description}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={p.category?.name || 'Chưa phân loại'} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {p.price?.toLocaleString('vi-VN')} ₫
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {p.quantity ?? 0}
                            </Typography>
                            <Chip 
                              label={stockStatus.label} 
                              size="small" 
                              color={stockStatus.color}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={p.is_active}
                                onChange={() => handleToggleStatus(p)}
                                size="small"
                              />
                            }
                            label={p.is_active ? 'Đang bán' : 'Ngừng bán'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(p.updated_at).toLocaleDateString('vi-VN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Xem chi tiết">
                              <IconButton size="small" onClick={() => handleView(p.id!)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton size="small" onClick={() => handleEdit(p.id!)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton size="small" onClick={() => handleDelete(p.id!)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {products.length} sản phẩm trên tổng {total} sản phẩm
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Trang {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                disabled={page <= 1} 
                onClick={() => setPage(1)}
              >
                Đầu
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                disabled={page <= 1} 
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} 
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} 
                onClick={() => setPage(Math.ceil(total / PAGE_SIZE))}
              >
                Cuối
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductsList;
