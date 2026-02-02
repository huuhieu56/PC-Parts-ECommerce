/**
 * 🔐 AUTH SERVICE - Computer Shop E-commerce
 * 
 * Service layer để handle tất cả authentication API calls
 * Aligned với backend endpoints từ API_TESTING_GUIDE.md
 * 
 * JSON Convention: API sử dụng snake_case, internal app sử dụng camelCase
 */

import { api } from './api';
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  UserResponse,
  UpdateProfileRequest, 
  ChangePasswordRequest,
  ApiResponse,
  RefreshTokenResponse,
  TokenInfo
} from '../types/auth.types';

export const authService = {
  /**
   * User login - POST /api/v1/users/login
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
  console.log('🔐 Auth Service: Gửi yêu cầu đăng nhập:', credentials);
  // api.post returns the Axios response.data which may be an ApiResponse wrapper or the raw AuthResponse
  const response = await api.post<any>('/users/login', credentials);
  console.log('🔐 Auth Service: Các khóa phản hồi Axios:', Object.keys(response));
  console.log('🔐 Auth Service: Dữ liệu phản hồi:', response.data);
  console.log('🔐 Auth Service: Kiểu dữ liệu phản hồi:', typeof response.data);
  console.log('🔐 Auth Service: Các khóa trong dữ liệu phản hồi:', Object.keys(response.data || {}));
      
      // Debug response structure in detail
      if (response.data) {
  console.log('🔍 Auth Service: Phân tích chi tiết phản hồi:');
  console.log('  - Có access_token?', 'access_token' in response.data);
  console.log('  - Có user?', 'user' in response.data);
  console.log('  - Có refresh_token?', 'refresh_token' in response.data);
  console.log('  - Có token_type?', 'token_type' in response.data);
  console.log('  - Có expires_in?', 'expires_in' in response.data);
      }
      
      // Normalize response: support both ApiResponse wrapper ({ data: AuthResponse }) and raw AuthResponse
      let authData: AuthResponse | null = null;
      if (response && response.data && response.data.access_token) {
        // Possibly api.post returned raw AuthResponse in response.data
        authData = response.data as AuthResponse;
      } else if (response && response.data && response.data.data && response.data.data.access_token) {
        // ApiResponse wrapper: response.data.data contains AuthResponse
        authData = response.data.data as AuthResponse;
      } else if (response && (response as any).access_token) {
        // api.post returned raw AuthResponse directly
        authData = (response as any) as AuthResponse;
      }

      if (authData) {
  console.log('✅ Auth Service: Đăng nhập thành công, dữ liệu auth:', authData);
  console.log('🔐 Auth Service: Role người dùng:', authData.user?.role);
        // Use common store helper to persist tokens + user
        try {
          authService.storeAuthData(authData);
        } catch (err) {
          // Fallback to direct set
          localStorage.setItem('access_token', (authData as any).access_token);
          localStorage.setItem('refresh_token', (authData as any).refresh_token);
          localStorage.setItem('user_info', JSON.stringify(authData.user));
        }
        return authData;
      }

  console.error('❌ Auth Service: Cấu trúc phản hồi không hợp lệ (login)', response);
  throw new Error('Đăng nhập thất bại - cấu trúc phản hồi không hợp lệ');
    } catch (error: any) {
  console.error('❌ Auth Service: Lỗi đăng nhập:', error);
  console.error('❌ Auth Service: Kiểu lỗi:', typeof error);
  console.error('❌ Auth Service: Các khóa lỗi:', Object.keys(error));
      if (error.response?.data) {
  console.error('❌ Auth Service: Dữ liệu phản hồi lỗi:', error.response.data);
  throw new Error(error.response.data.message || 'Đăng nhập thất bại');
      }
      throw error;
    }
  },

  /**
   * User registration - POST /api/v1/users/register
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
  console.log('🔐 Auth Service: Gửi yêu cầu đăng ký:', userData);
  const response = await api.post<AuthResponse>('/users/register', userData);
  console.log('🔐 Auth Service: Phản hồi đăng ký:', response);
      
      // Backend returns AuthResponse directly (no wrapper)
      if (response.data && response.data.access_token && response.data.user) {
        const authData = response.data;
  console.log('✅ Auth Service: Đăng ký thành công, dữ liệu auth:', authData);
        
        // Store tokens in localStorage
        localStorage.setItem('access_token', authData.access_token);
        localStorage.setItem('refresh_token', authData.refresh_token);
        localStorage.setItem('user_info', JSON.stringify(authData.user));
        
        return authData;
      }
      
  console.error('❌ Auth Service: Không có dữ liệu trong phản hồi đăng ký:', response.data);
  throw new Error('Đăng ký thất bại - không nhận được dữ liệu');
    } catch (error: any) {
      console.error('❌ Auth Service: Lỗi đăng ký:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Đăng ký thất bại');
      }
      throw error;
    }
  },

  /**
   * Refresh JWT token - POST /api/v1/users/refresh-token
   */
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    try {
  console.log('🔐 Auth Service: Đang làm mới token...');
      const response = await api.post<ApiResponse<RefreshTokenResponse> | RefreshTokenResponse>(
        `/users/refresh-token?refreshToken=${encodeURIComponent(refreshToken)}`
      );
      
      // Handle both wrapper and direct response
      let tokenData: RefreshTokenResponse;
      if (response.data && 'data' in response.data && response.data.data) {
        // Has ApiResponse wrapper
        tokenData = response.data.data;
  console.log('✅ Auth Service: Làm mới token thành công (có wrapper)');
      } else if (response.data && 'access_token' in response.data) {
        // Direct response
        tokenData = response.data as RefreshTokenResponse;
  console.log('✅ Auth Service: Làm mới token thành công (trực tiếp)');
      } else {
  console.error('❌ Auth Service: Phản hồi làm mới token không hợp lệ:', response.data);
  throw new Error('Làm mới token thất bại - phản hồi không hợp lệ');
      }
      
      return tokenData;
      
    } catch (error: any) {
      console.error('❌ Auth Service: Lỗi làm mới token:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Làm mới token thất bại');
      }
      throw error;
    }
  },

  /**
   * User logout - POST /api/v1/users/logout
   */
  logout: async (): Promise<void> => {
    try {
  console.log('🔐 Auth Service: Đang đăng xuất...');
  await api.post<ApiResponse<void>>('/users/logout');
  console.log('✅ Auth Service: Đăng xuất thành công');
    } catch (error: any) {
  console.error('❌ Auth Service: Lỗi đăng xuất:', error);
      // Don't throw error for logout - always clear local data
    }
  },

  /**
   * Get current user profile - GET /api/v1/users/profile
   */
  getProfile: async (): Promise<UserResponse> => {
    try {
  console.log('🔐 Auth Service: Lấy thông tin người dùng...');
      const response = await api.get<any>('/users/profile');

      // api.get returns axios response.data which may be ApiResponse<T> or raw payload
      const payload: UserResponse | undefined = (response && response.data) ? response.data : response;

      if (payload) {
  console.log('✅ Auth Service: Đã lấy thông tin người dùng thành công');
        return payload as UserResponse;
      }

      throw new Error((response && response.message) || 'Failed to get profile');
    } catch (error: any) {
      console.error('❌ Auth Service: Lỗi lấy profile:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Lấy profile thất bại');
      }
      throw error;
    }
  },

  /**
   * Update user profile - PUT /api/v1/users/profile
   */
  updateProfile: async (profileData: UpdateProfileRequest): Promise<UserResponse> => {
    try {
  console.log('🔐 Auth Service: Đang cập nhật profile...');
      const response = await api.put<any>('/users/profile', profileData);

      const payload: UserResponse | undefined = (response && response.data) ? response.data : response;

      if (payload) {
  console.log('✅ Auth Service: Đã cập nhật profile thành công');
        // Update localStorage user_info if present
        try { localStorage.setItem('user_info', JSON.stringify(payload)); } catch (_) {}
        return payload as UserResponse;
      }

      throw new Error((response && response.message) || 'Failed to update profile');
    } catch (error: any) {
      console.error('❌ Auth Service: Lỗi cập nhật profile:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Cập nhật profile thất bại');
      }
      throw error;
    }
  },

  /**
   * Change password - PUT /api/v1/users/profile/password
   */
  changePassword: async (passwordData: ChangePasswordRequest): Promise<void> => {
    try {
  console.log('🔐 Auth Service: Đang đổi mật khẩu...');
      const response = await api.put<ApiResponse<void>>('/users/profile/password', passwordData);
      
      if (response.data.statusCode !== 200) {
        throw new Error(response.data.message || 'Failed to change password');
      }
      
  console.log('✅ Auth Service: Đã đổi mật khẩu thành công');
    } catch (error: any) {
      console.error('❌ Auth Service: Lỗi đổi mật khẩu:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Đổi mật khẩu thất bại');
      }
      throw error;
    }
  },

  /**
   * Check if user is authenticated based on token validity
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!token || !expiresAt) {
      return false;
    }
    
    return Date.now() < parseInt(expiresAt);
  },

  /**
   * Get stored token info from localStorage
   */
  getStoredTokenInfo: (): TokenInfo | null => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    const expiresIn = localStorage.getItem('token_expires_in');
    const expiresAt = localStorage.getItem('token_expires_at');
    
    if (!accessToken || !refreshToken) {
      return null;
    }
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: tokenType,
      expires_in: expiresIn ? parseInt(expiresIn) : 0,
      expires_at: expiresAt ? parseInt(expiresAt) : 0,
    };
  },

  /**
   * Get stored user info from localStorage
   */
  getStoredUser: (): UserResponse | null => {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  /**
   * Store complete auth data to localStorage
   */
  storeAuthData: (authResponse: AuthResponse): void => {
    const expiresAt = Date.now() + (authResponse.expires_in * 1000);
    
    // Store tokens
    localStorage.setItem('access_token', authResponse.access_token);
    localStorage.setItem('refresh_token', authResponse.refresh_token);
    localStorage.setItem('token_type', authResponse.token_type);
    localStorage.setItem('token_expires_in', authResponse.expires_in.toString());
    localStorage.setItem('token_expires_at', expiresAt.toString());
    
    // Store user info
    localStorage.setItem('user_info', JSON.stringify(authResponse.user));
  },

  /**
   * Clear all auth data from localStorage
   */
  clearAuthData: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('token_expires_in');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('user_info');
  },
};
