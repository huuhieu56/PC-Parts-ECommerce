import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography variant="h2" component="h1" gutterBottom>
        404 — Trang không tìm thấy
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Quay lại trang trước
        </Button>
        <Button variant="outlined" onClick={() => navigate('/') }>
          Về trang chủ
        </Button>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
