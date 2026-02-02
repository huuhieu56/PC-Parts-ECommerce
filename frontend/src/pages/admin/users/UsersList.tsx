import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TablePagination,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../../services/user.service';
import type { UserResponse } from '../../../types/auth.types';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useDebounce } from '../../../hooks/useDebounce';
import AdminFiltersBar from '../../../components/common/AdminFiltersBar';

const DEFAULT_PAGE_SIZE = 10;

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng'
};

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 400);
  const requestIdRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const response = await userService.getAllUsers({
        page,
        size: rowsPerPage,
        sort: 'createdAt,desc',
        search: debouncedSearch,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }

      setTotalElements(response.totalElements);

      if (page > 0 && response.totalElements > 0 && response.content.length === 0) {
        const fallbackPage = Math.max(0, Math.min(page - 1, response.totalPages - 1));
        setPage(fallbackPage);
        return;
      }

      setUsers(response.content);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (requestId === requestIdRef.current) {
        const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
        const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
        showError('Không tải được danh sách người dùng: ' + (serverMsg || String(err)) + details);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, page, rowsPerPage, showError]);

  useEffect(() => {
    fetchUsers();
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchUsers]);

  useEffect(() => {
    setPage((prev) => (prev === 0 ? prev : 0));
  }, [debouncedSearch]);

  const handleEdit = (id: number) => navigate(`/admin/users/${id}/edit`);

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa người dùng?')) return;
    try {
      await userService.deleteUser(id);
      showSuccess('Xóa người dùng thành công');
      fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      const serverMsg = err?.message || err?.response?.data?.message || (err?.status_code ? `${err.status_code}` : null);
      const details = err?.errors ? ` (${JSON.stringify(err.errors)})` : '';
      showError('Xóa thất bại: ' + (serverMsg || String(err)) + details);
    }
  };

  const handleViewOrders = (id: number) => {
    navigate({ pathname: '/admin/orders', search: `?userId=${id}` });
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderRole = useCallback((role?: string) => {
    if (!role) return 'Không xác định';
    return ROLE_LABEL[role] ?? role;
  }, []);

  const statusChip = useCallback((isActive?: boolean) => (
    <Chip
      size="small"
      label={isActive ? 'Hoạt động' : 'Đã khóa'}
      color={isActive ? 'success' : 'default'}
      variant={isActive ? 'filled' : 'outlined'}
    />
  ), []);

  const emptyState = useMemo(() => !loading && users.length === 0, [loading, users.length]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Quản lý người dùng</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/users/create')}>
          Tạo người dùng
        </Button>
      </Box>

      <AdminFiltersBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        placeholder="Tìm username, email, số điện thoại..."
        loading={loading}
        onRefresh={fetchUsers}
      />

      <Card>
        <CardContent sx={{ p: 0 }}>
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
                    <TableCell>Tên đăng nhập</TableCell>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Số điện thoại</TableCell>
                    <TableCell>Vai trò</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.id ?? 'N/A'}</TableCell>
                      <TableCell>{user.username ?? 'N/A'}</TableCell>
                      <TableCell>{user.full_name ?? 'N/A'}</TableCell>
                      <TableCell>{user.email ?? 'N/A'}</TableCell>
                      <TableCell>{user.phone ?? '-'}</TableCell>
                      <TableCell>{renderRole(user.role)}</TableCell>
                      <TableCell>{statusChip(user.is_active)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Lịch sử đơn hàng">
                          <span>
                            <IconButton size="small" onClick={() => handleViewOrders(user.id!)}>
                              <HistoryIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <span>
                            <IconButton size="small" onClick={() => handleEdit(user.id!)}>
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Xóa người dùng">
                          <span>
                            <IconButton size="small" color="error" onClick={() => handleDelete(user.id!)}>
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {emptyState && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary">
                          Không có người dùng nào phù hợp với tìm kiếm.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count}`}
            labelRowsPerPage="Số dòng mỗi trang"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default UsersList;
