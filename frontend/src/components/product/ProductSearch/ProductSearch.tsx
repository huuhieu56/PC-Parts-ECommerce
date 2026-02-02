/**
 * 🔍 PRODUCT SEARCH COMPONENT - Computer Shop E-commerce
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Button,
  Popper,
  ClickAwayListener,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';

// Hooks
import { useDebounce } from '../../../hooks/useDebounce';

// ===== TYPES =====
export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand' | 'history' | 'popular';
  count?: number;
  image?: string;
  category?: string;
}

export interface ProductSearchProps {
  value: string;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  popularSearches?: string[];
  searchHistory?: string[];
  loading?: boolean;
  // Advanced features removed: keep component minimal
  maxSuggestions?: number;
  debounceMs?: number;
  onChange: (value: string) => void;
  onSearch: (query: string, filters?: Record<string, any>) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  onClear?: () => void;
  className?: string;
  sx?: any;
}

// ===== CONSTANTS =====
const DEFAULT_POPULAR_SEARCHES = [
  'CPU Intel',
  'VGA RTX 4060',
  'RAM 16GB',
  'SSD 1TB',
  'Mainboard B550',
  'PSU 750W',
  'Case gaming',
  'Cooler CPU',
];

// ===== HELPER FUNCTIONS =====
const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <Box key={index} component="span" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', px: 0.5, borderRadius: 0.5 }}>
        {part}
      </Box>
    ) : part
  );
};

const getSuggestionIcon = (type: SearchSuggestion['type']) => {
  switch (type) {
    case 'history':
      return <HistoryIcon fontSize="small" color="action" />;
    case 'popular':
      return <TrendingUpIcon fontSize="small" color="action" />;
    case 'category':
      return <SearchIcon fontSize="small" color="primary" />;
    case 'brand':
      return <SearchIcon fontSize="small" color="secondary" />;
    default:
      return <SearchIcon fontSize="small" color="action" />;
  }
};

// ===== MAIN COMPONENT =====
export const ProductSearch: React.FC<ProductSearchProps> = ({
  value,
  placeholder = 'Tìm kiếm sản phẩm, thương hiệu...',
  suggestions = [],
  popularSearches = DEFAULT_POPULAR_SEARCHES,
  searchHistory = [],
  // advanced/voice/qr flags removed
  maxSuggestions = 8,
  debounceMs = 300,
  onChange,
  onSearch,
  onSuggestionSelect,
  onClear,
  className,
  sx,
}) => {
  const theme = useTheme() as any; // narrow typing causes issues with custom theme typings
  const isMobile = useMediaQuery(theme.breakpoints ? theme.breakpoints.down('sm') : '(max-width:600px)');
  
  // ===== STATE =====
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  
  // Debounced search value
  const debouncedValue = useDebounce(value, debounceMs);
  
  // ===== COMPUTED VALUES =====
  const filteredSuggestions = useMemo(() => {
    const query = value.toLowerCase().trim();
    
    if (!query) {
      // Show history and popular searches when no query
      const historyItems: SearchSuggestion[] = searchHistory.slice(0, 3).map((item, index) => ({
        id: `history-${index}`,
        text: item,
        type: 'history',
      }));
      
      const popularItems: SearchSuggestion[] = popularSearches.slice(0, 5).map((item, index) => ({
        id: `popular-${index}`,
        text: item,
        type: 'popular',
      }));
      
      return [...historyItems, ...popularItems];
    }
    
    // Filter suggestions based on query
    return suggestions
      .filter(suggestion => 
        suggestion.text.toLowerCase().includes(query)
      )
      .slice(0, maxSuggestions);
  }, [value, suggestions, searchHistory, popularSearches, maxSuggestions]);
  
  const showSuggestions = inputFocused && (value.length > 0 || searchHistory.length > 0 || popularSearches.length > 0);
  
  // ===== EVENT HANDLERS =====
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  }, [onChange]);
  
  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setOpen(false);
      setInputFocused(false);
    }
  }, [value, onSearch]);
  
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSearch(suggestion.text);
    onSuggestionSelect?.(suggestion);
    setOpen(false);
    setInputFocused(false);
  }, [onChange, onSearch, onSuggestionSelect]);
  
  const handleClear = useCallback(() => {
    onChange('');
    onClear?.();
    setOpen(false);
  }, [onChange, onClear]);
  
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setInputFocused(true);
    setAnchorEl(event.currentTarget);
    setOpen(true);
  }, []);
  
  const handleBlur = useCallback(() => {
    // Delay to allow suggestion click
    setTimeout(() => {
      setInputFocused(false);
      setOpen(false);
    }, 200);
  }, []);
  
  const handleClickAway = useCallback(() => {
    setOpen(false);
    setInputFocused(false);
  }, []);
  
  // ===== EFFECTS =====
  useEffect(() => {
    // Auto-search on debounced value change
    if (debouncedValue && debouncedValue !== value) {
      // This could trigger API call for suggestions
    }
  }, [debouncedValue, value]);
  
  // ===== RENDER METHODS =====
  const renderSuggestions = () => {
    if (!showSuggestions || filteredSuggestions.length === 0) return null;
    
    const hasHistory = filteredSuggestions.some(s => s.type === 'history');
    const hasPopular = filteredSuggestions.some(s => s.type === 'popular');
    const hasResults = filteredSuggestions.some(s => s.type !== 'history' && s.type !== 'popular');
    
    return (
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          maxHeight: 400,
          overflow: 'auto',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <List dense>
          {/* Search History */}
          {hasHistory && !value && (
            <>
              <ListItem>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Tìm kiếm gần đây
                </Typography>
              </ListItem>
              {filteredSuggestions
                .filter(s => s.type === 'history')
                .map((suggestion) => (
                  <ListItem key={suggestion.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getSuggestionIcon(suggestion.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={highlightText(suggestion.text, value)}
                        primaryTypographyProps={{
                          variant: 'body2',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          // Handle remove from history
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                ))}
              {(hasPopular || hasResults) && <Divider />}
            </>
          )}
          
          {/* Popular Searches */}
          {hasPopular && !value && (
            <>
              <ListItem>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Tìm kiếm phổ biến
                </Typography>
              </ListItem>
              {filteredSuggestions
                .filter(s => s.type === 'popular')
                .map((suggestion) => (
                  <ListItem key={suggestion.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getSuggestionIcon(suggestion.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={suggestion.text}
                        primaryTypographyProps={{
                          variant: 'body2',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              {hasResults && <Divider />}
            </>
          )}
          
          {/* Search Results */}
          {hasResults && (
            <>
              {value && (
                <ListItem>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Gợi ý tìm kiếm
                  </Typography>
                </ListItem>
              )}
              {filteredSuggestions
                .filter(s => s.type !== 'history' && s.type !== 'popular')
                .map((suggestion) => (
                  <ListItem key={suggestion.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getSuggestionIcon(suggestion.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={highlightText(suggestion.text, value)}
                        secondary={suggestion.category}
                        primaryTypographyProps={{
                          variant: 'body2',
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                        }}
                      />
                      {suggestion.count && (
                        <Typography variant="caption" color="text.secondary">
                          {suggestion.count} sản phẩm
                        </Typography>
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
            </>
          )}
        </List>
        
        {/* Show All Results */}
        {value && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                sx={{ justifyContent: 'flex-start' }}
              >
                <SearchIcon sx={{ mr: 1 }} />
                Tìm kiếm "{value}"
              </Button>
            </Box>
          </>
        )}
      </Paper>
    );
  };
  
  // ===== MAIN RENDER =====
  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box className={className} sx={{ position: 'relative', ...sx }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {/* Clear Button */}
                    {value && (
                      <IconButton
                        size="small"
                        onClick={handleClear}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    )}
                    
                    {/* Advanced/voice/QR features intentionally removed to keep search lightweight */}
                  </Box>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 2,
                },
              },
            }}
          />
        </Box>
        
        {/* Suggestions Popper */}
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-start"
          style={{ width: anchorEl?.clientWidth, zIndex: theme.zIndex.modal }}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, 4],
              },
            },
          ]}
        >
          {renderSuggestions()}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default ProductSearch;
