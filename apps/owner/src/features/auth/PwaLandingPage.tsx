import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  Smartphone,
  QrCode,
  ArrowRight,
  Share,
  CheckCircle2,
  LogIn,
  MoreVertical,
} from 'lucide-react';
import { Button, AppLogo, ThemeToggle, toast } from '../../components/ui';
import { useBrandStore } from '../../store/useBrandStore';
import { usePwaInstall } from '../../lib/pwa';
import { ROUTES } from '../../constants/routes';

export const PwaLandingPage: React.FC = () => {
  const { appName } = useBrandStore();
  const { canInstall, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const [searchParams] = useSearchParams();
  const isInstallScan = searchParams.get('install') === '1';

  const installUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/owner/?install=1` : '/owner/?install=1';

  const handleInstallClick = async () => {
    const accepted = await triggerInstall();
    if (accepted) {
      toast.success(`${appName} app installed! Open it from your home screen or apps menu.`);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-bg text-text transition-colors">
      {/* LEFT PANEL: Solid primary background on desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-primary text-on-primary overflow-hidden">
        <div
          className="absolute -bottom-16 -right-16 text-on-primary pointer-events-none select-none opacity-12"
          aria-hidden="true"
        >
          <QrCode size={380} strokeWidth={1.2} />
        </div>

        <div className="relative z-10">
          <AppLogo size="md" whiteLogo />
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h2 className="font-hero text-[40px] font-bold leading-tight tracking-tight text-on-primary">
            Turn every table into a storefront.
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-soft text-primary-soft-text shrink-0 mt-2" />
              <span className="text-sm sm:text-base text-on-primary/90 leading-relaxed">
                Install as a fast app on your counter tablet or phone
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-soft text-primary-soft-text shrink-0 mt-2" />
              <span className="text-sm sm:text-base text-on-primary/90 leading-relaxed">
                Live orders, Kitchen Display (KDS) &amp; TV order board
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-soft text-primary-soft-text shrink-0 mt-2" />
              <span className="text-sm sm:text-base text-on-primary/90 leading-relaxed">
                Instant audio alerts and daily revenue reports
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-on-primary/75">
          © {new Date().getFullYear()} {appName}. Multi-restaurant storefront platform.
        </div>
      </div>

      {/* RIGHT PANEL: Sleek QR App Download Card (or Direct Install View when opened from QR scan) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 relative bg-bg min-h-screen">
        <div className="flex items-center justify-between w-full">
          <div className="lg:hidden">
            <AppLogo size="md" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="w-full max-w-[420px] mx-auto my-auto py-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Restaurant Console App</span>
            </div>
            <h1 className="text-[26px] sm:text-[30px] font-bold text-text tracking-tight leading-tight">
              {isInstallScan ? `Install ${appName} App` : `Get the ${appName} App`}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto leading-relaxed">
              {isInstallScan
                ? `Add ${appName} to your home screen, then open the app to sign in.`
                : 'Scan with your phone or tablet camera to install the app and sign in to your restaurant console.'}
            </p>
          </div>

          {isInstallScan ? (
            /* Focused Mobile/Scanned Install Card (no redundant QR code) */
            <div className="p-6 rounded-3xl bg-gradient-to-b from-primary/[0.06] via-surface to-surface border border-border shadow-md flex flex-col items-center text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <Download className="w-8 h-8" />
              </div>

              {isInstalled ? (
                <div className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>App is already installed! Open it from your home screen.</span>
                </div>
              ) : canInstall ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleInstallClick}
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Install {appName} App Now</span>
                </Button>
              ) : isIos ? (
                <div className="w-full p-4 rounded-2xl bg-surface-2 border border-border text-xs text-text space-y-2 text-left">
                  <p className="font-bold flex items-center gap-2">
                    <Share className="w-4 h-4 text-primary shrink-0" />
                    <span>Install on iPhone / iPad (Safari):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-muted">
                    <li>Tap the <strong className="text-text">Share</strong> icon at the bottom of Safari.</li>
                    <li>Scroll down and tap <strong className="text-text">Add to Home Screen</strong>.</li>
                    <li>Open <strong className="text-text">{appName}</strong> from your home screen to sign in.</li>
                  </ol>
                </div>
              ) : (
                <div className="w-full p-4 rounded-2xl bg-surface-2 border border-border text-xs text-text space-y-2 text-left">
                  <p className="font-bold flex items-center gap-2">
                    <MoreVertical className="w-4 h-4 text-primary shrink-0" />
                    <span>Install on Android / Chrome:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-muted">
                    <li>Tap the browser menu (<strong className="text-text">⋮</strong>) in the top corner.</li>
                    <li>Tap <strong className="text-text">Install app</strong> or <strong className="text-text">Add to Home screen</strong>.</li>
                    <li>Open <strong className="text-text">{appName}</strong> from your home screen to sign in.</li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            /* Desktop / Default QR Card */
            <div className="p-6 rounded-3xl bg-gradient-to-b from-primary/[0.04] via-surface to-surface border border-border shadow-md flex flex-col items-center text-center space-y-5">
              {/* QR Frame */}
              <div className="relative p-4 rounded-2xl bg-white border border-border/70 shadow-sm">
                <QRCodeSVG
                  value={installUrl}
                  size={188}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* 3-Step Visual Flow */}
              <div className="w-full grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-text leading-tight">
                    1. Scan QR
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-text leading-tight">
                    2. Install App
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-text leading-tight">
                    3. Sign In
                  </span>
                </div>
              </div>

              {/* Install Action or Browser Hint */}
              <div className="w-full pt-2 border-t border-border/60">
                {isInstalled ? (
                  <div className="py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>App is installed on this device</span>
                  </div>
                ) : canInstall ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleInstallClick}
                    className="flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install {appName} App</span>
                  </Button>
                ) : isIos ? (
                  <div className="py-2.5 px-3 rounded-xl bg-surface-2 border border-border text-[11px] text-muted flex items-center justify-center gap-2">
                    <Share className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      Tap <strong className="text-text">Share</strong> → <strong className="text-text">Add to Home Screen</strong>
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted leading-relaxed">
                    Using a browser? Use the <strong className="text-text">Install</strong> icon in your address bar to add this app.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Web Login Option */}
          <div className="text-center">
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              <span>Continue to Web Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-muted lg:hidden">
          © {new Date().getFullYear()} {appName}
        </div>
      </div>
    </div>
  );
};
