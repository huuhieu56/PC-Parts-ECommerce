import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../../../services/category.service';
import type { Category } from '../../../types/product.types';
import { useSnackbar } from '../../../hooks/useSnackbar';

const CategoriesList: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetch = async () => {
    setLoading(true);
    try {
      const resp = await categoryService.getCategories();
      setCategories(resp || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Không tải được danh mục: ' + (serverMsg || String(err)) + details);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleEdit = (id: number) => navigate(`/admin/categories/${id}/edit`);
  const handleManageAttributes = (id: number) => navigate(`/admin/categories/${id}/attributes`);
  const handleDelete = async (id: number) => {
    if (!confirm('Xóa danh mục?')) return;
    try { 
      await categoryService.deleteCategory(id); 
      showSuccess('Đã xóa danh mục thành công'); 
      fetch(); 
    } catch (err: any) { 
      console.error('Error deleting category:', err);
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Xóa danh mục thất bại: ' + (serverMsg || String(err)) + details); 
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Quản lý danh mục</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/categories/create')}>Tạo danh mục</Button>
      </Box>

      <Card>
        <CardContent>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress/></Box> : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Tên</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map(c => (
                    <TableRow key={c.id} hover>
                      <TableCell>{c.id}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.slug}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Quản lý thuộc tính">
                          <IconButton size="small" onClick={() => handleManageAttributes(c.id!)}><TuneIcon/></IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa danh mục">
                          <IconButton size="small" onClick={() => handleEdit(c.id!)}><EditIcon/></IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa danh mục">
                          <IconButton size="small" onClick={() => handleDelete(c.id!)}><DeleteIcon/></IconButton>
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

export default CategoriesList;
