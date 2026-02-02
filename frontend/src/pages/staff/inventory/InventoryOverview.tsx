import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { Refresh as RefreshIcon, Visibility as VisibilityIcon, Warehouse as WarehouseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../../services/product.service';
import { categoryService } from '../../../services/category.service';
import type { Category, Product } from '../../../types/product.types';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useDebounce } from '../../../hooks/useDebounce';
import AdminFiltersBar from '../../../components/common/AdminFiltersBar';

const DEFAULT_PAGE_SIZE = 20;

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

const formatCurrency = (value?: number | null): string => {
    if (value === undefined || value === null) {
        return '—';
    }
    try {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    } catch {
        return `${Number(value).toLocaleString('vi-VN')} ₫`;
    }
};

const formatDateTime = (value?: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN');
};

const getStockMeta = (product: Product) => {
    if ((product.quantity ?? 0) <= 0) {
        return { label: 'Hết hàng', color: 'error' as const };
    }
    if (product.is_low_stock) {
        return { label: 'Sắp hết', color: 'warning' as const };
    }
    return { label: 'Còn hàng', color: 'success' as const };
};

const StaffInventoryOverview: React.FC = () => {
    const navigate = useNavigate();
    const { showError } = useSnackbar();

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
    const [stockFilter, setStockFilter] = useState<StockFilter>('all');

    const debouncedKeyword = useDebounce(searchKeyword.trim(), 400);

    const loadCategories = useCallback(async () => {
        try {
            const activeCategories = await categoryService.getActiveCategories();
            setCategories(activeCategories);
        } catch (error) {
            console.warn('StaffInventoryOverview: không thể tải danh mục', error);
        }
    }, []);

    useEffect(() => {
        void loadCategories();
    }, [loadCategories]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const query: {
                page: number;
                size: number;
                sort: string;
                categoryId?: number;
                stockStatus?: StockFilter extends 'all' ? never : 'in_stock' | 'low_stock' | 'out_of_stock';
                search?: string;
            } = {
                page,
                size: rowsPerPage,
                sort: 'updatedAt,desc',
            };

            if (selectedCategory) {
                query.categoryId = Number(selectedCategory);
            }

            if (stockFilter !== 'all') {
                query.stockStatus = stockFilter;
            }

            if (debouncedKeyword.length > 0) {
                query.search = debouncedKeyword;
            }

            const response = await productService.getManagementProducts(query as any);
            setProducts(response.content ?? []);
            setTotal(response.totalElements ?? 0);
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi không mong muốn';
            showError(`Không thể tải dữ liệu tồn kho: ${message}`);
            setProducts([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [debouncedKeyword, page, rowsPerPage, selectedCategory, showError, stockFilter]);

    useEffect(() => {
        void fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setPage(0);
    }, [debouncedKeyword, selectedCategory, stockFilter, rowsPerPage]);

    const summary = useMemo(() => {
        const inStock = products.filter((p) => (p.quantity ?? 0) > 0).length;
        const lowStock = products.filter((p) => !((p.quantity ?? 0) <= 0) && p.is_low_stock).length;
        const outOfStock = products.filter((p) => (p.quantity ?? 0) <= 0).length;
        const inactive = products.filter((p) => !p.is_active).length;

        return {
            totalItems: total,
            pageItems: products.length,
            inStock,
            lowStock,
            outOfStock,
            inactive,
        };
    }, [products, total]);

    const handleRefresh = () => {
        void fetchProducts();
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = Number(event.target.value);
        if (Number.isNaN(next)) return;
        setRowsPerPage(next);
        setPage(0);
    };

    const handleViewProduct = (id?: number) => {
        if (!id) return;
        navigate(`/product/${id}`);
    };

    const clearFilters = () => {
        setSearchKeyword('');
        setSelectedCategory('');
        setStockFilter('all');
    };

    return (
        <Box sx={{ py: 4 }}>
            <Paper
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 3,
                    mb: 3,
                    gap: 2,
                }}
            >
                <WarehouseIcon color="warning" sx={{ fontSize: 48 }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight={700}>Kho hàng</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Giao diện xem tồn kho dành cho nhân viên. Bạn chỉ có quyền xem chi tiết trạng thái sản phẩm.
                    </Typography>
                </Box>
                <Button startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
                    Làm mới
                </Button>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Tổng sản phẩm (theo bộ lọc)</Typography>
                            <Typography variant="h5" fontWeight={600}>{summary.totalItems}</Typography>
                            <Typography variant="body2" color="text.secondary">Hiển thị {summary.pageItems} trên trang này</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Còn hàng</Typography>
                            <Typography variant="h5" color="success.main" fontWeight={600}>{summary.inStock}</Typography>
                            <Typography variant="body2" color="text.secondary">Trong trang hiện tại</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Sắp hết hàng</Typography>
                            <Typography variant="h5" color="warning.main" fontWeight={600}>{summary.lowStock}</Typography>
                            <Typography variant="body2" color="text.secondary">Theo dữ liệu trang</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Ngừng bán</Typography>
                            <Typography variant="h5" color="text.primary" fontWeight={600}>{summary.inactive}</Typography>
                            <Typography variant="body2" color="text.secondary">Sản phẩm đang ẩn</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <AdminFiltersBar
                searchValue={searchKeyword}
                onSearchChange={setSearchKeyword}
                placeholder="Tìm kiếm theo tên, mã sản phẩm..."
                loading={loading}
                onRefresh={handleRefresh}
                actions={(
                    <Button variant="outlined" onClick={clearFilters} size="small">
                        Xóa lọc
                    </Button>
                )}
            >
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Danh mục</InputLabel>
                    <Select
                        value={selectedCategory}
                        label="Danh mục"
                        onChange={(event) => setSelectedCategory(event.target.value as number | '')}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        {categories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Trạng thái tồn kho</InputLabel>
                    <Select
                        value={stockFilter}
                        label="Trạng thái tồn kho"
                        onChange={(event) => setStockFilter(event.target.value as StockFilter)}
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="in_stock">Còn hàng</MenuItem>
                        <MenuItem value="low_stock">Sắp hết</MenuItem>
                        <MenuItem value="out_of_stock">Hết hàng</MenuItem>
                    </Select>
                </FormControl>
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
                                        <TableCell>ID</TableCell>
                                        <TableCell>Tên sản phẩm</TableCell>
                                        <TableCell>Danh mục</TableCell>
                                        <TableCell align="right">Giá bán</TableCell>
                                        <TableCell align="right">Tồn kho</TableCell>
                                        <TableCell>Trạng thái kho</TableCell>
                                        <TableCell>Tình trạng bán</TableCell>
                                        <TableCell>Ngày cập nhật</TableCell>
                                        <TableCell align="right">Chi tiết</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {products.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                                <Typography color="text.secondary">Không có sản phẩm nào phù hợp với bộ lọc.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        products.map((product) => {
                                            const stockMeta = getStockMeta(product);
                                            return (
                                                <TableRow key={product.id} hover>
                                                    <TableCell>{product.id}</TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight={600}>{product.name}</Typography>
                                                        {product.description && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {product.description}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={product.category?.name ?? 'Chưa phân loại'}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                                                    <TableCell align="right">{product.quantity ?? 0}</TableCell>
                                                    <TableCell>
                                                        <Chip label={stockMeta.label} color={stockMeta.color} size="small" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={product.is_active ? 'Đang bán' : 'Ngừng bán'}
                                                            size="small"
                                                            color={product.is_active ? 'success' : 'default'}
                                                            variant={product.is_active ? 'filled' : 'outlined'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{formatDateTime(product.updated_at)}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Xem trang sản phẩm">
                                                            <IconButton size="small" onClick={() => handleViewProduct(product.id)}>
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Trang {page + 1} / {Math.max(1, Math.ceil(total / rowsPerPage))}
                        </Typography>
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            rowsPerPageOptions={[10, 20, 30, 50]}
                            labelRowsPerPage="Số dòng mỗi trang"
                        />
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default StaffInventoryOverview;
