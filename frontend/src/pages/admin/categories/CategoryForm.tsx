import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { categoryService } from '../../../services/category.service';
// import type { Category } from '../../../types/product.types'; // unused

interface CategoryFormData {
  name: string;
  description?: string;
  parent_category_id?: number;
}

const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { showError, showSuccess } = useSnackbar();

  const isEdit = Boolean(params.id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_category_id: undefined
  });
  const [errors, setErrors] = useState<Partial<CategoryFormData>>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isEdit && params.id) {
      fetchCategory();
    }
  }, [isEdit, params.id]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const category = await categoryService.getCategoryById(Number(params.id));
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent_category_id: category.parent_category_id || undefined
      });
    } catch (err: any) {
      console.error('Error fetching category:', err);
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Không tải được danh mục: ' + (serverMsg || String(err)) + details);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CategoryFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên danh mục không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setServerErrors([]);
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        parent_category_id: formData.parent_category_id || undefined
      };

      if (isEdit && params.id) {
        await categoryService.updateCategory(Number(params.id), payload);
        showSuccess('Cập nhật danh mục thành công');
      } else {
        await categoryService.createCategory(payload);
        showSuccess('Tạo danh mục thành công');
      }
      navigate('/admin/categories');
    } catch (err: any) {
      console.error('Error saving category:', err);
      
      // Handle validation errors
      if (Array.isArray(err?.errors) && err.errors.length > 0) {
        setServerErrors(err.errors.map((e: any) => String(e)));
      }
      
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError(`${isEdit ? 'Cập nhật' : 'Tạo'} danh mục thất bại: ` + (serverMsg || String(err)) + details);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CategoryFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
      <Typography variant="h6">{isEdit ? 'Chỉnh sửa danh mục' : 'Tạo danh mục'}</Typography>
      
      {serverErrors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {serverErrors.map((msg, idx) => (
            <Alert severity="error" key={idx} sx={{ mb: 1 }}>{msg}</Alert>
          ))}
        </Box>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField 
          label="Tên danh mục" 
          fullWidth 
          sx={{ mb: 2 }} 
          value={formData.name} 
          onChange={handleInputChange('name')}
          error={Boolean(errors.name)}
          helperText={errors.name}
          required
        />
        
        <TextField 
          label="Mô tả" 
          fullWidth 
          sx={{ mb: 2 }} 
          value={formData.description || ''} 
          onChange={handleInputChange('description')}
          multiline
          rows={3}
        />
        
        <TextField 
          label="ID danh mục cha (không bắt buộc)" 
          fullWidth 
          sx={{ mb: 2 }} 
          type="number"
          value={formData.parent_category_id || ''} 
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            parent_category_id: e.target.value ? Number(e.target.value) : undefined 
          }))}
          helperText="ID của danh mục cha (để trống nếu là danh mục gốc)"
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            type="submit" 
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo danh mục')}
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/admin/categories')}
            disabled={saving}
          >
            Hủy
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CategoryForm;
