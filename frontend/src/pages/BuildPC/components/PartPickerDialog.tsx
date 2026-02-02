import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItemButton, ListItemText, CircularProgress, Box, FormControl, InputLabel, Select, MenuItem, Stack, Chip, useMediaQuery, useTheme, Typography, Checkbox, FormControlLabel } from '@mui/material';
import type { Product } from '../../../types/product.types';
import { useProducts } from '../../../hooks/useQueryHooks';
import { productService } from '../../../services/product.service';
import { buildImageUrl } from '../../../utils/urlHelpers';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../../../services/category.service';
import type { AttributeDefinition } from '../../../types/product.types';

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
    categoryId: number | null;
}

export const PartPickerDialog: React.FC<Props> = ({ open, onClose, onSelect, categoryId }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);
    const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
    const [minPrice, setMinPrice] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');
    const [brands, setBrands] = useState<string[]>([]);
    const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});
    const searchRef = useRef<HTMLInputElement | null>(null);
    const lastResetCategoryRef = useRef<number | null>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    const resetFilters = useCallback(() => {
        setSearch('');
        setPage(1);
        setMinPrice('');
        setMaxPrice('');
        setBrands([]);
        setAttributeValues({});
    }, []);

    const filters = useMemo(
        () => {
            const specs: Record<string, any> = {};
            Object.entries(attributeValues).forEach(([code, raw]) => {
                if (raw === undefined || raw === null) return;
                if (Array.isArray(raw) && raw.length === 0) return;
                if (typeof raw === 'string' && raw.trim() === '') return;
                specs[code] = raw;
            });

            return ({
                category_ids: categoryId ? [categoryId] : undefined,
                search: search || undefined,
                min_price: minPrice === '' ? undefined : Number(minPrice),
                max_price: maxPrice === '' ? undefined : Number(maxPrice),
                specifications: Object.keys(specs).length ? specs : undefined,
                brands: brands.length ? brands : undefined,
                sort,
            });
        },
        [categoryId, search, minPrice, maxPrice, brands, sort, attributeValues]
    );

    // Always enable fetching when dialog is open. If categoryId is null we fetch using broader filters
    const { data, isLoading } = useProducts(filters as any, page, pageSize, { enabled: open });
    const productsRaw = data?.content || [];

    // Extract brands from current result to build filter list (frontend-only)
    const availableBrands = useMemo(() => productService.extractBrandsFromProducts(productsRaw), [productsRaw]);

    // Fetch category-specific attribute definitions (if available)
    const { data: attributeDefs = [] as AttributeDefinition[] } = useQuery({
        queryKey: ['category', categoryId, 'filters'],
        queryFn: async () => {
            if (!categoryId) return [] as AttributeDefinition[];
            return categoryService.getCategoryFilters(categoryId);
        },
        enabled: !!categoryId,
        staleTime: 30 * 60 * 1000,
    });

    // Initialize attributeValues when attributeDefs change
    React.useEffect(() => {
        if (!attributeDefs || attributeDefs.length === 0) return;
        const next: Record<string, any> = { ...attributeValues };
        attributeDefs.forEach((def) => {
            if (next[def.code] === undefined) {
                // default empty depending on input_type
                if (def.input_type === 'multi-select') next[def.code] = [];
                else if (def.input_type === 'range') next[def.code] = { min: '', max: '' };
                else next[def.code] = '';
            }
        });
        setAttributeValues(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attributeDefs]);

    // Reset filters whenever the dialog opens for a slot (or when its category changes)
    useEffect(() => {
        if (!open) {
            lastResetCategoryRef.current = null;
            return;
        }
        const normalized = categoryId ?? null;
        if (lastResetCategoryRef.current === normalized) return;
        lastResetCategoryRef.current = normalized;
        resetFilters();
    }, [categoryId, open, resetFilters]);

    // Manage focus to avoid aria-hidden warnings when opening the dialog
    useEffect(() => {
        if (!open) {
            const previous = previouslyFocusedRef.current;
            if (previous && typeof previous.focus === 'function') {
                previouslyFocusedRef.current = null;
                if (previous.isConnected) {
                    try { previous.focus(); } catch (e) { /* ignore */ }
                }
            }
            return;
        }

        if (typeof document !== 'undefined') {
            const activeElement = document.activeElement as HTMLElement | null;
            if (activeElement && typeof activeElement.blur === 'function') {
                previouslyFocusedRef.current = activeElement;
                activeElement.blur();
            } else {
                previouslyFocusedRef.current = null;
            }
        }

        const focusSearch = () => {
            try { searchRef.current?.focus(); } catch (e) { /* ignore */ }
        };

        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(focusSearch);
        } else {
            setTimeout(focusSearch, 0);
        }
    }, [open]);

    // Client-side fallback for brand and price filters and price sorting (defensive)
    const productsToRender = productsRaw;

    const titleId = 'part-picker-title';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            fullScreen={isMobile}
            aria-labelledby={titleId}
            keepMounted
        >
            <DialogTitle id={titleId}>Chọn sản phẩm</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Tìm theo tên..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        inputProps={{ 'aria-label': 'Ô tìm kiếm sản phẩm' }}
                        // use a ref and explicit focus on open to ensure focus moves into the dialog
                        inputRef={searchRef}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <FormControl fullWidth>
                            <InputLabel id="sort-label">Sắp xếp</InputLabel>
                            <Select
                                labelId="sort-label"
                                label="Sắp xếp"
                                value={sort}
                                onChange={(e) => { setSort(e.target.value as any); setPage(1); }}
                            >
                                <MenuItem value="newest">Mới nhất</MenuItem>
                                <MenuItem value="price_asc">Giá tăng dần</MenuItem>
                                <MenuItem value="price_desc">Giá giảm dần</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            type="number"
                            label="Giá tối thiểu"
                            value={minPrice}
                            onChange={(e) => { setMinPrice(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
                            inputProps={{ min: 0, 'aria-label': 'Giá tối thiểu' }}
                            fullWidth
                        />
                        <TextField
                            type="number"
                            label="Giá tối đa"
                            value={maxPrice}
                            onChange={(e) => { setMaxPrice(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
                            inputProps={{ min: 0, 'aria-label': 'Giá tối đa' }}
                            fullWidth
                        />
                    </Stack>

                    {availableBrands.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} aria-label="Lọc theo thương hiệu">
                            {availableBrands.map((b) => (
                                <Chip
                                    key={b}
                                    label={b}
                                    color={brands.includes(b) ? 'primary' : 'default'}
                                    variant={brands.includes(b) ? 'filled' : 'outlined'}
                                    onClick={() => setBrands(prev => { const next = prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]; setPage(1); return next; })}
                                    aria-pressed={brands.includes(b)}
                                />
                            ))}
                            {brands.length > 0 && (
                                <Button size="small" onClick={() => { setBrands([]); setPage(1); }}>Xóa lọc</Button>
                            )}
                        </Stack>
                    )}

                    {/* Render category-specific attribute filters */}
                    {attributeDefs.length > 0 && (
                        <Stack spacing={1} sx={{ mb: 2 }}>
                            <Typography variant="subtitle2">Bộ lọc theo đặc tính</Typography>
                            {attributeDefs.map((def) => {
                                const code = def.code;
                                const val = attributeValues[code];
                                const options = Array.isArray(def.options) ? def.options : (def.options && Array.isArray((def.options as any).values) ? (def.options as any).values : []);
                                if (def.input_type === 'select') {
                                    return (
                                        <FormControl fullWidth key={code}>
                                            <InputLabel id={`attr-${code}-label`}>{def.display_name}</InputLabel>
                                            <Select
                                                labelId={`attr-${code}-label`}
                                                label={def.display_name}
                                                value={val ?? ''}
                                                onChange={(e) => { setAttributeValues(prev => ({ ...prev, [code]: e.target.value })); setPage(1); }}
                                            >
                                                <MenuItem value="">Tất cả</MenuItem>
                                                {options.map((opt: any) => (
                                                    <MenuItem key={String(opt)} value={opt}>{String(opt)}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    );
                                }
                                if (def.input_type === 'multi-select') {
                                    return (
                                        <FormControl fullWidth key={code}>
                                            <InputLabel id={`attr-${code}-label`}>{def.display_name}</InputLabel>
                                            <Select
                                                labelId={`attr-${code}-label`}
                                                label={def.display_name}
                                                multiple
                                                value={val ?? []}
                                                onChange={(e) => { const v = e.target.value as any; setAttributeValues(prev => ({ ...prev, [code]: v })); setPage(1); }}
                                                renderValue={(selected) => (Array.isArray(selected) ? (selected as any[]).join(', ') : String(selected))}
                                            >
                                                {options.map((opt: any) => (
                                                    <MenuItem key={String(opt)} value={opt}>
                                                        <Checkbox checked={Array.isArray(val) ? val.indexOf(opt) > -1 : false} />
                                                        <Typography variant="body2">{String(opt)}</Typography>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    );
                                }
                                if (def.input_type === 'range') {
                                    return (
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} key={code} alignItems="center">
                                            <TextField
                                                type="number"
                                                label={`${def.display_name} (min)`}
                                                value={val?.min ?? ''}
                                                onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setAttributeValues(prev => ({ ...prev, [code]: { ...(prev[code] || {}), min: v } })); setPage(1); }}
                                                fullWidth
                                            />
                                            <TextField
                                                type="number"
                                                label={`${def.display_name} (max)`}
                                                value={val?.max ?? ''}
                                                onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setAttributeValues(prev => ({ ...prev, [code]: { ...(prev[code] || {}), max: v } })); setPage(1); }}
                                                fullWidth
                                            />
                                        </Stack>
                                    );
                                }
                                if (def.input_type === 'checkbox') {
                                    return (
                                        <FormControlLabel
                                            key={code}
                                            control={<Checkbox checked={!!val} onChange={(e) => { setAttributeValues(prev => ({ ...prev, [code]: e.target.checked })); setPage(1); }} />}
                                            label={def.display_name}
                                        />
                                    );
                                }

                                // fallback: text input
                                return (
                                    <TextField key={code} label={def.display_name} value={val ?? ''} onChange={(e) => { setAttributeValues(prev => ({ ...prev, [code]: e.target.value })); setPage(1); }} fullWidth />
                                );
                            })}
                            <Button size="small" onClick={() => { setAttributeValues({}); setPage(1); }}>Xóa bộ lọc đặc tính</Button>
                        </Stack>
                    )}
                </Stack>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress aria-label="Đang tải sản phẩm" />
                    </Box>
                ) : productsToRender.length === 0 ? (
                    <Box sx={{ py: 4 }}>
                        <Typography align="center" color="text.secondary">
                            Không tìm thấy linh kiện phù hợp. Hãy thử xóa các bộ lọc hoặc chọn danh mục khác.
                        </Typography>
                    </Box>
                ) : (
                    <List aria-label="Danh sách sản phẩm">
                        {productsToRender.map((p) => {
                            const primaryPath = p.image_url
                                || p.images?.find(i => i.is_primary)?.file_path
                                || (p.images && p.images.length > 0 ? p.images[0].file_path : undefined);
                            return (
                                <ListItemButton key={p.id} onClick={() => onSelect(p)} aria-label={`Chọn ${p.name}`}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                        <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: 'hidden', border: theme => `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', flexShrink: 0 }}>
                                            {primaryPath ? (
                                                <img
                                                    src={buildImageUrl(primaryPath)}
                                                    alt={p.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = buildImageUrl('/images/products/placeholder.jpg'); }}
                                                />
                                            ) : (
                                                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" align="center">
                                                        Hiện tại chưa có ảnh
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <ListItemText
                                                primary={p.name}
                                                secondary={`${p.price.toLocaleString('vi-VN')} ₫`}
                                                primaryTypographyProps={{ noWrap: true }}
                                                secondaryTypographyProps={{ noWrap: true }}
                                            />
                                        </Box>
                                    </Box>
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto', pl: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={isLoading || page <= 1}
                        aria-label="Trang trước"
                    >
                        Trước
                    </Button>
                    <Box aria-live="polite">Trang {page} / {Math.max(1, data?.totalPages || 1)}</Box>
                    <Button
                        variant="outlined"
                        onClick={() => setPage((p) => Math.min((data?.totalPages || 1), p + 1))}
                        disabled={isLoading || page >= (data?.totalPages || 1)}
                        aria-label="Trang sau"
                    >
                        Sau
                    </Button>
                </Box>
                <Button onClick={onClose} aria-label="Đóng chọn linh kiện">Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};
