import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface AdminDatePickerProps {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  ariaLabel?: string;
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

export const AdminDatePicker: React.FC<AdminDatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  ariaLabel,
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
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel || placeholder}
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
        style={{
          borderColor: 'var(--adm-border)',
          color: 'var(--adm-text)',
          backgroundColor: 'var(--adm-surface)',
        }}
      >
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className={formattedDisplay ? '' : 'text-neutral-400'}>
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
            className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed rounded-xl border shadow-xl p-3.5 z-[9999] text-xs select-none"
            style={{
              top: coords.top,
              left: coords.left,
              width: 'min(18rem, calc(100vw - 24px))',
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                style={{ borderColor: 'var(--adm-border)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-xs">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                style={{ borderColor: 'var(--adm-border)' }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="text-[10px] font-bold uppercase text-neutral-400 py-1">
                  {wd}
                </span>
              ))}
            </div>

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
                    className={`h-8 w-full rounded-md text-xs font-medium flex items-center justify-center transition-colors ${
                      disabled
                        ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                        : isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold cursor-pointer'
                        : isToday
                        ? 'ring-1 ring-neutral-400 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
                        : cell.inCurrentMonth
                        ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
                        : 'text-neutral-400/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            <div
              className="flex items-center justify-between pt-2.5 mt-2.5 border-t"
              style={{ borderColor: 'var(--adm-border)' }}
            >
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="px-2 py-1 rounded text-[11px] font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
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
                className="px-2.5 py-1 rounded text-[11px] font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
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
