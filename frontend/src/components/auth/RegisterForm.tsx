/**
 * 📝 REGISTER FORM COMPONENT - Computer Shop E-commerce
 * - Real-time & per-field validation
 * - Password strength indicator
 * - Proper a11y & autocomplete
 */

import React, { useMemo, useState } from 'react';
import {
  Box, Card, CardContent, TextField, Typography, Link, Alert,
  InputAdornment, IconButton, LinearProgress, FormControlLabel, Checkbox
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import type { SxProps, Theme } from '@mui/material/styles';
import type { RegisterRequest } from '../../types/auth.types';

// ===== COMPONENT PROPS =====
export interface RegisterFormProps {
  onSubmit: (userData: RegisterRequest) => Promise<void>;
  loading?: boolean;
  error?: string;
  onLoginClick?: () => void;
  className?: string;
  sx?: SxProps<Theme>;
}

// ===== FORM TYPES =====
interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  agreeToTerms?: string;
}

interface FormData extends RegisterRequest {
  confirmPassword: string;
  agreeToTerms: boolean;
}

// ===== PASSWORD STRENGTH =====
const PasswordStrength = { WEAK: 1, FAIR: 2, GOOD: 3, STRONG: 4 } as const;
type PasswordStrengthType = typeof PasswordStrength[keyof typeof PasswordStrength];

const getPasswordStrength = (password: string): PasswordStrengthType => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;
  if (score <= 1) return PasswordStrength.WEAK;
  if (score <= 2) return PasswordStrength.FAIR;
  if (score <= 3) return PasswordStrength.GOOD;
  return PasswordStrength.STRONG;
};

const getPasswordStrengthColor = (s: PasswordStrengthType) =>
  ({ 1: '#f44336', 2: '#ff9800', 3: '#2196f3', 4: '#4caf50' } as const)[s];

const getPasswordStrengthText = (s: PasswordStrengthType) =>
  ({ 1: 'Yếu', 2: 'Trung bình', 3: 'Tốt', 4: 'Mạnh' } as const)[s];

// ===== VALIDATION =====
const validators = {
  username: (v: string) => {
    const val = v.trim();
    if (!val) return 'Vui lòng nhập tên đăng nhập';
    if (val.length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Chỉ chứa chữ, số, dấu gạch dưới';
    return undefined;
  },
  email: (v: string) => {
    const val = v.trim();
    if (!val) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Định dạng email không hợp lệ';
    return undefined;
  },
  password: (v: string) => {
    if (!v) return 'Vui lòng nhập mật khẩu';
    if (v.length < 8) return 'Ít nhất 8 ký tự';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v))
      return 'Phải có chữ hoa, chữ thường và số';
    return undefined;
  },
  confirmPassword: (v: string, all: FormData) => {
    if (!v) return 'Vui lòng xác nhận mật khẩu';
    if (v !== all.password) return 'Mật khẩu xác nhận không khớp';
    return undefined;
  },
  full_name: (v: string) => {
    const val = v.trim();
    if (!val) return 'Vui lòng nhập họ và tên';
    if (val.length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
    return undefined;
  },
  phone: (v?: string) => {
    if (!v) return undefined; // không bắt buộc
    if (!/^(\+84|0)[3-9]\d{8}$/.test(v)) return 'SĐT không hợp lệ (VD: 0901234567)';
    return undefined;
  },
  address: (_?: string) => undefined, // không bắt buộc
  agreeToTerms: (b: boolean) => (b ? undefined : 'Vui lòng đồng ý với điều khoản'),
};

const validateForm = (values: FormData): FormErrors => ({
  username: validators.username(values.username),
  email: validators.email(values.email),
  password: validators.password(values.password),
  confirmPassword: validators.confirmPassword(values.confirmPassword, values),
  full_name: validators.full_name(values.full_name),
  phone: validators.phone(values.phone),
  address: validators.address(values.address),
  agreeToTerms: validators.agreeToTerms(values.agreeToTerms),
});

