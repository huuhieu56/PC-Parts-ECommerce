/**
 * 🔒 PROTECTED ROUTE COMPONENT - Computer Shop E-commerce
 * 
 * Route wrapper để bảo vệ các trang cần authentication
 * Features:
 * - Redirect to login if not authenticated
 * - Role-based access control
 * - Loading state during auth check
 * - Remember redirect location
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

// ===== COMPONENT PROPS =====
export interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  userRoles?: string[]; // String-based role checking  
  requiredRoles?: string[];
  loading?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// ===== LOADING COMPONENT =====
const AuthLoadingSpinner: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      gap: 2,
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      Đang kiểm tra quyền truy cập...
    </Typography>
  </Box>
);

// ===== UTILITY FUNCTIONS =====
const hasRequiredRole = (userRoles: string[], requiredRoles: string[]): boolean => {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // No specific roles required
  }
  
  const userRoleNames = userRoles.map(role => role.toLowerCase());
  return requiredRoles.some(role => userRoleNames.includes(role.toLowerCase()));
};

const buildLoginRedirectUrl = (currentPath: string, redirectTo: string): string => {
  const encodedReturn = encodeURIComponent(currentPath);
  return `${redirectTo}?returnUrl=${encodedReturn}`;
};

// ===== MAIN COMPONENT =====
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  isAuthenticated,
  userRoles = [],
  requiredRoles = [],
  loading = false,
  redirectTo = '/login',
  fallback,
}) => {
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return fallback || <AuthLoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = buildLoginRedirectUrl(location.pathname + location.search, redirectTo);
    return <Navigate to={loginUrl} replace />;
  }

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0 && !hasRequiredRole(userRoles, requiredRoles)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="h5" gutterBottom color="error">
          Không có quyền truy cập
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Bạn không có quyền truy cập vào trang này.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
        </Typography>
      </Box>
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
