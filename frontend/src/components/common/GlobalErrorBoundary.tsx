import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import BugIcon from '@mui/icons-material/BugReport';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (e.g., Sentry, LogRocket)
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // This is where you would send the error to your error tracking service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Example: Send to your error tracking service
    console.warn('Error report:', errorReport);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleTryAgain = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <BugIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'error.main', 
                  mb: 2 
                }} 
              />
              <Typography variant="h4" component="h1" gutterBottom>
                Rất tiếc! Đã xảy ra lỗi
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Ứng dụng đã gặp phải một lỗi không mong muốn. 
                Chúng tôi đã ghi nhận sự cố này và sẽ khắc phục sớm nhất có thể.
              </Typography>
            </Box>

            <Stack spacing={2} direction="row" justifyContent="center" mb={4}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleTryAgain}
                color="primary"
              >
                Thử lại
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
              >
                Tải lại trang
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                Về trang chủ
              </Button>
            </Stack>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Chi tiết lỗi (Chế độ phát triển):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.75rem',
                  maxHeight: 200,
                  overflow: 'auto'
                }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </Typography>
              </Alert>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Handled error:', error, errorInfo);
    
    // Report error to tracking service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    console.warn('Error report:', errorReport);
  };

  return { handleError };
};

export default GlobalErrorBoundary;
