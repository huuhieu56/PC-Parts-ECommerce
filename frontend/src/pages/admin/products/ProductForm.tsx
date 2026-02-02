import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Paper, 
  Typography, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Card,
  CardMedia,
  IconButton,
  Alert,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import Slider from '@mui/material/Slider';
import type { SelectChangeEvent } from '@mui/material/Select';
import { 
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../../../services/product.service';
import { categoryService } from '../../../services/category.service';
import type { Product, Category, AttributeDefinition } from '../../../types/product.types';
import { useSnackbar } from '../../../hooks/useSnackbar';

type ManagedImage = {
  id?: number;
  file_path: string;
  is_primary: boolean;
  file?: File;
  source: 'upload' | 'url';
};

const ensurePrimary = (items: ManagedImage[]): ManagedImage[] => {
  if (items.length === 0) {
    return [];
  }
  const primaryIndex = items.findIndex((item) => item.is_primary);
  if (primaryIndex === -1) {
    return items.map((item, index) => ({ ...item, is_primary: index === 0 }));
  }
  return items.map((item, index) => ({ ...item, is_primary: index === primaryIndex }));
};

const ProductForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showError, showSuccess } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Partial<Product>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ManagedImage[]>([]);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>(isEdit ? 'url' : 'upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);
  const [attributeDefs, setAttributeDefs] = useState<AttributeDefinition[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const imagesRef = useRef<ManagedImage[]>([]);

  const updateImages = (updater: (prev: ManagedImage[]) => ManagedImage[]) => {
    setImages((prev) => {
      const next = updater(prev);
      prev
        .filter((img) => img.source === 'upload')
        .forEach((img) => {
          if (!next.some((candidate) => candidate.file_path === img.file_path)) {
            URL.revokeObjectURL(img.file_path);
          }
        });
      return ensurePrimary(next);
    });
  };

  const fetchAttributeDefinitions = useCallback(async (categoryId: number, initialValues?: Record<string, any>) => {
    if (!categoryId) {
      setAttributeDefs([]);
      setAttributeValues({});
      return;
    }

    setLoadingAttributes(true);
    try {
      const defs = await categoryService.getCategoryFilters(categoryId);
      const activeDefs = defs
        .filter((def) => def.is_active !== false)
        .sort((a, b) => {
          const orderA = a.sort_order ?? 9999;
          const orderB = b.sort_order ?? 9999;
          if (orderA === orderB) {
            return a.display_name.localeCompare(b.display_name);
          }
          return orderA - orderB;
        });
      setAttributeDefs(activeDefs);

      const baseValues = initialValues ?? {};
      const normalized: Record<string, any> = {};

      activeDefs.forEach((def) => {
        const rawValue = baseValues[def.code];
        if (rawValue === undefined || rawValue === null) {
          if (def.input_type === 'multi_select') {
            normalized[def.code] = [];
          }
          return;
        }

        if (def.input_type === 'multi_select') {
          normalized[def.code] = Array.isArray(rawValue) ? rawValue : [rawValue];
        } else if (def.input_type === 'checkbox') {
          normalized[def.code] = Boolean(rawValue);
        } else {
          normalized[def.code] = rawValue;
        }
      });

      setAttributeValues(normalized);
    } catch (error: any) {
      console.error('ProductForm fetchAttributeDefinitions error', error);
      showError(error?.message || 'Không thể tải thuộc tính danh mục');
      setAttributeDefs([]);
      setAttributeValues({});
    } finally {
      setLoadingAttributes(false);
    }
  }, [showError]);

  const handleAttributeValueChange = (code: string, value: any) => {
    setAttributeValues((prev) => ({ ...prev, [code]: value }));
  };

  const buildAttributesPayload = (): Record<string, any> => {
    const payload: Record<string, any> = {};
    attributeDefs.forEach((def) => {
      const value = attributeValues[def.code];
      if (value === undefined || value === null) {
        return;
      }
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return;
      }
      payload[def.code] = value;
    });
    return payload;
  };

  useEffect(() => {
    const load = async () => {
      // Load categories
      try { 
        const cats = await categoryService.getActiveCategories();
        setCategories(cats);
      } catch (e) { 
        console.warn('Could not load categories:', e);
      }

      if (isEdit && id) {
        setLoading(true);
        try {
          const p = await productService.getProductById(Number(id));
          setProduct({
            ...p,
            quantity: p.quantity || 0
          } as Partial<Product>);
          
          // Load existing images
          if (p.images && p.images.length > 0) {
            const nextImages: ManagedImage[] = p.images.map((img, index) => ({
              id: img.id,
              file_path: img.file_path,
              is_primary: img.is_primary || index === 0,
              source: 'url'
            }));
            setImages(ensurePrimary(nextImages));
            setImageMode('url');
          } else {
            setImages([]);
            setImageMode('upload');
          }

          // Load specifications
          if (p.specifications) {
            const specs = Object.entries(p.specifications).map(([key, value]) => ({
              key,
              value: String(value)
            }));
            setSpecifications(specs);
          }

          if (p.attributes) {
            setAttributeValues(p.attributes as Record<string, any>);
          } else {
            setAttributeValues({});
          }

          if (p.category?.id) {
            await fetchAttributeDefinitions(p.category.id, p.attributes as Record<string, any> | undefined);
          }
        } catch (err: any) {
          showError('Không tải được sản phẩm: ' + (err.message || err));
        } finally { setLoading(false); }
      }
    };
    load();
  }, [fetchAttributeDefinitions, id, isEdit, showError]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (imageMode !== 'upload') {
      setImageMode('upload');
    }
    const files = event.target.files;
    if (!files) return;

    const newImages: ManagedImage[] = Array.from(files).map((file) => ({
      file_path: URL.createObjectURL(file),
      is_primary: false,
      file,
      source: 'upload',
    }));

    updateImages((prev) => [...prev.filter((img) => img.source === 'upload'), ...newImages]);
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (imageMode !== 'url') {
      setImageMode('url');
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      showError('URL hình ảnh phải bắt đầu bằng http hoặc https');
      return;
    }
    updateImages((prev) => [
      ...prev.filter((img) => img.source === 'url'),
      {
        file_path: trimmed,
        is_primary: false,
        source: 'url',
      },
    ]);
    setImageUrlInput('');
  };

  const handleImageModeChange = (_event: React.MouseEvent<HTMLElement>, nextMode: 'upload' | 'url' | null) => {
    if (!nextMode) return;
    setImageMode(nextMode);
    updateImages((prev) => prev.filter((img) => img.source === nextMode));
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    const categoryId = value ? Number(value) : NaN;
    setProduct((prev) => ({
      ...prev,
      category: Number.isNaN(categoryId) ? undefined : ({ id: categoryId } as any),
    }));

    if (Number.isNaN(categoryId)) {
      setAttributeDefs([]);
      setAttributeValues({});
      return;
    }

    setAttributeDefs([]);
    setAttributeValues({});
    fetchAttributeDefinitions(categoryId, {});
  };

  const selectedCategoryId = ((product.category as Category | undefined)?.id ?? '').toString();

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => () => {
    imagesRef.current.forEach((img) => {
      if (img.source === 'upload') {
        URL.revokeObjectURL(img.file_path);
      }
    });
  }, []);

  const extractOptionValues = (options: any): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) {
      return options
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            if ('label' in item) return String((item as any).label);
            if ('value' in item) return String((item as any).value);
          }
          return String(item ?? '');
        })
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return [];
  };

  const normalizeRangeConfig = (options: any) => {
    const config = { min: 0, max: 100, step: 1 };
    if (options && typeof options === 'object' && !Array.isArray(options)) {
      const min = Number((options as any).min);
      const max = Number((options as any).max);
      const step = Number((options as any).step);
      if (!Number.isNaN(min)) config.min = min;
      if (!Number.isNaN(max)) config.max = max;
      if (!Number.isNaN(step) && step > 0) config.step = step;
    }
    if (config.max < config.min) {
      config.max = config.min;
    }
    return config;
  };

  const renderAttributeField = (def: AttributeDefinition) => {
    const options = extractOptionValues(def.options);
    const currentValue = attributeValues[def.code];

    switch (def.input_type) {
      case 'multi_select': {
        const selectedValues: string[] = Array.isArray(currentValue)
          ? currentValue.map((item) => String(item))
          : currentValue !== undefined && currentValue !== null
            ? [String(currentValue)]
            : [];
        return (
          <FormControl fullWidth>
            <InputLabel>{def.display_name}</InputLabel>
            <Select<string[]>
              multiple
              label={def.display_name}
              value={selectedValues}
              onChange={(event) => {
                const value = event.target.value as string[] | string;
                const nextValues = Array.isArray(value) ? value : String(value).split(',');
                handleAttributeValueChange(def.code, nextValues);
              }}
              renderValue={(selected) => selected.join(', ')}
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {def.unit && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Đơn vị: {def.unit}
              </Typography>
            )}
          </FormControl>
        );
      }
      case 'select': {
        if (options.length === 0) {
          return (
            <TextField
              fullWidth
              label={def.display_name}
              value=""
              placeholder="Chưa cấu hình danh sách lựa chọn"
              disabled
            />
          );
        }
        return (
          <FormControl fullWidth>
            <InputLabel>{def.display_name}</InputLabel>
            <Select
              label={def.display_name}
              value={currentValue !== undefined && currentValue !== null ? String(currentValue) : ''}
              onChange={(event: SelectChangeEvent<string>) =>
                handleAttributeValueChange(def.code, event.target.value)
              }
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {def.unit && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Đơn vị: {def.unit}
              </Typography>
            )}
          </FormControl>
        );
      }
      case 'checkbox': {
        return (
          <FormControlLabel
            control={(
              <Checkbox
                checked={Boolean(currentValue)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  handleAttributeValueChange(def.code, event.target.checked)
                }
              />
            )}
            label={def.display_name}
          />
        );
      }
      case 'range': {
        const { min, max, step } = normalizeRangeConfig(def.options);
        const sliderValue = typeof currentValue === 'number' ? currentValue : min;
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {def.display_name}
            </Typography>
            <Slider
              value={sliderValue}
              min={min}
              max={max}
              step={step}
              valueLabelDisplay="auto"
              disabled={min === max}
              onChange={(_event, value) => {
                const numericValue = Array.isArray(value) ? value[0] : value;
                handleAttributeValueChange(def.code, numericValue);
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Giá trị hiện tại: {sliderValue}
              {def.unit ? ` ${def.unit}` : ''}
            </Typography>
          </Box>
        );
      }
      default:
        return (
          <TextField
            fullWidth
            label={def.display_name}
            value=""
            placeholder="Thuộc tính này chưa hỗ trợ chỉnh sửa"
            disabled
          />
        );
    }
  };

  const handleRemoveImage = (index: number) => {
    updateImages((prev) => {
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    updateImages((prev) => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })));
  };

  const handleAddSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  };

  const handleUpdateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    setSpecifications(prev => prev.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    ));
  };

  const handleRemoveSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convert specifications array to object
      const specsObject = specifications.reduce((acc, spec) => {
        if (spec.key.trim() && spec.value.trim()) {
          acc[spec.key.trim()] = spec.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      const attributesPayload = buildAttributesPayload();

      // Ensure backend receives a non-null integer quantity. Some backend endpoints
      // expect `quantity` while others use `stock_quantity`. Send both to be safe.
      const qty = Number(product.quantity ?? 0);
      const categoryId = (product.category as Category | undefined)?.id ?? 0;

      if (!categoryId) {
        showError('Vui lòng chọn danh mục cho sản phẩm.');
        setSaving(false);
        return;
      }

      const payload = {
        name: product.name?.trim() || '',
        description: product.description?.trim() || '',
        price: Number(product.price || 0),
        // include both fields so backend won't see null for `quantity`
        quantity: qty,
        stock_quantity: qty,
        low_stock_threshold: Number(product.low_stock_threshold ?? 10),
        category_id: categoryId,
  specifications: specsObject,
        attributes: attributesPayload,
        is_active: product.is_active !== undefined ? product.is_active : true,
      } as any;

      if (isEdit && id) {
        await productService.updateProduct(Number(id), payload);
        showSuccess('Cập nhật thành công');
      } else {
        if (imageMode === 'upload') {
          const uploadImages = images.filter((img) => img.source === 'upload');
          if (uploadImages.length === 0) {
            showError('Vui lòng tải lên ít nhất một hình ảnh cho sản phẩm.');
            setSaving(false);
            return;
          }

          const files = uploadImages
            .map((img) => img.file)
            .filter((file): file is File => Boolean(file));

          if (files.length !== uploadImages.length) {
            showError('Hình ảnh đang chưa sẵn sàng để tải lên. Vui lòng thử lại.');
            setSaving(false);
            return;
          }

          const primaryImageIndex = uploadImages.findIndex((img) => img.is_primary);
          const safePrimaryIndex = primaryImageIndex >= 0 ? primaryImageIndex : 0;

          await productService.createProduct(payload, {
            images: files,
            primaryImageIndex: safePrimaryIndex,
          });
        } else {
          const sortedUrlImages = images
            .filter((img) => img.source === 'url')
            .sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1));

          const urlImages = sortedUrlImages
            .map((img) => img.file_path.trim())
            .filter((url) => url.length > 0);

          if (urlImages.length === 0) {
            showError('Vui lòng thêm ít nhất một URL hình ảnh cho sản phẩm.');
            setSaving(false);
            return;
          }

          await productService.createProductWithImageUrls(payload, urlImages);
        }

        showSuccess('Tạo sản phẩm thành công');
      }
      navigate('/admin/products');
    } catch (err: any) {
      showError('Lỗi khi lưu sản phẩm: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">{isEdit ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm'}</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin cơ bản
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth 
              label="Tên sản phẩm" 
              value={product.name || ''} 
              onChange={e => setProduct({ ...product, name: e.target.value })} 
              required 
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                label="Danh mục"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth 
              label="Giá (VNĐ)" 
              type="number" 
              value={product.price ?? ''} 
              onChange={e => setProduct({ ...product, price: Number(e.target.value) })} 
              required
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth 
              label="Số lượng tồn kho" 
              type="number" 
              value={product.quantity ?? ''} 
              onChange={e => setProduct({ ...product, quantity: Number(e.target.value) })} 
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth 
              label="Ngưỡng cảnh báo tồn kho" 
              type="number" 
              value={product.low_stock_threshold ?? 10} 
              onChange={e => setProduct({ ...product, low_stock_threshold: Number(e.target.value) })} 
              helperText="Số lượng tối thiểu để cảnh báo sắp hết hàng"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái sản phẩm</InputLabel>
              <Select
                value={product.is_active !== undefined ? String(product.is_active) : 'true'}
                onChange={e => setProduct({ ...product, is_active: (e.target.value === 'true') })}
                label="Trạng thái sản phẩm"
              >
                <MenuItem value={'true'}>Đang bán</MenuItem>
                <MenuItem value={'false'}>Ngừng bán</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <TextField 
              fullWidth 
              multiline 
              minRows={4} 
              label="Mô tả sản phẩm" 
              value={product.description || ''} 
              onChange={e => setProduct({ ...product, description: e.target.value })} 
            />
          </Grid>
        </Grid>

        {/* Image Management Section */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Hình ảnh sản phẩm
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <ToggleButtonGroup value={imageMode} exclusive onChange={handleImageModeChange} size="small">
              <ToggleButton value="upload">Tải ảnh lên</ToggleButton>
              <ToggleButton value="url">Sử dụng URL hình ảnh</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Ảnh đầu tiên luôn được đặt làm hình chính khi lưu sản phẩm.
            </Typography>
          </Grid>

          {imageMode === 'upload' && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  multiple
                  type="file"
                  onChange={handleImageUpload}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                  >
                    Chọn hình ảnh
                  </Button>
                </label>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Có thể chọn nhiều hình cùng lúc. Hình đầu tiên sẽ là hình chính.
                </Typography>
              </Box>
            </Grid>
          )}

          {imageMode === 'url' && (
            <Grid size={{ xs: 12 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-end' }, mb: 1 }}>
                <TextField
                  fullWidth
                  label="URL hình ảnh"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="https://cdn.example.com/product.jpg"
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddImageUrl}
                  disabled={!imageUrlInput.trim()}
                >
                  Thêm URL
                </Button>
              </Stack>
              <Typography variant="caption" display="block">
                Dùng các URL hình ảnh có sẵn để không phải tải tệp lên hệ thống.
              </Typography>
            </Grid>
          )}

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                {images.map((image, index) => (
                  <Card key={index} sx={{ width: 150, position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="120"
                      image={image.file_path}
                      alt={`Hình sản phẩm ${index + 1}`}
                      sx={{ objectFit: 'cover' }}
                    />
                    <Box sx={{ p: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={image.is_primary ? 'Hình chính' : 'Hình phụ'}
                          size="small"
                          color={image.is_primary ? 'primary' : 'default'}
                          icon={image.is_primary ? <StarIcon /> : <StarBorderIcon />}
                        />
                        <Box>
                          {!image.is_primary && (
                            <IconButton
                              size="small"
                              onClick={() => handleSetPrimaryImage(index)}
                              title="Đặt làm hình chính"
                            >
                              <StarBorderIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            title="Xóa hình"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Grid>
          )}

          {images.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                {imageMode === 'upload'
                  ? 'Chưa có hình ảnh nào. Hãy tải lên ít nhất một hình ảnh cho sản phẩm.'
                  : 'Chưa có URL hình ảnh nào. Hãy thêm ít nhất một URL để hiển thị sản phẩm.'}
              </Alert>
            </Grid>
          )}
        </Grid>

        {/* Category Attributes Section */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Thuộc tính danh mục
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {loadingAttributes && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2">Đang tải thuộc tính phù hợp...</Typography>
              </Box>
            </Grid>
          )}

          {!loadingAttributes && attributeDefs.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                {selectedCategoryId
                  ? 'Danh mục này chưa có thuộc tính nào được cấu hình.'
                  : 'Chọn danh mục để hiển thị các thuộc tính cần thiết cho sản phẩm.'}
              </Alert>
            </Grid>
          )}

          {!loadingAttributes && attributeDefs.map((def) => (
            <Grid size={{ xs: 12, md: 6 }} key={def.id}>
              {renderAttributeField(def)}
            </Grid>
          ))}
        </Grid>

        {/* Specifications Section */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Thông số kỹ thuật
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={handleAddSpecification}
                startIcon={<AddIcon />}
              >
                Thêm thông số
              </Button>
        </Box>
          </Grid>

          {specifications.map((spec, index) => (
            <Grid size={{ xs: 12 }} key={index}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Tên thông số"
                  value={spec.key}
                  onChange={(e) => handleUpdateSpecification(index, 'key', e.target.value)}
                  placeholder="Ví dụ: CPU, RAM, Ổ cứng..."
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Giá trị"
                  value={spec.value}
                  onChange={(e) => handleUpdateSpecification(index, 'value', e.target.value)}
                  placeholder="Ví dụ: Intel i7, 16GB, SSD 512GB..."
                  sx={{ flex: 1 }}
                />
                <IconButton
                  onClick={() => handleRemoveSpecification(index)}
                  color="error"
                  title="Xóa thông số"
                >
                  <DeleteIcon />
                </IconButton>
        </Box>
            </Grid>
          ))}

          {specifications.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                Chưa có thông số kỹ thuật nào. Hãy thêm các thông số như CPU, RAM, ổ cứng, v.v.
              </Alert>
            </Grid>
          )}
        </Grid>

        <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo sản phẩm')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/admin/products')}>
            Hủy
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProductForm;
