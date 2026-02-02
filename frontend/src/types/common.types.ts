// Common utility types
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// Generic form state
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  timestamp: number;
}

// Modal state
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  actions?: React.ReactNode;
}

// Breadcrumb item
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

// Table column definition
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

// File upload types
export interface FileUpload {
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  upload_progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error_message?: string;
}

// Environment types
export interface AppConfig {
  api_base_url: string;
  environment: 'development' | 'production' | 'test';
  version: string;
  features: {
    pc_builder: boolean;
    guest_checkout: boolean;
    reviews: boolean;
    wishlist: boolean;
  };
}
