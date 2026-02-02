/**
 * 📝 REGISTER PAGE - Computer Shop E-commerce
 * 
 * Trang đăng ký tài khoản mới với RegisterForm component
 * Features:
 * - Integration với Redux authentication
 * - Redirect sau khi register thành công
 * - Error handling với real backend APIs
 * - Navigation to login page
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box, Paper } from '@mui/material';

// Custom hooks
import { useAuth } from '../../hooks/useAuth';

// Components
import { RegisterForm } from '../../components/auth';

// Types
import type { RegisterRequest } from '../../types/auth.types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading, error, isAuthenticated } = useAuth();
  
  // Get return URL from query params
  const returnUrl = searchParams.get('returnUrl') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, returnUrl]);

  const handleRegister = async (userData: RegisterRequest) => {
    try {
      await register(userData);
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (err) {
      // Error will be handled by useAuth hook and displayed via error state
      console.error('Registration failed:', err);
    }
  };

  const handleLoginClick = () => {
    const loginUrl = `/login${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
    navigate(loginUrl);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ backgroundColor: 'transparent' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <RegisterForm
            onSubmit={handleRegister}
            onLoginClick={handleLoginClick}
            loading={loading}
            error={error || undefined}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
