import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const UserInfoPanel: React.FC = () => {
  const { user, getProfile, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        address: user.address ?? ''
      });
    }
  }, [user]);

  const onSave = async () => {
    // Ensure email is sent (backend requires email & full_name)
    await updateProfile({ email: form.email, full_name: form.full_name, phone: form.phone, address: form.address });
    await getProfile();
    setEditing(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Thông tin người dùng</Typography>

      <Box component="form" sx={{ display: 'grid', gap: 2, maxWidth: 640 }}>
        <TextField label="Họ và tên" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} disabled={!editing} />
        <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!editing} />
        <TextField label="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!editing} />
        <TextField label="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={!editing} />

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            '& > *': { flex: { xs: '1 1 120px', sm: '0 0 auto' } }
          }}
        >
          {!editing && <Button variant="contained" onClick={() => setEditing(true)}>Chỉnh sửa</Button>}
          {editing && <Button variant="contained" color="primary" onClick={onSave}>Lưu</Button>}
          {editing && <Button variant="outlined" onClick={() => setEditing(false)}>Hủy</Button>}
        </Box>
      </Box>
    </Box>
  );
};

export default UserInfoPanel;
