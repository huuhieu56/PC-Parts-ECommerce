/**
 * 🔍 PRODUCT FILTERS COMPONENT - Computer Shop E-commerce (Optimized)
 * - Category (checkbox)
 * - Price range (debounced, numeric inputs)
 * - Brand (multi-select)
 * - Persisted accordion states
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Slider, TextField, Button,
  Stack, Chip, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import type { SxProps, Theme } from '@mui/material/styles';
import type { AttributeDefinition, ProductFilter } from '../../../types/product.types';
import { useLocation, useNavigate } from 'react-router-dom';

// ===== TYPES =====
export interface ProductFiltersProps {
  filters: ProductFilter;
  maxPrice: number;
  onFiltersChange: (filters: ProductFilter) => void;
  onReset: () => void;
  // Optional: enable dynamic per-category filters when provided
  categoryId?: number | null;
  attributeDefs?: AttributeDefinition[];
  className?: string;
  sx?: SxProps<Theme>;
}

// ===== UTILS =====
const CACHE_KEY = 'pf_expanded_panels_v1';

// Chuẩn hoá format tiền tệ (vi-VN)
const fmt = new Intl.NumberFormat('vi-VN');
const formatPrice = (price: number): string => `${fmt.format(Math.max(0, Math.floor(price)))}đ`;

// Ràng buộc min/max
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const dedupeOptions = (values: string[]): string[] => {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeInputType = (value?: string | null): string => {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
};

// ===== MAIN =====
export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  maxPrice,
  onFiltersChange,
  onReset,
  categoryId,
  attributeDefs,
  className,
  sx,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Khởi tạo panel mở/đóng từ cache
  const [expandedPanels, setExpandedPanels] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch {}
    return ['category', 'price', 'brand'];
  });

  useEffect(() => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(expandedPanels)); } catch {}
  }, [expandedPanels]);

  // ===== HANDLERS =====
  const handlePanelToggle = useCallback((panel: string) => {
    setExpandedPanels(prev => prev.includes(panel) ? prev.filter(p => p !== panel) : [...prev, panel]);
  }, []);

  const updateSearchParams = useCallback((updater: (sp: URLSearchParams) => void, options?: { resetPage?: boolean }) => {
    const sp = new URLSearchParams(location.search);
    updater(sp);
    if (options?.resetPage !== false) {
      sp.delete('page');
    }
    const nextSearch = sp.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    if (nextSearch === currentSearch) {
      return;
    }
    navigate({ pathname: location.pathname, search: nextSearch }, { replace: false });
  }, [location.pathname, location.search, navigate]);

  // Debounce slider: gom sự kiện kéo nhanh
  const priceDebounceRef = useRef<number | null>(null);
  const commitPrice = useCallback((min: number, max: number) => {
    const normalizedMin = min > 0 ? Math.round(min) : undefined;
    const normalizedMax = max < maxPrice ? Math.round(max) : undefined;
    onFiltersChange({
      ...filters,
      min_price: normalizedMin,
      max_price: normalizedMax,
    });
    updateSearchParams((sp) => {
      if (normalizedMin !== undefined) {
        sp.set('min_price', String(normalizedMin));
      } else {
        sp.delete('min_price');
      }
      if (normalizedMax !== undefined) {
        sp.set('max_price', String(normalizedMax));
      } else {
        sp.delete('max_price');
      }
    });
  }, [filters, maxPrice, onFiltersChange, updateSearchParams]);

  const handlePriceChange = useCallback((
    _e: Event | React.SyntheticEvent,
    v: number | number[]
  ) => {
    const [min, max] = v as number[];
    if (priceDebounceRef.current) window.clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = window.setTimeout(() => commitPrice(min, max), 180);
  }, [commitPrice]);

  const handlePriceCommitted = useCallback((
    _e: Event | React.SyntheticEvent,
    v: number | number[]
  ) => {
    const [min, max] = v as number[];
    // đảm bảo commit lần cuối khi thả chuột
    commitPrice(min, max);
  }, [commitPrice]);

  useEffect(() => () => {
    if (priceDebounceRef.current) {
      window.clearTimeout(priceDebounceRef.current);
    }
  }, []);

  // Nhập số thủ công
  const priceValue: [number, number] = useMemo(() => [
    filters.min_price ?? 0,
    filters.max_price ?? maxPrice,
  ], [filters.min_price, filters.max_price, maxPrice]);

  const onMinInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value || 0);
    const min = clamp(raw, 0, priceValue[1]);
    commitPrice(min, priceValue[1]);
  }, [commitPrice, priceValue]);

  const onMaxInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value || 0);
    const max = clamp(raw, priceValue[0], maxPrice);
    commitPrice(priceValue[0], max);
  }, [commitPrice, priceValue, maxPrice]);

  // Build a quick lookup for current URL params
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // ===== Dynamic Attribute Filters (per-category) =====
  const activeAttributeDefs: AttributeDefinition[] = useMemo(() => {
    if (!categoryId || !attributeDefs || attributeDefs.length === 0) return [];
    // filter to supported input types only
    return [...attributeDefs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [categoryId, attributeDefs]);

  // Helpers for options list
  const getOptionsArray = useCallback((def: AttributeDefinition): string[] => {
    const opt = def.options;
    if (!opt) return [];
    if (Array.isArray(opt)) return dedupeOptions(opt.map((v) => String(v)));
    if (typeof opt === 'object') return dedupeOptions(Object.values(opt).map((v) => String(v)));

    if (typeof opt === 'string') {
      const raw = opt.trim();
      if (!raw) return [];
      const delimiters = raw.includes('\n') ? /\r?\n/ : (raw.includes(';') ? /;/ : (raw.includes('|') ? /\|/ : /,/));
      const pieces = raw.split(delimiters).map((v) => v.trim()).filter((v) => v.length > 0);
      if (pieces.length > 0) return dedupeOptions(pieces);
    }

    try {
      const parsed = JSON.parse(String(opt));
      if (Array.isArray(parsed)) return dedupeOptions(parsed.map((v) => String(v)));
      if (typeof parsed === 'object') return dedupeOptions(Object.values(parsed).map((v) => String(v)));
    } catch {}
    return [];
  }, []);

  // Read current selection from URL for a given attribute code
  const readAttrFromUrl = useCallback((code: string) => {
    const key = `attr.${code}`;
    const values = urlParams.getAll(key);
    const minKey = `attr.${code}_min`;
    const maxKey = `attr.${code}_max`;
    const min = urlParams.get(minKey);
    const max = urlParams.get(maxKey);
    return { values, min: min ? Number(min) : undefined, max: max ? Number(max) : undefined };
  }, [urlParams]);

  // Tính số filter đang áp dụng (bao gồm khoảng giá và thuộc tính động)
  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (filters.min_price != null) c += 1;
    if (filters.max_price != null && filters.max_price !== maxPrice) c += 1;
    // Count dynamic attribute filters in URL
    if (activeAttributeDefs.length > 0) {
      for (const def of activeAttributeDefs) {
        const { values, min, max } = readAttrFromUrl(def.code);
        const normalizedType = normalizeInputType(def.input_type);
        if (normalizedType === 'range') {
          if (min != null) c += 1;
          if (max != null) c += 1;
        } else if (normalizedType === 'checkbox') {
          if (values.some((v) => v === 'true')) c += 1;
        } else {
          if (values.length > 0) c += 1;
        }
      }
    }
    return c;
  }, [filters, maxPrice, activeAttributeDefs, readAttrFromUrl]);

  // Mark ticks cho slider (memo)
  const sliderMarks = useMemo(() => ([
    { value: 0, label: '0đ' },
    { value: Math.floor(maxPrice / 2), label: formatPrice(Math.floor(maxPrice / 2)) },
    { value: maxPrice, label: formatPrice(maxPrice) },
  ]), [maxPrice]);

  return (
    <Box className={className} sx={{ p: 2, ...sx }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography component="div" variant="h6" fontWeight={600}>
          Bộ lọc
          {activeFiltersCount > 0 && <Chip label={activeFiltersCount} size="small" color="primary" sx={{ ml: 1 }} />}
        </Typography>
        <Button
          size="small"
          startIcon={<ClearIcon />}
          onClick={() => {
            onReset();
            updateSearchParams((sp) => {
              sp.delete('min_price');
              sp.delete('max_price');
              if (activeAttributeDefs.length > 0) {
                const keys = Array.from(sp.keys());
                keys.forEach((k) => {
                  if (k.startsWith('attr.')) sp.delete(k);
                });
              }
            });
          }}
          disabled={activeFiltersCount === 0}
        >
          Xóa bộ lọc
        </Button>
      </Box>

      <Stack spacing={1}>
        {/* Price only */}
        <Accordion expanded={expandedPanels.includes('price')} onChange={() => handlePanelToggle('price')} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="div" fontWeight={500}>
              Khoảng giá
              {(filters.min_price != null || (filters.max_price != null && filters.max_price !== maxPrice)) && (
                <Chip label="Đã chọn" size="small" color="primary" sx={{ ml: 1 }} />
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatPrice(priceValue[0])} – {formatPrice(priceValue[1])}
              </Typography>

              {/* Inputs số để gõ nhanh */}
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  label="Tối thiểu"
                  size="small"
                  type="number"
                  inputProps={{ min: 0, max: priceValue[1], step: 10000 }}
                  value={priceValue[0]}
                  onChange={onMinInput}
                />
                <TextField
                  label="Tối đa"
                  size="small"
                  type="number"
                  inputProps={{ min: priceValue[0], max: maxPrice, step: 10000 }}
                  value={priceValue[1]}
                  onChange={onMaxInput}
                />
              </Stack>

              <Slider
                value={priceValue}
                onChange={handlePriceChange}
                onChangeCommitted={handlePriceCommitted}
                valueLabelDisplay="auto"
                valueLabelFormat={formatPrice}
                min={0}
                max={maxPrice}
                step={100000}
                marks={sliderMarks}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Dynamic attribute filters when in a category context */}
        {activeAttributeDefs.length > 0 && (
          <>
            {activeAttributeDefs.map((def) => {
              const code = def.code;
              const label = def.display_name || def.code;
              const options = getOptionsArray(def);
              const current = readAttrFromUrl(code);

              const inputType = normalizeInputType(def.input_type);

              if (inputType === 'select') {
                const value = current.values[0] ?? '';
                return (
                  <Accordion key={code} expanded={expandedPanels.includes(code)} onChange={() => handlePanelToggle(code)} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography component="div" fontWeight={500}>{label}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`${code}-label`}>{label}</InputLabel>
                        <Select
                          labelId={`${code}-label`}
                          label={label}
                          value={value}
                          onChange={(e) => {
                            const v = String(e.target.value || '');
                            updateSearchParams((sp) => {
                              // clear previous
                              sp.delete(`attr.${code}`);
                              if (v) sp.append(`attr.${code}`, v);
                            });
                          }}
                        >
                          <MenuItem value=""><em>Tất cả</em></MenuItem>
                          {options.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </AccordionDetails>
                  </Accordion>
                );
              }

              if (inputType === 'multi-select') {
                const values = current.values.length > 0 ? current.values : [];
                return (
                  <Accordion key={code} expanded={expandedPanels.includes(code)} onChange={() => handlePanelToggle(code)} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography component="div" fontWeight={500}>{label}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`${code}-label`}>{label}</InputLabel>
                        <Select
                          labelId={`${code}-label`}
                          label={label}
                          multiple
                          value={values}
                          renderValue={(selected) => (selected as string[]).join(', ')}
                          onChange={(e) => {
                            const arr = Array.isArray(e.target.value) ? (e.target.value as string[]) : [String(e.target.value)];
                            updateSearchParams((sp) => {
                              sp.delete(`attr.${code}`);
                              arr.filter(Boolean).forEach((v) => sp.append(`attr.${code}`, v));
                            });
                          }}
                        >
                          {options.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                              <Checkbox checked={values.includes(opt)} />
                              <ListItemText primary={opt} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </AccordionDetails>
                  </Accordion>
                );
              }

              if (inputType === 'range') {
                const minVal = current.min ?? 0;
                const maxVal = current.max ?? 0;
                return (
                  <Accordion key={code} expanded={expandedPanels.includes(code)} onChange={() => handlePanelToggle(code)} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography component="div" fontWeight={500}>{label}{def.unit ? ` (${def.unit})` : ''}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <TextField
                          label="Tối thiểu"
                          size="small"
                          type="number"
                          value={minVal || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateSearchParams((sp) => {
                              const key = `attr.${code}_min`;
                              if (!v) sp.delete(key); else sp.set(key, String(v));
                            });
                          }}
                        />
                        <TextField
                          label="Tối đa"
                          size="small"
                          type="number"
                          value={maxVal || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateSearchParams((sp) => {
                              const key = `attr.${code}_max`;
                              if (!v) sp.delete(key); else sp.set(key, String(v));
                            });
                          }}
                        />
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              }

              if (inputType === 'checkbox') {
                const checked = current.values.some((v) => v === 'true');
                return (
                  <Accordion key={code} expanded={expandedPanels.includes(code)} onChange={() => handlePanelToggle(code)} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography component="div" fontWeight={500}>{label}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant={checked ? 'contained' : 'outlined'}
                          onClick={() => {
                            updateSearchParams((sp) => {
                              sp.delete(`attr.${code}`);
                              if (!checked) sp.append(`attr.${code}`, 'true');
                            });
                          }}
                        >
                          {checked ? 'Đã bật' : 'Bật'}
                        </Button>
                        {checked && (
                          <Button size="small" onClick={() => updateSearchParams((sp) => sp.delete(`attr.${code}`))}>
                            Bỏ chọn
                          </Button>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              }

              // Fallback: unsupported input type -> skip
              return null;
            })}
          </>
        )}
      </Stack>
    </Box>
  );
};

export default ProductFilters;
