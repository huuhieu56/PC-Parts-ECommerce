// Base API Response Structure
export interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

// Error Response Structure
export interface ApiErrorResponse {
  status_code: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Pagination Interface
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    page_number: number;
    page_size: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  total_pages: number;
  total_elements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  number_of_elements: number;
  first: boolean;
  empty: boolean;
}

// Search and Filter Parameters
export interface SearchParams {
  keyword?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
}
