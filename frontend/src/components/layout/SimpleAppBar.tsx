import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';

interface SimpleAppBarProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

// Simplified AppBar without Redux selectors to test infinite loop
export const SimpleAppBar: React.FC<SimpleAppBarProps> = ({ 
  onMenuToggle: _onMenuToggle, 
  showMenuButton: _showMenuButton = false 
}) => {
  return (
    <MuiAppBar 
      position="sticky" 
      elevation={1}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          💻 Computer Shop - Simple Test
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Testing without Redux
          </Typography>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default SimpleAppBar;
