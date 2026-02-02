/**
 * 🔐 AUTH SLICE - Computer Shop E-commerce
 * 
 * Redux slice cho authentication state management
 * Integrated với backend APIs và localStorage persistence
 * Updated to handle snake_case API responses và exact backend format
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';
import type { 
  AuthState, 
  LoginRequest, 
  RegisterRequest, 
  UserResponse, 
  UpdateProfileRequest, 
  ChangePasswordRequest,
  TokenInfo,
  UserRole
} from '../../types/auth.types';

// Helper functions for role management
export const roleUtils = {
  /**
   * Parse role string from backend to UserRole type
   */
  parseRole: (roleString: string): UserRole => {
    // Backend returns simple string: "CUSTOMER", "ADMIN", "STAFF"
    if (['CUSTOMER', 'STAFF', 'ADMIN'].includes(roleString)) {
      return roleString as UserRole;
    }
    return 'CUSTOMER'; // Default fallback
  },

  /**
   * Check if user has specific role
   */
  hasRole: (user: UserResponse | null, role: UserRole): boolean => {
    if (!user) return false;
    return roleUtils.parseRole(user.role) === role;
  },

  /**
   * Check if user is admin
   */
  isAdmin: (user: UserResponse | null): boolean => {
    return roleUtils.hasRole(user, 'ADMIN');
  },

  /**
   * Check if user is staff (includes admin)
   */
  isStaff: (user: UserResponse | null): boolean => {
    return roleUtils.hasRole(user, 'STAFF') || roleUtils.isAdmin(user);
  },

  /**
   * Check if user is customer
   */
  isCustomer: (user: UserResponse | null): boolean => {
    return roleUtils.hasRole(user, 'CUSTOMER');
  },
};

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

// ===== ASYNC THUNKS =====

/**
 * Initialize auth state from localStorage
 */
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.getStoredUser();
      const token = authService.getStoredTokenInfo();
      
      return {
        isAuthenticated,
        user,
        token,
      };
    } catch (error: any) {
  return rejectWithValue('Khởi tạo trạng thái đăng nhập thất bại');
    }
  }
);

/**
 * Login user
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const authResponse = await authService.login(credentials);
      
      // Store auth data to localStorage
      authService.storeAuthData(authResponse);
      
      return authResponse;
    } catch (error: any) {
  return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);

/**
 * Register new user
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const authResponse = await authService.register(userData);
      
      // Store auth data to localStorage
      authService.storeAuthData(authResponse);
      
      return authResponse;
    } catch (error: any) {
  return rejectWithValue(error.message || 'Đăng ký thất bại');
    }
  }
);

/**
 * Logout user
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Call backend logout endpoint
      await authService.logout();
      
      // Clear local storage
      authService.clearAuthData();
      
      return true;
    } catch (error: any) {
      // Even if backend call fails, clear local data
      authService.clearAuthData();
  return rejectWithValue(error.message || 'Đăng xuất thất bại');
    }
  }
);

/**
 * Refresh JWT token
 */
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentRefreshToken = state.auth.token?.refresh_token;
      
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }
      
      const refreshResponse = await authService.refreshToken(currentRefreshToken);
      // Update stored tokens and expiration if provided by backend
      const currentTokenInfo = authService.getStoredTokenInfo();
      if (currentTokenInfo) {
        const newExpiresIn = (refreshResponse as any).expires_in ?? currentTokenInfo.expires_in;
        const newExpiresAt = newExpiresIn ? Date.now() + (newExpiresIn * 1000) : currentTokenInfo.expires_at;

        const updatedTokenInfo: TokenInfo = {
          ...currentTokenInfo,
          access_token: refreshResponse.access_token,
          token_type: refreshResponse.token_type,
          expires_in: newExpiresIn,
          expires_at: newExpiresAt,
        };

        // Persist updated token info to localStorage
        localStorage.setItem('access_token', refreshResponse.access_token);
        localStorage.setItem('token_type', refreshResponse.token_type);
        if (newExpiresIn) localStorage.setItem('token_expires_in', String(newExpiresIn));
        if (newExpiresAt) localStorage.setItem('token_expires_at', String(newExpiresAt));

        return updatedTokenInfo;
      }

  throw new Error('Cập nhật thông tin token thất bại');
    } catch (error: any) {
  return rejectWithValue(error.message || 'Làm mới token thất bại');
    }
  }
);

/**
 * Get user profile
 */
export const getUserProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      // If we already have a stored user in localStorage, return it to avoid unnecessary API calls
      try {
        const stored = authService.getStoredUser();
        if (stored) {
          if (import.meta.env.DEV) console.debug('auth/getProfile: returning cached user from localStorage');
          return stored;
        }
      } catch (e) {
        if (import.meta.env.DEV) console.debug('auth/getProfile: error reading cached user', e);
      }

      // Otherwise, fetch from API
      const user = await authService.getProfile();
      return user;
    } catch (error: any) {
  return rejectWithValue(error.message || 'Không lấy được thông tin người dùng');
    }
  }
);

/**
 * Update user profile
 */
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: UpdateProfileRequest, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      
      // Update stored user info
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error: any) {
  return rejectWithValue(error.message || 'Cập nhật hồ sơ thất bại');
    }
  }
);

/**
 * Change password
 */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      await authService.changePassword(passwordData);
      return true;
    } catch (error: any) {
  return rejectWithValue(error.message || 'Đổi mật khẩu thất bại');
    }
  }
);

// ===== AUTH SLICE =====

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },
    
    // Set user manually (for testing or external updates)
    setUser: (state, action: PayloadAction<UserResponse | null>) => {
      state.user = action.payload;
    },
    
    // Set loading state manually
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = {
          access_token: action.payload.access_token,
          refresh_token: action.payload.refresh_token,
          token_type: action.payload.token_type,
          expires_in: action.payload.expires_in,
          expires_at: Date.now() + (action.payload.expires_in * 1000),
        };
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = {
          access_token: action.payload.access_token,
          refresh_token: action.payload.refresh_token,
          token_type: action.payload.token_type,
          expires_in: action.payload.expires_in,
          expires_at: Date.now() + (action.payload.expires_in * 1000),
        };
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        // Still logout locally even if backend call failed
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // If refresh fails, logout user
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Get Profile
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearError, setUser, setLoading } = authSlice.actions;

// Export reducer
export default authSlice.reducer;
