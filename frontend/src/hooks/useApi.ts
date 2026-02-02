import React, { useState, useCallback } from 'react';
import { useAppDispatch } from '../store';
import { addErrorNotification, addSuccessNotification } from '../store/slices/snackbarSlice';
import type { ApiResponse } from '../types/api.types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  successMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export const useApi = <T = any>() => {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      apiCall: () => Promise<ApiResponse<T>>,
      options: UseApiOptions = {}
    ): Promise<T | null> => {
      const {
        showSuccessMessage = false,
        showErrorMessage = true,
        successMessage,
        onSuccess,
        onError,
      } = options;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall();
        const data = response.data;

        setState({
          data,
          loading: false,
          error: null,
        });

        // Show success notification
        if (showSuccessMessage) {
          const message = successMessage || response.message || 'Thao tác thành công';
          dispatch(addSuccessNotification(message));
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (error: any) {
        const errorMessage = error.message || 'Đã xảy ra lỗi không mong muốn';

        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        // Show error notification
        if (showErrorMessage) {
          dispatch(addErrorNotification(errorMessage));
        }

        // Call error callback
        if (onError) {
          onError(errorMessage);
        }

        return null;
      }
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    data: state.data,
    loading: state.loading,
    error: state.error,
    
    // Actions
    execute,
    reset,
    setData,
    setError,
    clearError,
  };
};

// Hook for simple GET requests
export const useFetch = <T = any>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) => {
  const { execute, ...rest } = useApi<T>();

  // Auto-execute on mount and when dependencies change
  React.useEffect(() => {
    execute(apiCall, { showErrorMessage: true });
  }, dependencies);

  return {
    ...rest,
    refetch: () => execute(apiCall, { showErrorMessage: true }),
  };
};

// Hook for mutation operations (POST, PUT, DELETE)
export const useMutation = <T = any>() => {
  const api = useApi<T>();

  const mutate = useCallback(
    async (
      apiCall: () => Promise<ApiResponse<T>>,
      options: UseApiOptions = {}
    ) => {
      return api.execute(apiCall, {
        showSuccessMessage: true,
        showErrorMessage: true,
        ...options,
      });
    },
    [api]
  );

  return {
    ...api,
    mutate,
  };
};
