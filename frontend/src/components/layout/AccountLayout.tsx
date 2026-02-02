import React from 'react';
import { Box, List, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';

export type AccountSection = {
  id: string;
  title: string;
};

interface Props {
  sections: AccountSection[];
  activeId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}

const AccountLayout: React.FC<Props> = ({ sections, activeId, onSelect, children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'stretch',
        gap: { xs: 2, md: 3 },
        p: { xs: 1.5, md: 3 }
      }}
    >
      <Paper
        component="nav"
        elevation={1}
        sx={{
          width: { xs: '100%', md: 280 },
          p: { xs: 1, md: 2 },
          flexShrink: 0
        }}
      >
        <Typography variant="h6" sx={{ px: 1, pb: 1 }}>
          Tài khoản
        </Typography>
        <List
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            gap: { xs: 1, md: 0 },
            overflowX: { xs: 'auto', md: 'visible' },
            pb: { xs: 1, md: 0 },
            '&::-webkit-scrollbar': { display: 'none' }
          }}
        >
          {sections.map((s) => (
            <ListItemButton
              key={s.id}
              selected={s.id === activeId}
              onClick={() => onSelect(s.id)}
              sx={{
                borderRadius: 1,
                mb: { xs: 0, md: 1 },
                mr: { xs: 1, md: 0 },
                minWidth: { xs: 160, md: 'unset' },
                flex: { xs: '0 0 auto', md: 'unset' },
                whiteSpace: 'nowrap'
              }}
            >
              <ListItemText primary={s.title} />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      <Box component={Paper} elevation={1} sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
        {children}
      </Box>
    </Box>
  );
};

export default AccountLayout;
