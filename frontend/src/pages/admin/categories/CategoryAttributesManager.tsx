import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Typography,
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { categoryService } from '../../../services/category.service';
import type { AttributeDefinition, AttributeDefinitionPayload, Category } from '../../../types/product.types';
import AttributeDefinitionsTable from './components/AttributeDefinitionsTable';
import AttributeFormDialog from './components/AttributeFormDialog';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { useSnackbar } from '../../../hooks/useSnackbar';

const CategoryAttributesManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useSnackbar();

  const [category, setCategory] = useState<Category | null>(null);
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<AttributeDefinition | undefined>(undefined);

  const categoryId = useMemo(() => Number(id), [id]);

  const loadData = useCallback(async () => {
    if (!categoryId) {
      showError('Thiếu ID danh mục');
      return;
    }
    setLoading(true);
    try {
      const [catResponse, attrResponse] = await Promise.all([
        categoryService.getCategoryById(categoryId),
        categoryService.getCategoryFilters(categoryId).catch(() => []),
      ]);
      setCategory(catResponse);
      const sorted = (attrResponse ?? []).slice().sort((a, b) => {
        const orderA = a.sort_order ?? 9999;
        const orderB = b.sort_order ?? 9999;
        if (orderA === orderB) {
          return a.display_name.localeCompare(b.display_name);
        }
        return orderA - orderB;
      });
      setAttributes(sorted);
    } catch (error: any) {
      console.error('CategoryAttributesManager loadData error', error);
      showError(error?.message || 'Không thể tải thông tin danh mục/thuộc tính');
    } finally {
      setLoading(false);
    }
  }, [categoryId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingAttribute(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (attribute: AttributeDefinition) => {
    setEditingAttribute(attribute);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryId || !deleteTarget) return;
    setSaving(true);
    try {
      await categoryService.deleteCategoryAttribute(categoryId, deleteTarget.id);
      showSuccess(`Đã xóa thuộc tính ${deleteTarget.display_name}`);
      setDeleteTarget(undefined);
      await loadData();
    } catch (error: any) {
      console.error('CategoryAttributesManager delete error', error);
      showError(error?.message || 'Không thể xóa thuộc tính');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (payload: AttributeDefinitionPayload) => {
    if (!categoryId) return;
    setSaving(true);
    try {
      if (editingAttribute) {
        await categoryService.updateCategoryAttribute(categoryId, editingAttribute.id, payload);
        showSuccess('Cập nhật thuộc tính thành công');
      } else {
        await categoryService.createCategoryAttribute(categoryId, payload);
        showSuccess('Thêm thuộc tính thành công');
      }
      await loadData();
    } catch (error: any) {
      console.error('CategoryAttributesManager submit error', error);
      showError(error?.message || 'Không thể lưu thuộc tính');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  if (!categoryId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Thiếu ID danh mục.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải dữ liệu danh mục...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link component="button" onClick={() => navigate('/admin/categories')}>
          Danh sách danh mục
        </Link>
        <Typography color="text.primary">Thuộc tính bộ lọc</Typography>
      </Breadcrumbs>

      <Button startIcon={<NavigateBeforeIcon />} onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-start' }}>
        Quay lại
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {category?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {category?.description || 'Danh mục không có mô tả'}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ID: <strong>{category?.id}</strong>
            </Typography>
            {category?.parent_category_name && (
              <Typography variant="body2" color="text.secondary">
                Thuộc nhóm: <strong>{category.parent_category_name}</strong>
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <AttributeDefinitionsTable
        categoryName={category?.name}
        attributes={attributes}
        loading={saving}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={(attribute) => setDeleteTarget(attribute)}
      />

      <AttributeFormDialog
        open={dialogOpen}
        categoryName={category?.name}
        initialValue={editingAttribute}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa thuộc tính"
        message={deleteTarget ? `Bạn chắc chắn muốn xóa thuộc tính "${deleteTarget.display_name}"?` : ''}
        confirmText="Xóa"
        severity="error"
        loading={saving}
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default CategoryAttributesManager;
