import React from 'react';
import { Card, CardContent, Avatar, Typography, Box, Stack, Chip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Sparkline from './Sparkline';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: string; // avatar background color
  hint?: string;
  sparklineData?: number[];
  delta?: number | null; // percent change (positive => up, negative => down)
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, hint, sparklineData, delta = null }) => {
  const positive = (typeof delta === 'number' && delta > 0);
  const negative = (typeof delta === 'number' && delta < 0);

  return (
    <Card sx={{ minWidth: 220, flex: 1, borderRadius: 2 }} elevation={3}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: color || 'primary.main', width: 56, height: 56, boxShadow: 2 }}>{icon}</Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" color="text.secondary" noWrap>{title}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }} noWrap>{value}</Typography>
            {hint && <Typography variant="caption" color="text.secondary" noWrap>{hint}</Typography>}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            {typeof delta === 'number' && (
              <Chip
                size="small"
                icon={positive ? <ArrowUpwardIcon fontSize="small" /> : negative ? <ArrowDownwardIcon fontSize="small" /> : undefined}
                label={`${Math.abs(Math.round((delta) * 100))}%`}
                color={positive ? 'success' : negative ? 'error' : 'default'}
                variant="filled"
                sx={{ fontWeight: 700 }}
              />
            )}

            {sparklineData && sparklineData.length > 0 && (
              <Box sx={{ width: 120 }}>
                <Sparkline data={sparklineData} stroke={positive ? 'success.main' : negative ? 'error.main' : 'text.primary'} />
              </Box>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default StatCard;
