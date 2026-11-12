import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAdminToastStore, type ToastType } from './useAdminToastStore.ts';

export function AdminToastContainer() {
  const { toasts, removeToast } = useAdminToastStore();

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 shrink-0 text-indigo-500" />;
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-slide-up"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
            color: 'var(--adm-text)',
          }}
        >
          <div className="mt-0.5">{getIcon(t.type)}</div>

          <div className="flex-1 min-w-0">
            {t.title && (
              <h4 className="text-xs font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                {t.title}
              </h4>
            )}
            <p className="text-xs leading-relaxed mt-0.5 break-words" style={{ color: 'var(--adm-muted)' }}>
              {t.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => removeToast(t.id)}
            aria-label="Close notification"
            className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
            style={{ color: 'var(--adm-text)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

