import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1";
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh-token",
];

const isAuthEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

/** Flag to prevent multiple logout attempts */
let isLoggingOut = false;

/**
 * Force logout: clear all auth-related data and redirect to login.
 * Throws an error to stop further code execution.
 */
function forceLogout(): never {
  if (isLoggingOut) {
    // Already logging out, just throw to stop execution
    throw new Error("Session expired");
  }
  isLoggingOut = true;

  if (typeof window !== "undefined") {
    // Clear all auth-related storage
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("cart-storage");
    } catch {
      // Ignore storage errors
    }

    // Redirect to login page - this will cause a full page reload
    window.location.href = "/login?expired=true";
  }

  // Throw to stop any further code execution
  throw new Error("Session expired - redirecting to login");
}

/**
 * Axios instance configured for the backend API.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor — adds JWT Authorization header.
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && !isAuthEndpoint(config.url)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — handles 401/403 errors with token refresh.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 401 Unauthorized or 403 Forbidden (token expired/invalid)
    if (status === 401 || status === 403) {
      // Auth endpoints should return their own errors (e.g. wrong password on login)
      // without being transformed into session-expired redirects.
      if (isAuthEndpoint(originalRequest?.url)) {
        return Promise.reject(error);
      }

      // If already retried, force logout (this throws and stops execution)
      if (originalRequest?._retry) {
        forceLogout(); // This throws, so no code after this runs
      }

      // Mark as retry attempt
      if (originalRequest) {
        originalRequest._retry = true;
      }

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          // No refresh token available, force logout
          forceLogout(); // This throws
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem("accessToken", accessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        if (originalRequest) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // UC-CUS-06: Token expired - force logout and redirect to login
        forceLogout(); // This throws
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// --- Product Image API ---

import type { ProductImage } from "@/types";

/**
 * Upload images to a product.
 * @param productId - The product ID
 * @param files - Array of File objects to upload
 * @param primaryFirst - If true, first image becomes primary (default: true)
 * @returns Array of uploaded images
 */
export async function uploadProductImages(
  productId: number,
  files: File[],
  primaryFirst: boolean = true
): Promise<ProductImage[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  formData.append("primaryFirst", String(primaryFirst));

  const response = await api.post(`/products/${productId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data;
}

/**
 * Delete a product image by ID.
 * @param imageId - The image ID to delete
 */
export async function deleteProductImage(imageId: number): Promise<void> {
  await api.delete(`/products/images/${imageId}`);
}
