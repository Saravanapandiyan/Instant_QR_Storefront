import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = 'records',
  className = '',
}) => {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t text-xs select-none transition-colors ${className}`}
      style={{
        borderColor: 'var(--adm-border)',
        backgroundColor: 'var(--adm-surface)',
        color: 'var(--adm-muted)',
      }}
    >
      {/* Left: Summary text */}
      <div className="flex items-center gap-2 text-xs">
        <span>
          Showing <strong style={{ color: 'var(--adm-text)' }}>{startItem}</strong> to{' '}
          <strong style={{ color: 'var(--adm-text)' }}>{endItem}</strong> of{' '}
          <strong style={{ color: 'var(--adm-text)' }}>{totalItems}</strong> {itemName}
        </span>

        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-3 pl-3 border-l" style={{ borderColor: 'var(--adm-border)' }}>
            <span className="text-[11px] text-neutral-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-0.5 rounded text-xs border font-medium bg-transparent cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
              style={{
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
                backgroundColor: 'var(--adm-surface-subtle)',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option
                  key={opt}
                  value={opt}
                  style={{ backgroundColor: 'var(--adm-surface)', color: 'var(--adm-text)' }}
                >
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label="First page"
          className="p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800"
          style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800"
          style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-xs text-neutral-400 select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-7 h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'shadow-xs font-bold'
                    : 'border hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--adm-primary)' : 'transparent',
                  color: isActive ? 'var(--adm-primary-contrast)' : 'var(--adm-text)',
                  borderColor: isActive ? 'transparent' : 'var(--adm-border)',
                }}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800"
          style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          aria-label="Last page"
          className="p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800"
          style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
