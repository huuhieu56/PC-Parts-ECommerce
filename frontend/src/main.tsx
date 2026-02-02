import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { store } from './store';
import { theme } from './theme';
import App from './App.tsx';  // ✅ USING FIXED MAIN APP

// ===== REACT QUERY CONFIGURATION (OPTIMIZED) =====
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,          // Data fresh trong 5 phút
      gcTime: 10 * 60 * 1000,            // Cache 10 phút (renamed from cacheTime)
      retry: 1,                          // Retry 1 lần nếu failed
      refetchOnWindowFocus: false,       // Không refetch khi focus window
      refetchOnMount: true,              // Refetch khi component mount
      refetchOnReconnect: true,          // Refetch khi reconnect
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
