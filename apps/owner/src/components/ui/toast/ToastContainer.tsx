import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type ToastType } from './useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-success shrink-0" />;
      case 'error':
        return <AlertCircle size={18} className="text-danger shrink-0" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-warning shrink-0" />;
      default:
        return <Info size={18} className="text-primary shrink-0" />;
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:bottom-5 sm:right-5 z-[100] flex flex-col gap-2.5 sm:max-w-sm sm:w-full pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-[10px] bg-surface border border-border shadow-lg transition-all transform duration-200 ease-out animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="mt-0.5">{getIcon(t.type)}</div>

          <div className="flex-1 min-w-0">
            {t.title && (
              <h4 className="text-xs font-semibold text-text tracking-tight">
                {t.title}
              </h4>
            )}
            <p className="text-xs text-muted leading-relaxed mt-0.5 break-words">
              {t.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => removeToast(t.id)}
            aria-label="Close notification"
            className="p-1 rounded-[4px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
