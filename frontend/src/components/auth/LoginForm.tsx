import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import { LoadingButton } from '@mui/lab'; // ✅ dùng LoadingButton thay cho Button thường
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';

import type { SxProps, Theme } from '@mui/material/styles';
import type { LoginRequest } from '../../types/auth.types';

// ===== COMPONENT PROPS =====
export interface LoginFormProps {
  onSubmit: (credentials: LoginRequest) => Promise<void>;
  loading?: boolean;
  error?: string;
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
  className?: string;
  sx?: SxProps<Theme>;
}

// ===== FORM VALIDATION =====
interface FormErrors {
  identifier?: string;
  password?: string;
  [key: string]: string | undefined;
}

const validateForm = (values: LoginRequest): FormErrors => {
  const errors: FormErrors = {};

  const identifier = (values as any).identifier?.trim() ?? '';
  const password = values.password ?? '';

  if (!identifier) {
    errors.identifier = 'Vui lòng nhập tên đăng nhập / email / số điện thoại';
  } else if (identifier.length < 3) {
    errors.identifier = 'Vui nhập tối thiểu 3 ký tự';
  }

  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu';
  } else if (password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
  }

  return errors;
};

// ===== MAIN COMPONENT =====
export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading = false,
  error,
  onRegisterClick,
  onForgotPasswordClick,
  className,
  sx,
}) => {
  const theme = useTheme();

  // console.log('🔐 LoginForm: Render component với props:', {
  //   onSubmit: typeof onSubmit,
  //   loading,
  //   error,
  //   onRegisterClick: typeof onRegisterClick,
  // });

  // ===== STATE =====
  const [formData, setFormData] = useState<LoginRequest>({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] =
    useState<Partial<Record<keyof LoginRequest, boolean>>>({});

  // ===== HANDLERS =====
  const handleChange =
    (field: keyof LoginRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Xóa lỗi khi người dùng bắt đầu gõ
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleBlur = (field: keyof LoginRequest) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Chỉ validate trường đang blur (tối ưu)
    const fieldErrors = validateForm(formData);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // console.log('🔐 LoginForm: Gọi handleSubmit');

  setTouched({ identifier: true, password: true } as any);

    const formErrors = validateForm(formData);
    // console.log('🔐 LoginForm: Lỗi kiểm tra hợp lệ:', formErrors);
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      // ⚠️ Không log formData để tránh lộ thông tin đăng nhập
      // console.log('🔐 LoginForm: Không có lỗi, gọi onSubmit...');
      try {
        await onSubmit(formData);
        // console.log('✅ LoginForm: onSubmit thực thi thành công');
      } catch (err) {
        // console.error('❌ LoginForm: onSubmit thất bại:', err);
        // Lỗi sẽ được component cha truyền xuống qua prop `error`
      }
    } else {
      // console.log('❌ LoginForm: Có lỗi, không submit');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // ===== RENDER =====
  return (
    <Card
      className={className}
      sx={{
        maxWidth: 400,
        width: '100%',
        mx: 'auto',
        // Disable hover effects for form cards to avoid double-dimming and
        // overlapping hover styles. Keep other cards unchanged.
        '&:hover': {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          transform: 'none',
        },
        ...sx,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LoginIcon
            sx={{
              fontSize: 48,
              color: theme.palette.primary.main,
              mb: 2,
            }}
          />
          <Typography variant="h4" component="h1" gutterBottom>
            Đăng Nhập
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Đăng nhập vào tài khoản Computer Shop của bạn
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Identifier Field (username | email | phone) */}
          <TextField
            fullWidth
            id="identifier"
            name="identifier"
            autoComplete="username"
            label="Tên đăng nhập / Email / Số điện thoại"
            value={(formData as any).identifier}
            onChange={handleChange('identifier')}
            onBlur={handleBlur('identifier')}
            error={!!(touched as any).identifier && !!errors.identifier}
            helperText={!!(touched as any).identifier && errors.identifier}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              // Defensive: prevent per-field hover outline changes
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'inherit',
              },
            }}
          />

          {/* Password Field */}
          <TextField
            fullWidth
            id="password"
            name="password"
            autoComplete="current-password"
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            error={!!(touched as any).password && !!errors.password}
            helperText={!!(touched as any).password && errors.password}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                    disabled={loading}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'inherit',
              },
            }}
          />

          {/* Submit Button */}
          <LoadingButton
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            loading={loading} // ✅ hoạt động đúng với LoadingButton
            disabled={loading}
            sx={{
              mb: 2,
              py: 1.5,
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
            }}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </LoadingButton>

          {/* Forgot Password Link */}
          {onForgotPasswordClick && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Link
                component="button"
                type="button"
                onClick={onForgotPasswordClick}
                variant="body2"
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Quên mật khẩu?
              </Link>
            </Box>
          )}

          {/* Register Link */}
          {onRegisterClick && (
            <>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Hoặc
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  component="span"
                >
                  Chưa có tài khoản?{' '}
                </Typography>
                <Link
                  component="button"
                  type="button"
                  onClick={onRegisterClick}
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Đăng ký ngay
                </Link>
              </Box>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoginForm;