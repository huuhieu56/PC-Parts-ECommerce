// User Authentication Types - Match Backend DTOs exactly

// Backend LoginRequest DTO
export interface LoginRequest {
  identifier: string; // username | email | phone
  password: string;
}

// Backend RegisterRequest DTO
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  address?: string;
}

// Backend AuthResponse DTO
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string; // "Bearer"
  expires_in: number; // in seconds
  user: UserResponse;
}

// Backend UserResponse DTO (from UserResponse.java)
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role: string; // Backend returns role as string "Role{id=3, name='CUSTOMER'}"
  is_active: boolean;
}

// User role enumeration - Backend returns these as strings
export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

// Frontend-only types for UI state management
export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // Calculated timestamp for frontend use
}

// Auth State for Redux
export interface AuthState {
  isAuthenticated: boolean;
  user: UserResponse | null;
  token: TokenInfo | null;
  loading: boolean;
  error: string | null;
}

// API Response wrapper (Backend ApiResponse<T>)
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

// Profile update
export interface UpdateProfileRequest {
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// Token refresh response
export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}
