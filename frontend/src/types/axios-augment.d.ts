/**
 * Axios module augmentation for custom API caching flags.
 */

import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Force fetch from server even when a cached entry exists. */
    forceRefresh?: boolean;
    /** Skip storing the response from this request into the cache. */
    skipCache?: boolean;
    /** Provide a custom cache key for the response cache. */
    cacheKey?: string;
    /** Skip automatic cache clearing after mutation-style requests. */
    preserveCache?: boolean;
  }
}
