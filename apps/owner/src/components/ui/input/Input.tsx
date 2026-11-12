import React, { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
  labelRightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      required,
      prefixElement,
      suffixElement,
      labelRightElement,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5 w-full text-left', className)}>
        {(label || labelRightElement) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className="text-xs sm:text-sm font-medium text-text tracking-tight"
              >
                {label}
                {required && <span className="text-danger ml-0.5">*</span>}
              </label>
            )}
            {labelRightElement}
          </div>
        )}

        <div
          className={cn(
            'flex items-center w-full h-[44px] rounded-[8px] transition-colors border bg-surface overflow-hidden',
            error
              ? 'border-danger ring-1 ring-danger'
              : 'border-border hover:border-muted focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25'
          )}
        >
          {prefixElement && (
            <div className="pl-3 pr-1 flex items-center text-muted shrink-0">
              {prefixElement}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className="w-full h-full px-3.5 bg-transparent text-sm text-text placeholder:text-muted/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            {...props}
          />

          {suffixElement && (
            <div className="pr-3 pl-1 flex items-center text-muted shrink-0">
              {suffixElement}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-danger font-medium mt-0.5">
            <AlertCircle size={13} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {hint && !error && (
          <span className="text-xs text-muted mt-0.5">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
