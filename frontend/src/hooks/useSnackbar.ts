import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import {
  addNotification,
  removeNotification,
  clearAllNotifications,
  addSuccessNotification,
  addErrorNotification,
  addWarningNotification,
  addInfoNotification,
} from '../store/slices/snackbarSlice';
import type { Notification } from '../types/common.types';

export const useSnackbar = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.snackbar.notifications);

  // Add a custom notification
  const showNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      dispatch(addNotification(notification));
    },
    [dispatch]
  );

  // Success notification
  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      if (duration) {
        dispatch(addNotification({
          type: 'success',
          message,
          duration,
        }));
      } else {
        dispatch(addSuccessNotification(message));
      }
    },
    [dispatch]
  );

  // Error notification
  const showError = useCallback(
    (message: string, duration?: number) => {
      if (duration) {
        dispatch(addNotification({
          type: 'error',
          message,
          duration,
        }));
      } else {
        dispatch(addErrorNotification(message));
      }
    },
    [dispatch]
  );

  // Warning notification
  const showWarning = useCallback(
    (message: string, duration?: number) => {
      if (duration) {
        dispatch(addNotification({
          type: 'warning',
          message,
          duration,
        }));
      } else {
        dispatch(addWarningNotification(message));
      }
    },
    [dispatch]
  );

  // Info notification
  const showInfo = useCallback(
    (message: string, duration?: number) => {
      if (duration) {
        dispatch(addNotification({
          type: 'info',
          message,
          duration,
        }));
      } else {
        dispatch(addInfoNotification(message));
      }
    },
    [dispatch]
  );

  // Remove specific notification
  const hideNotification = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  // Clear all notifications
  const clearAll = useCallback(() => {
    dispatch(clearAllNotifications());
  }, [dispatch]);

  // Quick methods for common scenarios
  const showApiSuccess = useCallback(
    (action: string = 'Thao tác') => {
      showSuccess(`${action} thành công!`);
    },
    [showSuccess]
  );

  const showApiError = useCallback(
    (action: string = 'Thao tác', error?: string) => {
      const message = error || `${action} thất bại. Vui lòng thử lại.`;
      showError(message);
    },
    [showError]
  );

  const showValidationError = useCallback(
    (message: string = 'Vui lòng kiểm tra lại thông tin đã nhập') => {
      showWarning(message);
    },
    [showWarning]
  );

  const showNetworkError = useCallback(() => {
    showError('Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối internet.');
  }, [showError]);

  const showUnauthorizedError = useCallback(() => {
    showError('Bạn không có quyền thực hiện thao tác này.');
  }, [showError]);

  const showSessionExpiredError = useCallback(() => {
    showWarning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }, [showWarning]);

  // E-commerce specific notifications
  const showAddToCartSuccess = useCallback(
    (productName: string) => {
      showSuccess(`Đã thêm "${productName}" vào giỏ hàng`);
    },
    [showSuccess]
  );

  const showRemoveFromCartSuccess = useCallback(
    (productName: string) => {
      showInfo(`Đã xóa "${productName}" khỏi giỏ hàng`);
    },
    [showInfo]
  );

  const showOrderSuccess = useCallback(
    (orderCode: string) => {
      showSuccess(`Đặt hàng thành công! Mã đơn hàng: ${orderCode}`);
    },
    [showSuccess]
  );

  const showStockError = useCallback(
    (productName: string, availableStock: number) => {
      showWarning(`"${productName}" chỉ còn ${availableStock} sản phẩm trong kho`);
    },
    [showWarning]
  );

  return {
    // State
    notifications,
    
    // Basic notification methods
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
    clearAll,
    
    // API-related shortcuts
    showApiSuccess,
    showApiError,
    showValidationError,
    showNetworkError,
    showUnauthorizedError,
    showSessionExpiredError,
    
    // E-commerce specific shortcuts
    showAddToCartSuccess,
    showRemoveFromCartSuccess,
    showOrderSuccess,
    showStockError,
  };
};
