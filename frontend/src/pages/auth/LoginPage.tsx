/**
 * 🔐 LOGIN PAGE - Computer Shop E-commerce
 * 
 * Trang đăng nhập chính với LoginForm component
 * Features:
 * - Integration với Redux authentication
 * - Redirect sau khi login thành công
 * - Error handling với real backend APIs
 * - Navigation to register page
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box, Paper } from '@mui/material';

// Custom hooks
import { useAuth } from '../../hooks/useAuth';

// Components
import { LoginForm } from '../../components/auth';

// Types
import type { LoginRequest } from '../../types/auth.types';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  console.log('🔐 LoginPage: Component rendering...');
  
  const { login, loading, error, isAuthenticated, getRedirectUrl, getUserRole } = useAuth();
  console.log('🔐 LoginPage: useAuth hook data:', { loading, error, isAuthenticated });
  
  // Get return URL from query params (support both 'redirect' and 'returnUrl')
  const returnUrl = searchParams.get('redirect') || searchParams.get('returnUrl') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔐 LoginPage useEffect: isAuthenticated changed to:', isAuthenticated);
    if (isAuthenticated) {
      const redirectUrl = getRedirectUrl(returnUrl);
      console.log('🔐 LoginPage: User authenticated, redirecting to:', redirectUrl);
      console.log('🔐 LoginPage: User data:', { user: { role: getUserRole?.() } });
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, returnUrl, getRedirectUrl]);

  const handleLogin = async (credentials: LoginRequest) => {
    console.log('🔐 LoginPage: handleLogin called with:', credentials);
    try {
      console.log('🔐 LoginPage: Calling login function from useAuth...');
      const success = await login(credentials);
      
      if (success) {
        console.log('✅ LoginPage: Login successful!');
        // Navigation will be handled by useEffect when isAuthenticated changes
      } else {
        console.error('❌ LoginPage: Login returned false');
      }
    } catch (err) {
      console.error('❌ LoginPage: Login failed with error:', err);
    }
  };

  const handleRegisterClick = () => {
    const registerUrl = `/register${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
    navigate(registerUrl);
  };

  const handleForgotPasswordClick = () => {
    navigate('/forgot-password');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ backgroundColor: 'transparent' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <LoginForm
            onSubmit={handleLogin}
            onRegisterClick={handleRegisterClick}
            onForgotPasswordClick={handleForgotPasswordClick}
            loading={loading}
            error={error || undefined}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
