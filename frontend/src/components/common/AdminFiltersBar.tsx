import React from 'react';
import { Box, Paper, IconButton, alpha, useTheme, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { SearchField } from './SearchField';

interface AdminFiltersBarProps {
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  placeholder?: string;
  loading?: boolean;
  onRefresh?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode; // additional filter controls (Selects, Chips, etc.)
}

const AdminFiltersBar: React.FC<AdminFiltersBarProps> = ({
  searchValue = '',
  onSearchChange,
  placeholder = 'Tìm kiếm...',
  loading = false,
  onRefresh,
  actions,
  children,
}) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.85),
        backdropFilter: 'blur(6px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        boxShadow: theme.shadows[2],
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, width: '100%' }}>
          <Box sx={{ flex: { xs: '1 1 auto', md: '1 1 320px' } }}>
            <SearchField
              value={searchValue}
              onSearch={(v) => onSearchChange?.(v)}
              placeholder={placeholder}
              debounceMs={400}
              size="small"
              fullWidth
              loading={loading}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {children}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {onRefresh && (
            <Tooltip title="Làm mới">
              <IconButton
                onClick={onRefresh}
                aria-label="làm mới"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {actions}
        </Box>
      </Box>
    </Paper>
  );
};

export default AdminFiltersBar;
