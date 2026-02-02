/**
 * 🔐 ADMIN ROUTE - Computer Shop E-commerce
 * 
 * Protected route component for ADMIN-only access
 * Follows SYSTEM_DESIGN.md permissions:
 * - ADMIN: Toàn quyền quản lý (users, products, orders, inventory, comments)
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const location = useLocation();

  // Prevent twice-render during initial auth initialization
  const [initialized, setInitialized] = React.useState(false);
  React.useEffect(() => {
    // mark initialized after first render
    if (!initialized) setInitialized(true);
  }, []);

  // Show loading spinner while checking authentication or before initialization completes
  if (loading || !initialized) {
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

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          <strong>Truy cập bị từ chối</strong>
          <br />
          Bạn cần quyền ADMIN để truy cập trang này.
          <br />
          Role hiện tại: {user?.role || 'Không xác định'}
        </Alert>
      </Box>
    );
  }

  // Render protected content for admin users
  return <>{children}</>;
};

export default AdminRoute;
