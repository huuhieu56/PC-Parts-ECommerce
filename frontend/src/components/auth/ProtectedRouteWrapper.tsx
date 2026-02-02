/**
 * 🔒 PROTECTED ROUTE WRAPPER - Computer Shop E-commerce
 * 
 * Wrapper component kết hợp ProtectedRoute với useAuth hook
 * Features:
 * - Auto-integration với auth state từ Redux
 * - Simplified usage trong AppRoutes
 * - Type-safe props
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

// ===== COMPONENT PROPS =====
export interface ProtectedRouteWrapperProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// ===== MAIN COMPONENT =====
const ProtectedRouteWrapper: React.FC<ProtectedRouteWrapperProps> = ({
  children,
  requiredRoles = [],
  redirectTo = '/login',
  fallback,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Parse role string to array for ProtectedRoute component
  const userRoles = user?.role ? [user.role] : [];

  return (
    <ProtectedRoute
      isAuthenticated={isAuthenticated}
      userRoles={userRoles}
      requiredRoles={requiredRoles}
      loading={loading}
      redirectTo={redirectTo}
      fallback={fallback}
    >
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRouteWrapper;
