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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { appName } = useBrandStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
      navigate('/');
    } catch (err: any) {
      setServerError(err.message || 'Invalid email or password. Please try again.');
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
              Sign in to manage your branches, menus, and orders.
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
              label="Email Address"
              type="email"
              placeholder="owner@restaurant.com"
              required
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              error={errors.password?.message}
              labelRightElement={
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </a>
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
    </div>
  );
};
