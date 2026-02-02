import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { userService } from '../../../services/user.service';
import { useSnackbar } from '../../../hooks/useSnackbar';
import type { UserResponse } from '../../../types/auth.types';

interface UserFormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showError, showSuccess } = useSnackbar();
  
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // user state is not displayed directly; keep reference only if needed later
  const [, setUser] = useState<UserResponse | null>(null);
  
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
    role: 'CUSTOMER'
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  // Fetch user data for edit mode
  useEffect(() => {
    if (isEdit && id) {
      fetchUser();
    }
  }, [id, isEdit]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const userData = await userService.getUserById(parseInt(id!));
      // userService returns unwrapped data (either object or wrapper with data)
      const userInfo = userData; // userService already unwraps data
      setUser(userInfo);

      setFormData({
        username: userInfo?.username || '',
        email: userInfo?.email || '',
        password: '', // Don't pre-fill password
        fullName: userInfo?.full_name || '',
        phone: userInfo?.phone || '',
        address: userInfo?.address || '',
        role: (userInfo?.role as 'CUSTOMER' | 'STAFF' | 'ADMIN') || 'CUSTOMER'
      });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      showError('Không thể tải thông tin người dùng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên không được để trống';
    }

    if (!isEdit && !formData.password.trim()) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (!isEdit && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // If editing and admin provided a new password, validate its length
    if (isEdit && formData.password && formData.password.length > 0 && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.phone && !/^[0-9+\-\s()]*$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // clear previous server errors
    setServerErrors([]);
    setSaving(true);
    try {
      // Debug: show payload before sending (helps diagnosing 400s)
  if (isEdit) {
        // Admin can only update: email, full_name, phone, address
        // Role and password should not be changed by admin
        const updatePayload: any = {
          // Match backend DTO field names exactly per API_TESTING_GUIDE.md
          username: formData.username,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone || '',
          address: formData.address || '',
          role: formData.role, // keep existing role
        };
        // include password only when admin entered a new one
        if (formData.password && formData.password.trim() !== '') {
          updatePayload.password = formData.password;
        }
        console.debug('PUT /users/' + id + ' payload:', updatePayload);
        await userService.updateUser(parseInt(id!), updatePayload);
        showSuccess('Cập nhật người dùng thành công');
      } else {
        const createPayload = {
          username: formData.username,
          email: formData.email,
          full_name: formData.fullName, // match CreateUserRequest interface
          phone: formData.phone,
          address: formData.address,
          role: formData.role,
          password: formData.password
        };
        console.debug('POST /users/create payload:', createPayload);
        await userService.createUser(createPayload);
        showSuccess('Tạo người dùng thành công');
      }
      
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error saving user:', error);
      // Debug: log raw server validation errors
      if (Array.isArray(error?.errors)) {
        console.debug('Server validation errors array:', error.errors);
      }

      // If backend returned validation errors via GlobalExceptionHandler, api.ts maps them into error.errors
      // error.errors is typically an array of strings like "field: message".
      if (Array.isArray(error?.errors) && error.errors.length > 0) {
        const newFieldErrors: Partial<UserFormData> = {};
        const generalMessages: string[] = [];
        // store raw server errors for UI display
        try { setServerErrors(error.errors.map((e: any) => String(e))); } catch(_) { setServerErrors([]); }
        error.errors.forEach((err: any) => {
          const text = typeof err === 'string' ? err.trim() : String(err || '').trim();
          if (!text) return;

          // Try to parse patterns like "field: message" or "object.field: message"
          const m = text.match(/^([\w.\\-]+)\s*:\s*(.+)$/);
          if (m) {
            let rawField = m[1];
            const message = m[2] || 'Trường không hợp lệ';

            // If dotted path like 'request.email' or 'user.email', take last segment
            if (rawField.includes('.')) {
              const parts = rawField.split('.');
              rawField = parts[parts.length - 1];
            }

            // Normalize field name: snake_case -> camelCase
            const camel = rawField.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

            // Also handle possible camelCase as-is
            const candidateKeys = [camel, rawField];

            // Map to form fields if present
            let mapped = false;
            for (const key of candidateKeys) {
              // @ts-ignore
              if (key in formData) {
                // @ts-ignore
                newFieldErrors[key] = message;
                mapped = true;
                break;
              }
            }

            if (!mapped) {
              generalMessages.push(text);
            }
          } else {
            // Not parsable as field:message -> treat as general message
            generalMessages.push(text);
          }
        });

        if (Object.keys(newFieldErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...newFieldErrors }));
        }

        // Show top general message or first field message in snackbar
        const topMsg = generalMessages.length > 0 ? generalMessages[0] : (Object.values(newFieldErrors)[0] as string | undefined);
        showError((error.message || 'Lỗi') + (topMsg ? ': ' + String(topMsg) : ''));
      } else {
        setServerErrors([]);
        showError(`${isEdit ? 'Cập nhật' : 'Tạo'} người dùng thất bại: ` + (error?.message || error));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
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
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/admin/users')}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Typography variant="h4">
          {isEdit ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          {serverErrors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {serverErrors.map((msg, idx) => (
                <Alert severity="error" key={idx} sx={{ mb: 1 }}>{msg}</Alert>
              ))}
            </Box>
          )}
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Thông tin cơ bản
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
              <TextField
                fullWidth
                label="Tên đăng nhập"
                value={formData.username}
                onChange={handleInputChange('username')}
                error={Boolean(errors.username)}
                helperText={errors.username || (isEdit ? 'Username không thể thay đổi' : '')}
                disabled={isEdit} // Username cannot be changed in edit mode
                required
              />
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
              />
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
              <TextField
                fullWidth
                label="Họ tên"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                error={Boolean(errors.fullName)}
                helperText={errors.fullName}
                required
              />
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
              <FormControl fullWidth required>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  value={formData.role}
                  onChange={handleInputChange('role')}
                  label="Vai trò"
                  disabled={isEdit} // Backend không cho phép thay đổi role
                >
                  <MenuItem value="CUSTOMER">Khách hàng</MenuItem>
                  <MenuItem value="STAFF">Nhân viên</MenuItem>
                  <MenuItem value="ADMIN">Quản trị viên</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Password - Only for new users, not editable by admin */}
            {!isEdit && (
              <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField
                  fullWidth
                  label="Mật khẩu"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={Boolean(errors.password)}
                  helperText={errors.password || 'Mật khẩu phải có ít nhất 6 ký tự'}
                  required={true}
                />
              </Grid>
            )}
            
            {/* Password (edit mode): optional - admin may set a new password */}
            {isEdit && (
              <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField
                  fullWidth
                  label="Mật khẩu mới (để trống nếu không đổi)"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={Boolean(errors.password)}
                  helperText={errors.password || 'Để trống để giữ nguyên mật khẩu hoặc nhập tối thiểu 6 ký tự để đổi'}
                />
              </Grid>
            )}

            {/* Contact Information */}
            <Grid sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Thông tin liên hệ
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
              <TextField
                fullWidth
                label="Số điện thoại"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                error={Boolean(errors.phone)}
                helperText={errors.phone}
              />
            </Grid>

            <Grid sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Địa chỉ"
                multiline
                rows={3}
                value={formData.address}
                onChange={handleInputChange('address')}
              />
            </Grid>

            {/* Submit Buttons */}
            <Grid sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo người dùng')}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/users')}
                  disabled={saving}
                >
                  Hủy
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default UserForm;