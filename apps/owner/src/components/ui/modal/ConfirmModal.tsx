import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../button/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-backdrop backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-surface rounded-[12px] border border-border shadow-xl overflow-hidden z-10 p-5 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-danger/10 text-danger border border-danger/20'
                  : 'bg-primary-soft text-primary-soft-text border border-primary/20'
              }`}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {!isLoading && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-[6px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
