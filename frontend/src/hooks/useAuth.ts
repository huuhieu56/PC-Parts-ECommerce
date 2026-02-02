/**
 * 🔐 USE AUTH HOOK - Computer Shop E-commerce
 * 
 * Custom hook để quản lý authentication state và actions
 * Integrated với Redux store và localStorage persistence
 * Updated với role-based helpers và exact backend API format
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch, type RootState } from '../store';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  refreshToken,
  getUserProfile, 
  updateUserProfile, 
  changePassword,
  clearError,
  roleUtils
} from '../store/slices/authSlice';
import type { 
  LoginRequest, 
  RegisterRequest, 
  UpdateProfileRequest, 
  ChangePasswordRequest,
  UserResponse,
  UserRole
} from '../types/auth.types';

interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  user: UserResponse | null;
  token: any;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  getProfile: () => Promise<boolean>;
  updateProfile: (profileData: UpdateProfileRequest) => Promise<boolean>;
  updatePassword: (passwordData: ChangePasswordRequest) => Promise<boolean>;
  clearAuthError: () => void;
  refreshAuthToken: () => Promise<boolean>;
  
  // Role-based helpers (following SYSTEM_DESIGN.md)
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  
  // Utility functions
  getRedirectUrl: (returnUrl?: string) => string;
  getUserRole: () => string | null;
  
  // Permission-based helpers
  canManageUsers: boolean;      // ADMIN only
  canManageProducts: boolean;   // ADMIN + STAFF  
  canManageOrders: boolean;     // ADMIN + STAFF
  canViewInventory: boolean;    // ADMIN + STAFF
  canReplyComments: boolean;    // ADMIN + STAFF
  canDeleteComments: boolean;   // ADMIN only
}

export const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state: RootState) => state.auth);
  
  // Destructure auth state properly
  const { 
    isAuthenticated, 
    user, 
    token, 
    loading, 
    error 
  } = authState;

  // Ref to prevent concurrent refresh operations (unused while auto-refresh disabled)
  // const refreshInProgressRef = useRef(false);

  // Initialize auth state on mount
  // NOTE: auth initialization is performed once at the app root (see `App.tsx`).
  // Avoid dispatching `initializeAuth()` inside this hook to prevent multiple
  // components from triggering repeated initialization and causing render loops.

  // Auto-refresh token before expiration - TEMPORARILY DISABLED
  useEffect(() => {
    // Auto-refresh disabled: do not schedule automatic refreshes here.
    // Manual refresh can still be triggered via `refreshAuthToken()` returned by this hook.
  }, [dispatch, isAuthenticated, token]);

  // Login function with role-based redirect
  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    try {
      console.log('🔐 useAuth: Starting login process...');
      const result = await dispatch(loginUser(credentials));
      console.log('🔐 useAuth: Login result:', result);
      
      if (result.type === 'auth/login/fulfilled') {
        console.log('✅ useAuth: Login successful');
        return true;
      } else {
        console.error('❌ useAuth: Login failed:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ useAuth: Login error:', error);
      return false;
    }
  }, [dispatch]);

  // Get user role name from role string
  const getUserRole = useCallback((): string | null => {
    return user?.role || null;
  }, [user]);

  // Check if user has specific role - updated to use roleUtils
  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user) return false;
    return roleUtils.hasRole(user, role);
  }, [user]);

  // Get redirect URL based on user role (following SYSTEM_DESIGN.md)
  const getRedirectUrl = useCallback((returnUrl: string = '/'): string => {
    const userRole = getUserRole();
    
    if (userRole === 'ADMIN') {
      return '/admin'; // Admin users go to admin dashboard
    }
    
    if (userRole === 'STAFF') {
      return '/staff'; // Staff users go to staff panel
    }
    
    // CUSTOMER goes to return URL or home
    return returnUrl;
  }, [getUserRole]);

  // Register function  
  const register = useCallback(async (userData: RegisterRequest): Promise<boolean> => {
    try {
      const result = await dispatch(registerUser(userData));
      return result.type === 'auth/register/fulfilled';
    } catch {
      return false;
    }
  }, [dispatch]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    await dispatch(logoutUser());
  }, [dispatch]);

  // Get user profile
  const getProfile = useCallback(async (): Promise<boolean> => {
    try {
      const result = await dispatch(getUserProfile());
      return result.type === 'auth/getProfile/fulfilled';
    } catch {
      return false;
    }
  }, [dispatch]);

  // Update profile function
  const updateProfile = useCallback(async (profileData: UpdateProfileRequest): Promise<boolean> => {
    try {
      const result = await dispatch(updateUserProfile(profileData));
      return result.type === 'auth/updateProfile/fulfilled';
    } catch {
      return false;
    }
  }, [dispatch]);

  // Change password function
  const updatePassword = useCallback(async (passwordData: ChangePasswordRequest): Promise<boolean> => {
    try {
      const result = await dispatch(changePassword(passwordData));
      return result.type === 'auth/changePassword/fulfilled';
    } catch {
      return false;
    }
  }, [dispatch]);

  // Clear error
  const clearAuthError = useCallback((): void => {
    dispatch(clearError());
  }, [dispatch]);

  // Refresh token function  
  const refreshAuthToken = useCallback(async (): Promise<boolean> => {
    try {
      const result = await dispatch(refreshToken());
      return result.type === 'auth/refreshToken/fulfilled';
    } catch {
      return false;
    }
  }, [dispatch]);

  // Check if user is admin  
  const isAdmin = useMemo(() => roleUtils.isAdmin(user), [user]);
  const isStaff = useMemo(() => roleUtils.isStaff(user), [user]);
  const isCustomer = useMemo(() => roleUtils.isCustomer(user), [user]);

  // Permission-based access control (following SYSTEM_DESIGN.md)
  const canManageUsers = isAdmin; // Only ADMIN can manage users
  const canManageProducts = isAdmin || isStaff; // ADMIN + STAFF can manage products
  const canManageOrders = isAdmin || isStaff; // ADMIN + STAFF can manage orders  
  const canViewInventory = isAdmin || isStaff; // ADMIN + STAFF can view inventory
  const canReplyComments = isAdmin || isStaff; // ADMIN + STAFF can reply comments
  const canDeleteComments = isAdmin; // Only ADMIN can delete comments

  return {
    // State
    isAuthenticated,
    user,
    token,
    loading,
    error,
    
    // Actions
    login,
    register,
    logout,
    getProfile,
    updateProfile,
    updatePassword,
    clearAuthError,
    refreshAuthToken,
    
    // Role-based helpers
    hasRole,
    getUserRole,
    getRedirectUrl,
    isAdmin,
    isStaff,
    isCustomer,
    
    // Permission-based helpers
    canManageUsers,
    canManageProducts,
    canManageOrders,
    canViewInventory,
    canReplyComments,
    canDeleteComments,
  };
};
