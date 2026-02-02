import type { ChipProps } from '@mui/material';
import type { OrderStatus } from '../types/order.types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

export const getOrderStatusLabel = (status?: string): string => {
  const key = (status ?? '').toUpperCase() as OrderStatus;
  return (ORDER_STATUS_LABELS as any)[key] || status || '-';
};

export const getOrderStatusColor = (status?: string): ChipProps['color'] => {
  switch ((status ?? '').toUpperCase()) {
    case 'PENDING': return 'warning';
    case 'CONFIRMED': return 'info';
    case 'PROCESSING': return 'secondary';
    case 'SHIPPED': return 'primary';
    case 'DELIVERED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

export const isCancelableStatus = (status?: string): boolean => {
  const s = (status ?? '').toUpperCase();
  return s !== 'DELIVERED' && s !== 'CANCELLED' && !!s;
};
