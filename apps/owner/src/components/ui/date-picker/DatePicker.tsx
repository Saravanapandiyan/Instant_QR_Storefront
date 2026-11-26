import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DatePickerProps {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  align?: 'left' | 'right';
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYMD(ymd: string): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const POPOVER_WIDTH = 288; // w-72
const POPOVER_HEIGHT_EST = 330;

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  ariaLabel,
  className = '',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseYMD(value), [value]);
  const todayYMD = useMemo(() => toYMD(new Date()), []);

  const [viewYear, setViewYear] = useState<number>(() => (selectedDate || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => (selectedDate || new Date()).getMonth());

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(POPOVER_WIDTH, vw - 24);

    let left = align === 'right' ? rect.right - width : rect.left;
    left = Math.max(12, Math.min(left, vw - width - 12));

    let top = rect.bottom + 8;
    if (top + POPOVER_HEIGHT_EST > vh - 12 && rect.top - POPOVER_HEIGHT_EST - 8 >= 12) {
      top = rect.top - POPOVER_HEIGHT_EST - 8;
    }

    setCoords({ top, left });
  }, [align]);

  useEffect(() => {
    if (isOpen) {
      const target = selectedDate || new Date();
      setViewYear(target.getFullYear());
      setViewMonth(target.getMonth());
      updatePosition();
    }
  }, [isOpen, selectedDate, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleScrollOrResize = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { ymd: string; day: number; inCurrentMonth: boolean }[] = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateObj = new Date(viewYear, viewMonth - 1, d);
      cells.push({ ymd: toYMD(dateObj), day: d, inCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      cells.push({ ymd: toYMD(dateObj), day: d, inCurrentMonth: true });
    }

    const totalCells = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalCells) {
      const dateObj = new Date(viewYear, viewMonth + 1, nextDay);
      cells.push({ ymd: toYMD(dateObj), day: nextDay, inCurrentMonth: false });
      nextDay++;
    }

    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDisabled = (ymd: string) => {
    if (min && ymd < min) return true;
    if (max && ymd > max) return true;
    return false;
  };

  const formattedDisplay = selectedDate
    ? selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel || placeholder}
        onClick={() => setIsOpen((o) => !o)}
        className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap bg-surface-2 ${
          isOpen
            ? 'border-primary ring-2 ring-primary/15 text-text'
            : 'border-border hover:border-primary/40 text-text'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className={formattedDisplay ? 'text-text' : 'text-muted font-medium'}>
            {formattedDisplay || placeholder}
          </span>
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setIsOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onChange('');
                setIsOpen(false);
              }
            }}
            className="p-0.5 rounded-md text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: coords.top, left: coords.left, width: 'min(18rem, calc(100vw - 24px))' }}
            className="fixed rounded-2xl bg-surface border border-border shadow-xl p-3.5 z-[9999] text-xs select-none"
          >
            {/* Month / Year Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-7 h-7 rounded-lg border border-border bg-surface-2 text-text hover:border-primary/40 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-text text-xs">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-7 h-7 rounded-lg border border-border bg-surface-2 text-text hover:border-primary/40 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="text-[10px] font-bold uppercase text-muted py-1">
                  {wd}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((cell) => {
                const disabled = isDisabled(cell.ymd);
                const isSelected = value === cell.ymd;
                const isToday = cell.ymd === todayYMD;

                return (
                  <button
                    key={cell.ymd}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(cell.ymd);
                      setIsOpen(false);
                    }}
                    className={`h-8 w-full rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                      disabled
                        ? 'text-muted/25 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary text-on-primary font-bold shadow-xs cursor-pointer'
                        : isToday
                        ? 'bg-primary/10 text-primary font-bold ring-1 ring-primary/30 hover:bg-primary/20 cursor-pointer'
                        : cell.inCurrentMonth
                        ? 'text-text hover:bg-surface-2 cursor-pointer'
                        : 'text-muted/45 hover:bg-surface-2 cursor-pointer'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={isDisabled(todayYMD)}
                onClick={() => {
                  onChange(todayYMD);
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
