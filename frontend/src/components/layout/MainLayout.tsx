import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AppBar } from './AppBar'; // Restored with fixes
// import { SimpleAppBar } from './SimpleAppBar'; // Testing completed
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';

interface MainLayoutProps {
  children?: React.ReactNode;
  showBreadcrumbs?: boolean;
  footerVariant?: 'default' | 'minimal';
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showBreadcrumbs = true,
  footerVariant = 'default',
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* App Bar */}
      <AppBar />

      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Breadcrumbs />
        </Box>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children || <Outlet />}
      </Box>

      {/* Footer */}
      <Footer variant={footerVariant} />
    </Box>
  );
};
