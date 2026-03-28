"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  size?: number;
}

/**
 * Reusable pagination component.
 * Works with PageResponse from backend.
 *
 * Usage:
 * ```tsx
 * <Pagination
 *   page={pageData.page}
 *   totalPages={pageData.totalPages}
 *   totalElements={pageData.totalElements}
 *   hasNext={pageData.hasNext}
 *   hasPrevious={pageData.hasPrevious}
 *   onPageChange={(p) => setCurrentPage(p)}
 * />
 * ```
 */
export default function Pagination({ page, totalPages, totalElements, hasNext, hasPrevious, onPageChange, size }: PaginationProps) {
  if (totalElements === 0) return null;

  // Generate visible page numbers (show max 5 around current)
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const from = page * (size || 10) + 1;
  const to = Math.min((page + 1) * (size || 10), totalElements);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <p className="text-sm text-gray-500">
        Hiển thị <span className="font-medium text-gray-900">{from}</span>–<span className="font-medium text-gray-900">{to}</span> trong <span className="font-medium text-gray-900">{totalElements}</span> kết quả
      </p>
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(0)}
          disabled={!hasPrevious}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevious}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {/* Page numbers */}
        {pageNumbers[0] > 0 && <span className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>}
        {pageNumbers.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
              p === page
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {p + 1}
          </button>
        ))}
        {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>}
        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!hasNext}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
