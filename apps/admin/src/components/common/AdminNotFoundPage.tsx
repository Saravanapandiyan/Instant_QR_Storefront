import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { AdminLayout } from '../layout/AdminLayout.tsx';

export function AdminNotFoundPage() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 shadow-inner ring-8 ring-amber-500/5">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-500/10 text-amber-700 dark:text-amber-300 mb-3">
          Error 404
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
          Oops! Page Not Found
        </h1>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed max-w-md">
          The admin route you are trying to access doesn't exist, has been removed, or was entered incorrectly.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 text-white font-semibold text-xs shadow-md hover:bg-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={16} />
            Back to Admin Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
