import React, { useEffect } from 'react';
import { 
  ThemeProvider,
  CssBaseline 
} from '@mui/material';
import { BrowserRouter } from 'react-router-dom';

// Redux
import { useAppDispatch } from './store';
import { initializeAuth } from './store/slices/authSlice';
import { initializeCart } from './store/slices/cartSlice';

// Theme
import { shopTheme } from './theme';

// Routes
import { AppRoutes } from './routes/AppRoutes';

// Error Boundary
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';

/**
 * 🏪 MAIN APP COMPONENT - Computer Shop E-commerce
 * 
 * Production-ready app với:
 * - Professional theme system
 * - Routing với lazy loading  
 * - Redux state management
 * - Error boundary protection
 * - Layout system integration
 * 
 * Tuân thủ SYSTEM_DESIGN.md specification
 */
const App: React.FC = () => {
  const dispatch = useAppDispatch();

  // Initialize app state once on mount
  useEffect(() => {
    dispatch(initializeAuth());
    dispatch(initializeCart());
  }, [dispatch]);

  return (
    <ThemeProvider theme={shopTheme}>
      <CssBaseline />
      <GlobalErrorBoundary>
        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
        </BrowserRouter>
      </GlobalErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
