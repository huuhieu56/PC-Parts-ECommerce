import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';

interface LoadingButtonProps extends Omit<ButtonProps, 'disabled'> {
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  disabled = false,
  children,
  startIcon,
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  return (
    <Button
      {...props}
      disabled={isDisabled}
      startIcon={
        loading ? (
          <CircularProgress 
            size={16} 
            color="inherit" 
            sx={{ mr: 0.5 }} 
          />
        ) : (
          startIcon
        )
      }
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};

export default LoadingButton;
