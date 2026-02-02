/**
 * URL Helper utilities for backend communication
 */

/**
 * Get the backend base URL from environment variable or fallback
 * Priority: VITE_API_BASE_URL env var -> localhost (dev fallback)
 */
export const getBackendBaseUrl = (): string => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  // If env var is set, use it
  if (apiBaseUrl) {
    return apiBaseUrl;
  }

  // Fallback to Vite dev proxy path so we avoid CORS in development
  return '/api/v1';
};

/**
 * Get the backend origin (protocol + host) without /api path
 * Used for building image URLs and other static resources
 */
export const getBackendOrigin = (): string => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

  let origin = apiBaseUrl || '';
  if (!origin) {
    // When using relative /api paths with dev proxy, images should also go through same origin
    origin = '';
  }

  // Remove /api/v1 or /api suffix if present
  const idx = origin.indexOf('/api');
  if (idx !== -1) {
    origin = origin.substring(0, idx);
  }

  // Remove trailing slash
  if (origin && origin.endsWith('/')) {
    origin = origin.slice(0, -1);
  }

  return origin;
};

/**
 * Build absolute URL for backend images
 * @param path - Image path (can be absolute URL, relative path, or null)
 * @param fallback - Fallback image path if path is null/empty
 */
export const buildImageUrl = (path?: string | null, fallback = '/images/products/placeholder.jpg'): string => {
  if (!path) return fallback;

  // If already absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Build absolute URL using backend origin
  const origin = getBackendOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;

  return `${origin}${normalized}`;
};
