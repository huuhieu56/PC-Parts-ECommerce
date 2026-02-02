import React, { useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  Typography,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { TableColumn } from '../../types/common.types';

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  page?: number;
  rowsPerPage?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  sortColumn?: keyof T;
  sortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
  showPagination?: boolean;
  stickyHeader?: boolean;
  size?: 'small' | 'medium';
  rowsPerPageOptions?: number[];
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  page = 0,
  rowsPerPage = 10,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  onSort,
  sortColumn,
  sortDirection,
  emptyMessage = 'Không có dữ liệu',
  showPagination = true,
  stickyHeader = false,
  size = 'medium',
  rowsPerPageOptions = [5, 10, 25, 50],
}: DataTableProps<T>) => {
  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    onPageChange?.(newPage);
  }, [onPageChange]);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    onRowsPerPageChange?.(newRowsPerPage);
  }, [onRowsPerPageChange]);

  const handleSort = useCallback((column: keyof T) => {
    if (!onSort) return;

    const isCurrentColumn = sortColumn === column;
    const newDirection = isCurrentColumn && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column, newDirection);
  }, [onSort, sortColumn, sortDirection]);

  const renderSortIcon = useCallback((column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return null;

    const isCurrentColumn = sortColumn === column.key;
  const icon = isCurrentColumn && sortDirection === 'desc' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />;
    
    return (
      <Tooltip title="Sắp xếp">
        <IconButton
          size="small"
          onClick={() => handleSort(column.key)}
          sx={{ 
            ml: 1,
            opacity: isCurrentColumn ? 1 : 0.5,
            '&:hover': { opacity: 1 }
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>
    );
  }, [sortColumn, sortDirection, onSort, handleSort]);

  const skeletonRows = useMemo(() => {
    return Array.from({ length: rowsPerPage }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {columns.map((column) => (
          <TableCell key={String(column.key)}>
            <Skeleton variant="text" />
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [rowsPerPage, columns]);

  const renderSkeletonRows = () => skeletonRows;

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </TableCell>
    </TableRow>
  );

  const renderDataRows = () => {
    if (loading) return renderSkeletonRows();
    if (data.length === 0) return renderEmptyState();

    return data.map((item, index) => (
      <TableRow key={item.id || index} hover>
        {columns.map((column) => (
          <TableCell
            key={String(column.key)}
            align={column.align || 'left'}
            sx={{ width: column.width }}
          >
            {column.render ? column.render(item[column.key], item) : item[column.key]}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <Box>
      <TableContainer component={Paper} elevation={1}>
        <Table size={size} stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.key)}
                  align={column.align || 'left'}
                  sx={{ 
                    width: column.width,
                    fontWeight: 600,
                    backgroundColor: 'grey.50'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {column.label}
                    {renderSortIcon(column)}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {renderDataRows()}
          </TableBody>
        </Table>
      </TableContainer>

      {showPagination && (
        <TablePagination
          component="div"
          count={totalRows ?? data.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} trong ${count !== -1 ? count : `hơn ${to}`}`
          }
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      )}
    </Box>
  );
};

export default DataTable;
