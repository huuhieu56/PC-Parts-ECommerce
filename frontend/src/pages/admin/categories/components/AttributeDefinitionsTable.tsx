import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { AttributeDefinition } from '../../../../types/product.types';
import { LoadingButton } from '../../../../components/common/LoadingButton';

interface AttributeDefinitionsTableProps {
  categoryName?: string;
  attributes: AttributeDefinition[];
  loading?: boolean;
  onCreate: () => void;
  onEdit: (attribute: AttributeDefinition) => void;
  onDelete: (attribute: AttributeDefinition) => void;
}

const getInputTypeLabel = (inputType: string) => {
  switch (inputType) {
    case 'select':
      return 'Chọn 1';
    case 'multi_select':
      return 'Chọn nhiều';
    case 'range':
      return 'Khoảng';
    case 'checkbox':
      return 'Checkbox';
    default:
      return inputType;
  }
};

const getDataTypeLabel = (dataType: string) => {
  switch (dataType) {
    case 'string':
      return 'Chuỗi';
    case 'number':
      return 'Số';
    case 'boolean':
      return 'Boolean';
    case 'enum':
      return 'Enum';
    default:
      return dataType;
  }
};

const AttributeDefinitionsTable: React.FC<AttributeDefinitionsTableProps> = ({
  categoryName,
  attributes,
  loading = false,
  onCreate,
  onEdit,
  onDelete,
}) => {
  return (
    <Paper elevation={1} sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Thuộc tính bộ lọc {categoryName ? `• ${categoryName}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý schema bộ lọc/thuộc tính động cho danh mục
          </Typography>
        </Box>
        <LoadingButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
          loading={loading}
        >
          Thêm thuộc tính
        </LoadingButton>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Tên hiển thị</TableCell>
              <TableCell>Kiểu dữ liệu</TableCell>
              <TableCell>Kiểu nhập</TableCell>
              <TableCell>Đơn vị</TableCell>
              <TableCell align="center">Thứ tự</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell width={140} align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attributes.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    Chưa có thuộc tính nào. Nhấn "Thêm thuộc tính" để khởi tạo schema.
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {attributes.map((attribute) => (
              <TableRow key={attribute.id} hover>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                    {attribute.code}
                  </Typography>
                </TableCell>
                <TableCell>{attribute.display_name}</TableCell>
                <TableCell>
                  <Chip label={getDataTypeLabel(attribute.data_type)} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip label={getInputTypeLabel(attribute.input_type)} size="small" color="secondary" variant="outlined" />
                </TableCell>
                <TableCell>{attribute.unit || '—'}</TableCell>
                <TableCell align="center">{attribute.sort_order ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={attribute.is_active === false ? 'Ngưng' : 'Đang dùng'}
                    color={attribute.is_active === false ? 'default' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" onClick={() => onEdit(attribute)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton size="small" onClick={() => onDelete(attribute)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default AttributeDefinitionsTable;