// ===== MAIN COMPONENT =====
const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading = false,
  error,
  onLoginClick,
  className,
  sx,
}) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  // per-field change
  const handleChange =
    (field: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === 'checkbox'
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value as any }));

      // clear field error
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  // per-field blur validate
  const handleBlur = (field: keyof FormData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err =
      field === 'confirmPassword'
        ? validators.confirmPassword(formData.confirmPassword, formData)
        : (validators as any)[field](formData[field as keyof FormData]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // mark all touched
    const allTouched = Object.keys(formData).reduce((acc, k) => {
      acc[k as keyof FormData] = true;
      return acc;
    }, {} as Partial<Record<keyof FormData, boolean>>);
    setTouched(allTouched);

    const formErrs = validateForm(formData);
    setErrors(formErrs);

    if (Object.values(formErrs).every((v) => !v)) {
      const submitData: RegisterRequest = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };
      try {
        await onSubmit(submitData);
      } catch {
        // error được hiển thị qua prop `error` từ component cha (nếu có)
      }
    }
  };

  const showErr = (field: keyof FormData) => Boolean(touched[field] && errors[field]);

  return (
    <Card className={className} sx={{ maxWidth: 500, mx: 'auto', boxShadow: 3, borderRadius: 2, ...sx }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Đăng Ký
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tạo tài khoản để trải nghiệm mua sắm tuyệt vời
          </Typography>
        </Box>

        {/* Error Alert (server) */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="Tên đăng nhập *"
            name="username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange('username')}
            onBlur={handleBlur('username')}
            error={showErr('username')}
            helperText={showErr('username') ? errors.username : 'Chỉ chứa chữ cái, số và dấu gạch dưới'}
            disabled={loading}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Email *"
            name="email"
            autoComplete="email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            error={showErr('email')}
            helperText={showErr('email') ? errors.email : ''}
            disabled={loading}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Họ và tên *"
            name="full_name"
            autoComplete="name"
            value={formData.full_name}
            onChange={handleChange('full_name')}
            onBlur={handleBlur('full_name')}
            error={showErr('full_name')}
            helperText={showErr('full_name') ? errors.full_name : ''}
            disabled={loading}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Số điện thoại *"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            onBlur={handleBlur('phone')}
            error={showErr('phone')}
            helperText={showErr('phone') ? errors.phone : 'Không bắt buộc'}
            disabled={loading}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Địa chỉ"
            name="address"
            autoComplete="street-address"
            multiline
            rows={2}
            value={formData.address}
            onChange={handleChange('address')}
            onBlur={handleBlur('address')}
            error={showErr('address')}
            helperText={showErr('address') ? errors.address : 'Không bắt buộc'}
            disabled={loading}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                  <HomeIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Mật khẩu *"
            name="new-password"
            autoComplete="new-password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            error={showErr('password')}
            helperText={showErr('password') ? errors.password : 'Ít nhất 8 ký tự, chứa chữ hoa, thường và số'}
            disabled={loading}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    edge="end"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {formData.password && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Độ mạnh mật khẩu:</Typography>
                <Typography variant="caption" sx={{ color: getPasswordStrengthColor(passwordStrength), fontWeight: 'bold' }}>
                  {getPasswordStrengthText(passwordStrength)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(passwordStrength / 4) * 100}
                sx={{
                  height: 4, borderRadius: 2, backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': { backgroundColor: getPasswordStrengthColor(passwordStrength), borderRadius: 2 },
                }}
              />
            </Box>
          )}

          <TextField
            fullWidth
            label="Xác nhận mật khẩu *"
            name="confirm-password"
            autoComplete="new-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            onBlur={handleBlur('confirmPassword')}
            error={showErr('confirmPassword')}
            helperText={showErr('confirmPassword') ? errors.confirmPassword : ''}
            disabled={loading}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    disabled={loading}
                    edge="end"
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.agreeToTerms}
                onChange={handleChange('agreeToTerms')}
                disabled={loading}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                Tôi đồng ý với{' '}
                <Link href="#" underline="hover" color="primary">Điều khoản sử dụng</Link>{' '}
                và{' '}
                <Link href="#" underline="hover" color="primary">Chính sách bảo mật</Link>
              </Typography>
            }
            sx={{ mt: 2, mb: 0.5 }}
          />
          {showErr('agreeToTerms') && (
            <Typography variant="caption" color="error" sx={{ ml: 4 }}>
              {errors.agreeToTerms}
            </Typography>
          )}

          <LoadingButton
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            loading={loading}
            disabled={loading}
            startIcon={<PersonAddIcon />}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
          </LoadingButton>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Đã có tài khoản?{' '}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={onLoginClick}
                disabled={loading}
                sx={{ fontWeight: 'bold', textDecoration: 'none', cursor: loading ? 'default' : 'pointer',
                  '&:hover': { textDecoration: !loading ? 'underline' : 'none' } }}
              >
                Đăng nhập ngay
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;
