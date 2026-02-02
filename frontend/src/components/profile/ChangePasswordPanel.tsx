import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const ChangePasswordPanel: React.FC = () => {
  const { updatePassword } = useAuth();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.new_password !== form.confirm_password) {
      setError('Mật khẩu mới và xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const ok = await updatePassword({ old_password: form.current_password, new_password: form.new_password });
      if (ok) {
        setSuccess(true);
        setForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setError('Đổi mật khẩu thất bại');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'grid', gap: 2, maxWidth: 640 }}>
      <Typography variant="h6">Đổi mật khẩu</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">Mật khẩu đã được cập nhật</Alert>}

      <TextField
        label="Mật khẩu hiện tại"
        type="password"
        value={form.current_password}
        onChange={(e) => setForm({ ...form, current_password: e.target.value })}
        required
      />

      <TextField
        label="Mật khẩu mới"
        type="password"
        value={form.new_password}
        onChange={(e) => setForm({ ...form, new_password: e.target.value })}
        required
      />

      <TextField
        label="Xác nhận mật khẩu mới"
        type="password"
        value={form.confirm_password}
        onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
        required
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          '& > *': { flex: { xs: '1 1 140px', sm: '0 0 auto' } }
        }}
      >
        <Button type="submit" variant="contained" disabled={loading}>
          Lưu
        </Button>
        <Button
          variant="outlined"
          onClick={() => setForm({ current_password: '', new_password: '', confirm_password: '' })}
        >
          Hủy
        </Button>
      </Box>
    </Box>
  );
};

export default ChangePasswordPanel;
