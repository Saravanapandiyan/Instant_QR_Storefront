import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  Lock,
} from 'lucide-react';
import { authApi } from '../../api/authApi.ts';
import { useAdminAuthStore } from '../../store/useAdminAuthStore.ts';
import { useAdminThemeStore } from '../../store/useAdminThemeStore.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAdminAuthStore();
  const { theme, toggleTheme } = useAdminThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please enter both your administrator email and password.', 'Missing Credentials');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.login({
        email: email.trim(),
        password,
      });

      setAuth(res);
      toast.success('Authenticated. Entering Control Plane...', 'Access Granted');
      setTimeout(() => navigate('/'), 400);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.';
      toast.error(message, 'Sign In Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 transition-colors select-none"
      style={{
        backgroundColor: 'var(--adm-bg)',
        color: 'var(--adm-text)',
      }}
    >
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
            style={{
              backgroundColor: 'var(--adm-primary)',
              color: 'var(--adm-primary-contrast)',
            }}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
              Instant QR
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--adm-muted)' }}>
              Control Plane Root
            </p>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 rounded-xl border hover:opacity-100 opacity-80 transition-all cursor-pointer"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
            color: 'var(--adm-text)',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div
          className="rounded-2xl border p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-fade-in"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Header Badging */}
          <div className="mb-6">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider mb-3 border"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-primary)',
              }}
            >
              <Lock className="w-3 h-3" />
              <span>Authorized Personnel Only</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
              Super Admin Sign In
            </h2>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--adm-muted)' }}>
              Enter your platform administrator credentials to access the Instant QR control plane.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--adm-text)' }}>
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@instantqr.io"
                  className="w-full h-10 pl-9 pr-3 rounded-xl text-xs border focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: 'var(--adm-bg)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-text)',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--adm-text)' }}>
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 pl-9 pr-10 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: 'var(--adm-bg)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-text)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ color: 'var(--adm-text)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button (Solid height, no flicker or layout shift) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-60 mt-2 select-none"
              style={{
                backgroundColor: 'var(--adm-primary)',
                color: 'var(--adm-primary-contrast)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Control Plane</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer System Disclaimer */}
      <div className="text-center text-[11px] font-mono" style={{ color: 'var(--adm-muted)' }}>
        Instant QR SaaS Engine • Internal Infrastructure Control Plane
      </div>
    </div>
  );
}
