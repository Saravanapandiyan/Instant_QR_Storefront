import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { Button, Input, AppLogo, ThemeToggle } from '../../../components/ui';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../store/useAuthStore';
import { useBrandStore } from '../../../store/useBrandStore';
import { useActiveStore } from '../../../store/useActiveStore';
import { cn } from '../../../lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email or mobile number'),
  password: z.string().min(1, 'Password or 4-digit PIN is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { appName, supportEmail } = useBrandStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      const response = await authApi.login(data);
      setAuth(response);

      // If logging in as staff, ensure active restaurant is set to their assigned restaurant
      if (response.user?.role === 'STAFF' && response.user.staffProfiles?.length) {
        const staffRestId = response.user.staffProfiles[0].restaurantId;
        if (staffRestId) {
          useActiveStore.getState().setActiveRestaurantId(staffRestId);
        }
      }

      navigate('/');
    } catch (err: any) {
      setServerError(err.message || 'Invalid email, mobile number, or password / PIN.');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-bg text-text transition-colors">
      {/* LEFT PANEL: Solid primary background on desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-primary text-on-primary overflow-hidden">
        {/* Large faint QR decoration (~12% opacity) */}
        <div
          className="absolute -bottom-16 -right-16 text-on-primary pointer-events-none select-none opacity-12"
          aria-hidden="true"
        >
          <QrCode size={380} strokeWidth={1.2} />
        </div>

        {/* Top: Logo with on-primary text */}
        <div className="relative z-10">
          <AppLogo size="md" whiteLogo />
        </div>

        {/* Center: Large heading and benefit bullets */}
        <div className="relative z-10 max-w-md space-y-6">
          <h2 className="font-hero text-[40px] font-bold leading-tight tracking-tight text-on-primary">
            Turn every table into a storefront.
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-soft text-primary-soft-text shrink-0 mt-2" />
              <span className="text-sm sm:text-base text-on-primary/90 leading-relaxed">
                Contactless QR menus for every branch
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-soft text-primary-soft-text shrink-0 mt-2" />
              <span className="text-sm sm:text-base text-on-primary/90 leading-relaxed">
                Live orders straight to your kitchen
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-soft text-primary-soft-text shrink-0 mt-2" />
              <span className="text-sm sm:text-base text-on-primary/90 leading-relaxed">
                Payments that go directly to you
              </span>
            </div>
          </div>
        </div>

        {/* Small footer line */}
        <div className="relative z-10 text-xs text-on-primary/75">
          © {new Date().getFullYear()} {appName}. Multi-restaurant storefront platform.
        </div>
      </div>

      {/* RIGHT PANEL: bg color, max-width 400px form, vertically centered */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 relative bg-bg min-h-screen">
        {/* Top bar with mobile logo & theme toggle */}
        <div className="flex items-center justify-between w-full">
          <div className="lg:hidden">
            <AppLogo size="md" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Centered Form Area (max-width 400px) */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-8">
          <div className="mb-6">
            <h1 className="text-[28px] font-semibold text-text tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Sign in to manage your restaurant, branches, menus, and orders.
            </p>
          </div>

          {/* Error Banner */}
          {serverError && (
            <div className="mb-4 p-3 rounded-[8px] bg-danger/10 border border-danger/25 text-danger text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email or Mobile Number"
              type="text"
              placeholder="e.g. name@restaurant.com or 9876543210"
              required
              autoComplete="username"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password or 4-Digit PIN"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password or 4-digit PIN"
              required
              autoComplete="current-password"
              error={errors.password?.message}
              labelRightElement={
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              }
              suffixElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-muted hover:text-text transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password')}
            />

            <p className="text-[11px] text-muted -mt-2 leading-relaxed">
              💡 You can sign in using your account password or your 4-digit POS / Kitchen PIN.
            </p>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
              >
                Sign in
              </Button>
            </div>
          </form>

          {/* Navigation to Create Account */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs sm:text-sm text-muted">
              New to {appName}?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary hover:underline"
              >
                Create an owner account
              </Link>
            </p>
          </div>

          {/* Secured with JWT authentication line */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck size={13} />
            <span>Secured with JWT authentication</span>
          </div>
        </div>

        {/* Mobile footer line */}
        <div className="text-center text-xs text-muted lg:hidden">
          © {new Date().getFullYear()} {appName}
        </div>
      </div>

      {/* Forgot Password -> Contact Admin Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface border border-border shadow-2xl p-6 space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">Forgot Password?</h3>
                <p className="text-xs text-muted">Account &amp; PIN recovery</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-text leading-relaxed">
              Please <strong>contact your platform administrator</strong> to reset your account password or 4-digit staff PIN.
            </p>

            {supportEmail && (
              <div className="p-3 rounded-xl bg-surface-2 border border-border text-xs">
                <span className="text-muted block text-[11px] mb-0.5">Admin Support Email:</span>
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-semibold text-primary hover:underline break-all"
                >
                  {supportEmail}
                </a>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setShowForgotModal(false)}
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
