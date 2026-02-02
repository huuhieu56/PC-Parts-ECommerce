import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchFieldProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  autoSearch?: boolean;
  onClear?: () => void;
  loading?: boolean;
  debounceMs?: number;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  disabled?: boolean;
  clearable?: boolean;
  autoFocus?: boolean;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  placeholder = 'Tìm kiếm...',
  value: externalValue,
  onSearch,
  onClear,
  loading = false,
  debounceMs = 500,
  size = 'medium',
  fullWidth = true,
  variant = 'outlined',
  disabled = false,
  clearable = true,
  autoFocus = false,
  autoSearch = true,
}) => {
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const debouncedSearchTerm = useDebounce(internalValue, debounceMs);

  // Update internal value when external value changes
  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearchTerm !== undefined && autoSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setInternalValue(newValue);
    },
    []
  );

  const handleClear = useCallback(() => {
    setInternalValue('');
    if (onClear) {
      onClear();
    } else {
      onSearch('');
    }
  }, [onClear, onSearch]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onSearch(internalValue);
      }
    },
    [internalValue, onSearch]
  );

  const showClearButton = clearable && internalValue.length > 0 && !loading;
  const showLoadingIcon = loading;

  return (
    <TextField
      value={internalValue}
      onChange={handleInputChange}
      onKeyPress={handleKeyPress}
      placeholder={placeholder}
      size={size}
      fullWidth={fullWidth}
      variant={variant}
      disabled={disabled}
      autoFocus={autoFocus}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {showLoadingIcon ? (
              <CircularProgress size={20} />
            ) : (
              <SearchIcon color="action" />
            )}
          </InputAdornment>
        ),
        endAdornment: showClearButton && (
          <InputAdornment position="end">
            <IconButton
              aria-label="xóa tìm kiếm"
              onClick={handleClear}
              edge="end"
              size="small"
            >
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
          },
        },
      }}
    />
  );
};

export default SearchField;
