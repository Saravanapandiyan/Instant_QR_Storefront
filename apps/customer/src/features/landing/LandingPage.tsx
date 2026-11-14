import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Sparkles, UtensilsCrossed, ArrowRight, ShieldCheck, Zap, Compass, Download } from 'lucide-react';
import { QRScannerModal } from './QRScannerModal.tsx';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';

export function LandingPage() {
  const navigate = useNavigate();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { isInstallable, installApp } = usePWAInstall();

  // Demo branches from existing database
  const demoBranches = [
    {
      name: 'Theppakulam Branch',
      restaurantName: 'Ananda Non veg',
      cuisine: 'Authentic South Indian Non-Veg Cuisine',
      location: 'Thappakulam, Madurai',
      slug: 'ananda-non-veg-theppakulam',
      badge: 'Live Demo',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-zinc-50 text-zinc-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shadow-orange-500/20 border border-zinc-200/80 shrink-0 bg-white">
            <img
              src="/icons/pwa-192x192.png"
              alt="Instant QR"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-zinc-900 block leading-none">
              Instant QR
            </span>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
              Digital Storefront
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={installApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
              title="Install Storefront as PWA on your home screen"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <button
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR</span>
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 max-w-xl mx-auto px-6 py-8 w-full flex flex-col justify-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 text-orange-700 text-xs font-medium self-start mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Contactless Dining & Instant Ordering</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 mb-3 leading-tight">
          Scan the QR on your table to browse & order
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 mb-6 leading-relaxed">
          No app download required. View real-time dishes, dietary preferences, branch pricing, and place your order directly to the kitchen.
        </p>

        {/* Big Action: Scan Storefront QR */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-lg shadow-orange-500/5 mb-8">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 mb-3 cursor-pointer"
          >
            <QrCode className="w-5 h-5" />
            <span>Open Camera & Scan QR Code</span>
          </button>
          <p className="text-[11px] text-center text-zinc-400">
            Allow camera access when prompted to scan any table or storefront QR
          </p>
        </div>

        {/* Demo Quick Launch */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-orange-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Or Explore Demo Branch Directly
            </h2>
          </div>

          <div className="space-y-2.5">
            {demoBranches.map((branch) => (
              <div
                key={branch.slug}
                onClick={() => navigate(`/r/${branch.slug}`)}
                className="group p-4 rounded-xl bg-white border border-zinc-200/90 hover:border-orange-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-zinc-900 group-hover:text-orange-600 transition-colors">
                      {branch.restaurantName}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {branch.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {branch.name} • {branch.location}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center text-zinc-500 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-3 gap-3 text-center border-t border-zinc-200/80 pt-6">
          <div className="p-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-1.5">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-800">Instant Load</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">High-speed PWA</p>
          </div>
          <div className="p-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-800">Live Stock</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Real-time status</p>
          </div>
          <div className="p-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-1.5">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-800">Direct Kitchen</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Immediate order</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-zinc-200/60 text-center text-xs text-zinc-400">
        © 2026 Instant QR Storefront • Powered by Antigravity
      </footer>

      {/* QR Scanner Camera Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}

