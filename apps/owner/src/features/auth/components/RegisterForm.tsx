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
import { ROUTES } from '../../../constants/routes';

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91 (India)' },
  { code: '+1', label: '🇺🇸 +1 (US / Canada)' },
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+971', label: '🇦🇪 +971 (UAE)' },
  { code: '+65', label: '🇸🇬 +65 (Singapore)' },
  { code: '+61', label: '🇦🇺 +61 (Australia)' },
  { code: '+49', label: '🇩🇪 +49 (Germany)' },
  { code: '+33', label: '🇫🇷 +33 (France)' },
];

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  countryCode: z.string().optional(),
  phone: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { appName } = useBrandStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      countryCode: '+91',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        countryCode: data.countryCode || undefined,
        phone: data.phone || undefined,
      });
      setAuth(response);
      navigate(ROUTES.QUICK_SETUP);
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please try again.');
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
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 relative bg-bg min-h-screen overflow-y-auto">
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
        <div className="w-full max-w-[400px] mx-auto my-auto py-6">
          <div className="mb-6">
            <h1 className="text-[28px] font-semibold text-text tracking-tight">
              Create an owner account
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Start managing your restaurant branches and digital storefronts.
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
              label="Full Name"
              placeholder="e.g. Mario Rossi"
              required
              autoComplete="name"
              error={errors.name?.message}
              {...register('name')}
            />

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
              placeholder="Minimum 6 characters"
              required
              autoComplete="new-password"
              error={errors.password?.message}
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

            {/* Phone with Country Code Selector */}
            <div className="flex flex-col gap-1.5 w-full text-left">
              <label className="text-xs sm:text-sm font-medium text-text tracking-tight">
                Phone Number (Optional)
              </label>
              <div className="flex items-center gap-2">
                <select
                  {...register('countryCode')}
                  className="h-[44px] px-2.5 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <div className="flex-1">
                  <Input
                    placeholder="9876543210"
                    type="tel"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>
              </div>
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
              >
                Create account
              </Button>
            </div>
          </form>

          {/* Navigation to Sign In */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs sm:text-sm text-muted">
              Already have an owner account?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
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
