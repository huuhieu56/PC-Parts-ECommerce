/**
 * 🔐 CUSTOMER ROUTE - Computer Shop E-commerce
 * 
 * Protected route component for CUSTOMER-only access
 * Follows SYSTEM_DESIGN.md permissions:
 * - CUSTOMER: Mua hàng, bình luận, build PC
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface CustomerRouteProps {
  children: React.ReactNode;
}

export const CustomerRoute: React.FC<CustomerRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ returnUrl: location.pathname }} 
        replace 
      />
    );
  }

  // Note: For customer routes, we allow any authenticated user
  // since customers can also be staff/admin who want to shop
  return <>{children}</>;
};

export default CustomerRoute;
