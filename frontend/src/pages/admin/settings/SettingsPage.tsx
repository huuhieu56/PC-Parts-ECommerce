import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, FormGroup, FormControlLabel, Switch, TextField, Divider, Button } from '@mui/material';
import { useSnackbar } from '../../../hooks/useSnackbar';

const LS_KEYS = {
  maintenance: 'app_settings_maintenance_mode',
  allowRegister: 'app_settings_allow_register',
  lowStockThreshold: 'app_settings_low_stock_threshold'
};

const SettingsPage: React.FC = () => {
  const { showSuccess } = useSnackbar();
  const [maintenance, setMaintenance] = useState(false);
  const [allowRegister, setAllowRegister] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);

  useEffect(() => {
    try {
      const m = localStorage.getItem(LS_KEYS.maintenance);
      const a = localStorage.getItem(LS_KEYS.allowRegister);
      const l = localStorage.getItem(LS_KEYS.lowStockThreshold);
      if (m !== null) setMaintenance(m === '1');
      if (a !== null) setAllowRegister(a === '1');
      if (l !== null && !Number.isNaN(Number(l))) setLowStockThreshold(Number(l));
    } catch {}
  }, []);

  const persist = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch {}
  };

  const handleSave = () => {
    persist(LS_KEYS.maintenance, maintenance ? '1' : '0');
    persist(LS_KEYS.allowRegister, allowRegister ? '1' : '0');
    persist(LS_KEYS.lowStockThreshold, String(Math.max(1, lowStockThreshold)));
    showSuccess('Đã lưu cài đặt (frontend only)');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Cài đặt hệ thống</Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Tuỳ chọn hiển thị</Typography>
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />}
            label="Bật chế độ bảo trì (frontend)"
          />
          <FormControlLabel
            control={<Switch checked={allowRegister} onChange={(e) => setAllowRegister(e.target.checked)} />}
            label="Cho phép người dùng đăng ký (frontend)"
          />
        </FormGroup>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>Thông báo tồn kho</Typography>
        <TextField
          type="number"
          label="Ngưỡng cảnh báo tồn kho thấp"
          value={lowStockThreshold}
          onChange={(e) => setLowStockThreshold(Number(e.target.value))}
          inputProps={{ min: 1 }}
        />

        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSave}>Lưu cài đặt</Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Lưu ý: Đây là cài đặt phía frontend, không ảnh hưởng tới backend. Có thể tích hợp API thật khi backend sẵn sàng.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
