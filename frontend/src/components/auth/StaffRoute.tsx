/**
 * 🔐 STAFF ROUTE - Computer Shop E-commerce
 * 
 * Protected route component for STAFF-only access
 * Follows SYSTEM_DESIGN.md permissions:
 * - STAFF: Xem kho, reply bình luận, xem đơn hàng
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface StaffRouteProps {
  children: React.ReactNode;
}

export const StaffRoute: React.FC<StaffRouteProps> = ({ children }) => {
  const { isAuthenticated, isStaff, loading, user } = useAuth();
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

  // Show access denied if not staff
  if (!isStaff) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          <strong>Truy cập bị từ chối</strong>
          <br />
          Bạn cần quyền STAFF để truy cập trang này.
          <br />
          Role hiện tại: {user?.role || 'Không xác định'}
        </Alert>
      </Box>
    );
  }

  // Render protected content for staff users
  return <>{children}</>;
};

export default StaffRoute;
