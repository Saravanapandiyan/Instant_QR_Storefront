import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  Store,
  Layers,
  Palette,
  Layout,
  Eye,
  FileDown,
  Coffee,
  UtensilsCrossed,
  Pizza,
  Wine,
} from 'lucide-react';
import { Button, toast } from '../../../components/ui';
import { getCustomerStorefrontUrl } from '../../../lib/urls';
import { getMediaUrl } from '../../../lib/utils';
import {
  StylizedQRCode,
  type QRDotPattern,
  type QREyePattern,
  type QRShape,
} from './StylizedQRCode';
import type { Branch, Restaurant } from '@instant-qr/shared-types';

export interface InstagramQRModalProps {
  branch: Branch | null;
  restaurant?: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
}

// 4 Professional Restaurant Stand Layouts
export type StandTemplate = 'brand' | 'acrylic' | 'luxury' | 'badge';

// Appetizing Culinary Color Themes
export type ColorTheme =
  | 'terracotta'
  | 'crimson'
  | 'emerald'
  | 'slate'
  | 'navy'
  | 'mono';

// Center Emblem Options
export type CenterIconType = 'logo' | 'cutlery' | 'coffee' | 'pizza' | 'bar' | 'none';

interface ThemeConfig {
  name: string;
  bgGradient: string;
  cardBg: string;
  primaryColor: string;
  secondaryColor: string;
  qrGradient: {
    color1: string;
    color2: string;
  };
  accentPill: string;
  borderGlow: string;
}

const THEME_CONFIGS: Record<ColorTheme, ThemeConfig> = {
  terracotta: {
    name: 'Warm Flame',
    bgGradient: 'from-amber-600 via-orange-600 to-rose-700',
    cardBg: 'bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700',
    primaryColor: '#ea580c',
    secondaryColor: '#c2410c',
    qrGradient: { color1: '#ea580c', color2: '#e11d48' },
    accentPill: 'bg-white/20 text-white backdrop-blur-md border border-white/30',
    borderGlow: 'shadow-[0_20px_50px_rgba(234,88,12,0.35)]',
  },
  crimson: {
    name: 'Ruby Crimson',
    bgGradient: 'from-red-600 via-rose-600 to-red-800',
    cardBg: 'bg-gradient-to-br from-red-600 via-rose-600 to-red-800',
    primaryColor: '#dc2626',
    secondaryColor: '#991b1b',
    qrGradient: { color1: '#dc2626', color2: '#be123c' },
    accentPill: 'bg-white/20 text-white backdrop-blur-md border border-white/30',
    borderGlow: 'shadow-[0_20px_50px_rgba(220,38,38,0.35)]',
  },
  emerald: {
    name: 'Fresh Mint & Basil',
    bgGradient: 'from-emerald-600 via-teal-700 to-emerald-900',
    cardBg: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900',
    primaryColor: '#059669',
    secondaryColor: '#047857',
    qrGradient: { color1: '#059669', color2: '#0d9488' },
    accentPill: 'bg-white/20 text-white backdrop-blur-md border border-white/30',
    borderGlow: 'shadow-[0_20px_50px_rgba(5,150,105,0.35)]',
  },
  slate: {
    name: 'Obsidian & Gold',
    bgGradient: 'from-zinc-950 via-stone-900 to-black',
    cardBg: 'bg-gradient-to-br from-zinc-950 via-stone-900 to-black',
    primaryColor: '#d97706',
    secondaryColor: '#b45309',
    qrGradient: { color1: '#d97706', color2: '#92400e' },
    accentPill: 'bg-amber-400/20 text-amber-300 backdrop-blur-md border border-amber-400/30',
    borderGlow: 'shadow-[0_20px_50px_rgba(217,119,6,0.3)]',
  },
  navy: {
    name: 'Royal Sapphire',
    bgGradient: 'from-blue-700 via-indigo-800 to-slate-950',
    cardBg: 'bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    qrGradient: { color1: '#2563eb', color2: '#3730a3' },
    accentPill: 'bg-white/20 text-white backdrop-blur-md border border-white/30',
    borderGlow: 'shadow-[0_20px_50px_rgba(37,99,235,0.35)]',
  },
  mono: {
    name: 'Charcoal & White',
    bgGradient: 'from-zinc-900 to-black',
    cardBg: 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-black',
    primaryColor: '#18181b',
    secondaryColor: '#27272a',
    qrGradient: { color1: '#18181b', color2: '#27272a' },
    accentPill: 'bg-white/15 text-white backdrop-blur-md border border-white/20',
    borderGlow: 'shadow-[0_20px_50px_rgba(24,24,27,0.3)]',
  },
};

export const InstagramQRModal: React.FC<InstagramQRModalProps> = ({
  branch,
  restaurant,
  isOpen,
  onClose,
}) => {
  // Customization state
  const [template, setTemplate] = useState<StandTemplate>('brand');
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>('terracotta');
  const [dotPattern, setDotPattern] = useState<QRDotPattern>('dots');
  const [eyePattern, setEyePattern] = useState<QREyePattern>('squircle');
  const [shape, setShape] = useState<QRShape>('square');
  const [centerIcon, setCenterIcon] = useState<CenterIconType>('logo');

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Reference directly to our live SVG element
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!isOpen || !branch) {
    return null;
  }

  const currentTheme = THEME_CONFIGS[selectedTheme];
  const restaurantName = restaurant?.name || branch.restaurant?.name || 'Restaurant';
  const logoUrl = getMediaUrl(restaurant?.logoUrl || branch.restaurant?.logoUrl);
  const customerUrl = getCustomerStorefrontUrl(branch.slug);

  // Convert the rendered SVG element into an HTMLImageElement at high resolution
  const renderSvgToImage = async (sizePx: number): Promise<HTMLImageElement> => {
    if (!svgRef.current) throw new Error('QR SVG not ready');
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width', String(sizePx));
    clone.setAttribute('height', String(sizePx));
    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.src = url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    URL.revokeObjectURL(url);
    return img;
  };

  // Draw the center circular badge (logo or emoji) onto a 2D canvas
  const drawCenterEmblemOnCanvas = async (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number
  ) => {
    if (centerIcon === 'none') return;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = currentTheme.primaryColor;
    ctx.lineWidth = Math.max(3, size * 0.035);
    ctx.stroke();

    if (centerIcon === 'logo' && logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = logoUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        if (img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2 - 6, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, cx - (size - 14) / 2, cy - (size - 14) / 2, size - 14, size - 14);
          ctx.restore();
          return;
        }
      } catch {
        // Fallback to emoji
      }
    }

    const emoji =
      centerIcon === 'coffee'
        ? '☕'
        : centerIcon === 'pizza'
        ? '🍕'
        : centerIcon === 'bar'
        ? '🍸'
        : '🍽️';
    ctx.font = `${Math.round(size * 0.44)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, cx, cy + 4);
  };

  // Copy customer URL
  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerUrl);
    setIsCopied(true);
    toast.success('Storefront link copied to clipboard!', 'Link Copied');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download Pure QR Vector (.SVG)
  const handleDownloadPureSvg = () => {
    if (!svgRef.current) return;
    try {
      const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('width', '800');
      clone.setAttribute('height', '800');
      const svgString = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${branch.slug}-storefront-qr.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Vector SVG downloaded successfully!');
    } catch {
      toast.error('Could not download SVG');
    }
  };

  // Download Pure QR Image (.PNG)
  const handleDownloadPurePng = async () => {
    try {
      const size = 1000;
      const qrImg = await renderSvgToImage(size);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas error');

      ctx.drawImage(qrImg, 0, 0, size, size);
      await drawCenterEmblemOnCanvas(ctx, size / 2, size / 2, 210);

      const link = document.createElement('a');
      link.download = `${branch.slug}-storefront-qr.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('High-res QR image downloaded!');
    } catch {
      toast.error('Could not download PNG');
    }
  };

  // Download complete 300 DPI ready-to-print Table Stand Card (PNG)
  const handleDownloadStand = async () => {
    setIsDownloading(true);
    try {
      const qrImg = await renderSvgToImage(600);

      const width = 1200;
      const height = 1600;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize 2D context');

      const drawRoundRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) => {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
      };

      if (template === 'luxury') {
        // --- LUXURY FINE DINING STAND ---
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        drawRoundRect(50, 50, width - 100, height - 100, 32);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
        ctx.lineWidth = 2;
        drawRoundRect(66, 66, width - 132, height - 132, 24);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = '28px serif';
        ctx.fillText('✦', 80, 105);
        ctx.fillText('✦', width - 95, 105);
        ctx.fillText('✦', 80, height - 85);
        ctx.fillText('✦', width - 95, height - 85);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef3c7';
        ctx.font = 'italic 34px "Times New Roman", Georgia, serif';
        ctx.fillText('Carte du Jour  •  Digital Dining', width / 2, 230);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px "Times New Roman", Georgia, serif';
        ctx.fillText(restaurantName, width / 2, 320);

        ctx.fillStyle = 'rgba(254, 243, 199, 0.8)';
        ctx.font = '28px "Times New Roman", Georgia, serif';
        ctx.fillText(branch.address || branch.name, width / 2, 380);

        drawRoundRect(width / 2 - 340, 460, 680, 680, 36);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.drawImage(qrImg, width / 2 - 300, 500, 600, 600);
        await drawCenterEmblemOnCanvas(ctx, width / 2, 800, 130);

        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 42px "Times New Roman", Georgia, serif';
        ctx.fillText('Scan to View Menu & Order', width / 2, 1260);

        ctx.fillStyle = 'rgba(254, 243, 199, 0.75)';
        ctx.font = '28px "Times New Roman", Georgia, serif';
        ctx.fillText('Point your phone camera directly at the code', width / 2, 1315);

        ctx.fillStyle = 'rgba(217, 119, 6, 0.9)';
        ctx.font = 'bold 26px monospace';
        ctx.fillText(customerUrl, width / 2, 1420);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '22px sans-serif';
        ctx.fillText('OrdZo Storefront', width / 2, 1510);
      } else if (template === 'acrylic') {
        // --- MODERN TABLETOP TENT ---
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        const topGrad = ctx.createLinearGradient(0, 0, width, 320);
        topGrad.addColorStop(0, currentTheme.primaryColor);
        topGrad.addColorStop(1, currentTheme.secondaryColor);
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, 300);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('DINE-IN ORDERING', width / 2, 110);

        ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(restaurantName, width / 2, 195);

        ctx.font = 'normal 28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(branch.address || branch.name, width / 2, 245);

        const qrBoxY = 380;
        ctx.fillStyle = '#ffffff';
        drawRoundRect(width / 2 - 340, qrBoxY, 680, 680, 40);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.drawImage(qrImg, width / 2 - 300, qrBoxY + 40, 600, 600);
        await drawCenterEmblemOnCanvas(ctx, width / 2, qrBoxY + 340, 130);

        const stepsY = qrBoxY + 740;
        ctx.fillStyle = '#ffffff';
        drawRoundRect(100, stepsY, width - 200, 200, 28);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.fillText('1. Scan QR with Camera', 160, stepsY + 65);
        ctx.fillText('2. Select Dishes & Customize', 160, stepsY + 115);
        ctx.fillText('3. Direct Kitchen Order Dispatch', 160, stepsY + 165);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = '500 24px monospace';
        ctx.fillText(customerUrl, width / 2, 1470);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'normal 20px sans-serif';
        ctx.fillText('Powered by OrdZo Storefront', width / 2, 1530);
      } else if (template === 'badge') {
        // --- BISTRO ROUND DECAL / COASTER ---
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 540, 0, Math.PI * 2);
        ctx.fillStyle = currentTheme.primaryColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 500, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = currentTheme.primaryColor;
        ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(restaurantName.toUpperCase(), width / 2, height / 2 - 330);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('SCAN FOR DIGITAL MENU', width / 2, height / 2 - 280);

        ctx.drawImage(qrImg, width / 2 - 260, height / 2 - 210, 520, 520);
        await drawCenterEmblemOnCanvas(ctx, width / 2, height / 2 + 50, 115);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('TOUCHLESS ORDERING', width / 2, height / 2 + 370);

        ctx.fillStyle = '#64748b';
        ctx.font = '600 22px monospace';
        ctx.fillText(customerUrl, width / 2, height / 2 + 420);
      } else {
        // --- DEFAULT: SIGNATURE RESTAURANT STANDEE ---
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, currentTheme.qrGradient.color1);
        grad.addColorStop(0.5, currentTheme.primaryColor);
        grad.addColorStop(1, currentTheme.secondaryColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(width - 100, 150, 240, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.arc(100, height - 150, 280, 0, Math.PI * 2);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('WELCOME & DINE-IN', width / 2, 180);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(restaurantName, width / 2, 275);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'normal 30px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(branch.address || branch.name, width / 2, 335);

        drawRoundRect(width / 2 - 340, 420, 680, 680, 48);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.drawImage(qrImg, width / 2 - 300, 460, 600, 600);
        await drawCenterEmblemOnCanvas(ctx, width / 2, 760, 130);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('SCAN FOR DIGITAL MENU', width / 2, 1200);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'normal 26px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Point your phone camera • No app download required', width / 2, 1255);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        drawRoundRect(width / 2 - 380, 1330, 760, 72, 24);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 24px monospace';
        ctx.fillText(customerUrl, width / 2, 1375);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'normal 20px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('Powered by OrdZo Storefront', width / 2, 1490);
      }

      const fileName = `${branch.slug}-${template}-stand.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast.success(`Stand exported as ${fileName}!`, 'Download Complete');
    } catch (err: any) {
      console.error('Failed to generate high-res QR card', err);
      toast.error('Could not generate printable stand card.', 'Download Error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Shared Center Emblem Renderer
  const renderCenterEmblemOverlay = (sizeClass = 'w-12 h-12', borderClass = 'border-primary') => {
    if (centerIcon === 'none') return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`${sizeClass} rounded-full bg-white shadow-md border-2 ${borderClass} flex items-center justify-center overflow-hidden p-1`}
        >
          {centerIcon === 'logo' && logoUrl ? (
            <img
              src={logoUrl}
              alt={restaurantName}
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.innerText = '🍽️';
                }
              }}
            />
          ) : centerIcon === 'coffee' ? (
            <span className="text-lg">☕</span>
          ) : centerIcon === 'pizza' ? (
            <span className="text-lg">🍕</span>
          ) : centerIcon === 'bar' ? (
            <span className="text-lg">🍸</span>
          ) : (
            <span className="text-lg">🍽️</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-backdrop backdrop-blur-md overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Container */}
      <div className="relative w-full max-w-5xl bg-surface border border-border rounded-2xl shadow-2xl z-10 flex flex-col lg:flex-row overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95 max-h-[92vh]">
        {/* Left Side: Modern Interactive Customization Controls */}
        <div className="p-5 sm:p-6 lg:p-7 flex-1 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border bg-surface overflow-y-auto">
          <div className="space-y-5">
            {/* Top Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text">Storefront QR Studio</h2>
                  <p className="text-xs text-muted">Customize branded QR styles & print-ready dining stands</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Branch & Brand Info Pill */}
            <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-xs text-text shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={restaurantName} className="w-full h-full object-cover" />
                  ) : (
                    <Store size={14} className="text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-text truncate">{restaurantName}</div>
                  <div className="text-[11px] text-muted truncate">{branch.name}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/20 shrink-0">
                Live Storefront
              </span>
            </div>

            {/* 1. Stand Template Layouts */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <Layout size={13} className="text-primary" />
                <span>Table Stand Format</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'brand', label: 'Signature Standee', desc: 'Branded restaurant stand' },
                  { id: 'acrylic', label: 'Modern Tent', desc: 'Step 1-2-3 dining guide' },
                  { id: 'luxury', label: 'Fine Dining Card', desc: 'Obsidian & gold elegance' },
                  { id: 'badge', label: 'Bistro Sticker', desc: 'Round decal / coaster' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplate(tpl.id as StandTemplate)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      template === tpl.id
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-bold text-text'
                        : 'border-border hover:border-text/30 bg-surface text-muted'
                    }`}
                  >
                    <span className="text-xs font-bold truncate">{tpl.label}</span>
                    <span className="text-[10px] text-muted mt-0.5 line-clamp-1">{tpl.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Distinct QR Code Module Patterns */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <Layers size={13} className="text-primary" />
                <span>QR Module Pattern</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'dots', label: 'Modern Dots', sub: '● Circles' },
                  { id: 'tiles', label: 'Soft Tiles', sub: '▢ Mosaic' },
                  { id: 'diamond', label: 'Diamond Cut', sub: '◆ Gems' },
                  { id: 'bars', label: 'Liquid Bars', sub: '▬ Capsules' },
                  { id: 'square', label: 'Crisp Square', sub: '■ Classic' },
                ].map((pattern) => (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => setDotPattern(pattern.id as QRDotPattern)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      dotPattern === pattern.id
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border hover:border-text/30 bg-surface text-muted'
                    }`}
                  >
                    <span className="text-xs leading-tight">{pattern.label}</span>
                    <span className="text-[10px] opacity-70 leading-tight mt-0.5">{pattern.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Corner Eye & Outer Shape */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                  <Eye size={13} className="text-primary" />
                  <span>Corner Eye Shape</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'squircle', label: 'Squircle' },
                    { id: 'circle', label: 'Circle' },
                    { id: 'leaf', label: 'Leaf' },
                    { id: 'square', label: 'Square' },
                  ].map((eye) => (
                    <button
                      key={eye.id}
                      type="button"
                      onClick={() => setEyePattern(eye.id as QREyePattern)}
                      className={`py-1.5 px-1.5 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                        eyePattern === eye.id
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border hover:border-text/30 bg-surface text-muted'
                      }`}
                    >
                      {eye.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Shape (Square vs Circle) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                  <QrCode size={13} className="text-primary" />
                  <span>QR Outer Frame</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'square', label: 'Square Frame' },
                    { id: 'circle', label: 'Circle Frame' },
                  ].map((sh) => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => setShape(sh.id as QRShape)}
                      className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                        shape === sh.id
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border hover:border-text/30 bg-surface text-muted'
                      }`}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Restaurant Color Themes */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <Palette size={13} className="text-primary" />
                <span>Color Theme</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(THEME_CONFIGS) as ColorTheme[]).map((themeKey) => {
                  const cfg = THEME_CONFIGS[themeKey];
                  const isSelected = selectedTheme === themeKey;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => setSelectedTheme(themeKey)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-surface-2 font-bold text-text'
                          : 'border-border hover:border-text/30 bg-surface text-muted'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${cfg.bgGradient} shrink-0`} />
                      <span className="truncate text-xs">{cfg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Center Brand Emblem */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text">Center Emblem</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCenterIcon('logo')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    centerIcon === 'logo'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border hover:border-text/30 bg-surface text-muted'
                  }`}
                >
                  <Store size={12} />
                  <span>Restaurant Logo</span>
                </button>
                {[
                  { id: 'cutlery', icon: <UtensilsCrossed size={12} />, label: '🍽️ Dining' },
                  { id: 'coffee', icon: <Coffee size={12} />, label: '☕ Cafe' },
                  { id: 'pizza', icon: <Pizza size={12} />, label: '🍕 Pizza' },
                  { id: 'bar', icon: <Wine size={12} />, label: '🍸 Bar' },
                  { id: 'none', icon: null, label: 'Clean (No Icon)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCenterIcon(item.id as CenterIconType)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      centerIcon === item.id
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border hover:border-text/30 bg-surface text-muted'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Customer URL Preview Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text">Customer Storefront Link</label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-2 border border-border">
                <code className="text-[11px] font-mono text-primary truncate flex-1 font-semibold">
                  {customerUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1 text-muted hover:text-text transition-colors cursor-pointer shrink-0"
                  title="Copy link"
                >
                  {isCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons: Multi-format download & Preview */}
          <div className="pt-5 border-t border-border mt-5 flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full sm:flex-1 cursor-pointer font-bold"
                icon={<Download size={15} />}
                onClick={handleDownloadStand}
                isLoading={isDownloading}
              >
                Download Table Stand (PNG)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full sm:w-auto cursor-pointer"
                icon={isCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                onClick={handleCopyLink}
              >
                {isCopied ? 'Copied' : 'Copy Link'}
              </Button>
              <a
                href={customerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-2 hover:bg-border text-text font-bold text-xs transition-colors border border-border"
                title="Open Customer Storefront"
              >
                <ExternalLink size={14} />
                <span>Preview</span>
              </a>
            </div>

            {/* Pure QR exports */}
            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <span>Pure QR Export:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPureSvg}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  <FileDown size={12} />
                  <span>Vector (.SVG)</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleDownloadPurePng}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  <FileDown size={12} />
                  <span>Image (.PNG)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Interactive Template Stand Preview */}
        <div className="p-6 lg:p-8 bg-surface-2/70 flex flex-col items-center justify-center min-w-[340px] lg:min-w-[440px] relative overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="hidden lg:flex absolute top-4 right-4 p-2 rounded-full text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* DYNAMIC TEMPLATE RENDER */}
          {template === 'luxury' && (
            <div className="w-[300px] sm:w-[330px] rounded-3xl p-6 bg-zinc-950 text-white flex flex-col items-center justify-between text-center border-2 border-amber-600/70 shadow-2xl relative overflow-hidden">
              <div className="space-y-1 w-full relative z-10 pt-2">
                <span className="text-[10px] tracking-widest uppercase text-amber-300/80 font-serif">
                  Carte du Jour  •  Fine Dining
                </span>
                <h3 className="text-xl font-serif font-bold text-amber-100 tracking-wide line-clamp-1">
                  {restaurantName}
                </h3>
                <p className="text-[11px] text-amber-200/70 font-serif line-clamp-1">
                  {branch.address || branch.name}
                </p>
              </div>

              <div
                className={`my-5 p-3 bg-white shadow-xl relative flex items-center justify-center border-2 border-amber-500/60 ${
                  shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                }`}
              >
                <StylizedQRCode
                  svgRef={svgRef}
                  value={customerUrl}
                  dotPattern={dotPattern}
                  eyePattern={eyePattern}
                  shape={shape}
                  color1={currentTheme.qrGradient.color1}
                  color2={currentTheme.qrGradient.color2}
                  excavateCenter={centerIcon !== 'none'}
                  className="w-[190px] h-[190px]"
                />
                {renderCenterEmblemOverlay('w-12 h-12', 'border-amber-600')}
              </div>

              <div className="space-y-1 relative z-10 pb-1">
                <div className="text-xs font-serif font-bold text-amber-200 uppercase tracking-widest">
                  Scan for Digital Menu
                </div>
                <p className="text-[10px] text-amber-100/70">Point your camera to browse & order</p>
              </div>
            </div>
          )}

          {template === 'acrylic' && (
            <div className="w-[300px] sm:w-[330px] rounded-2xl bg-white text-zinc-900 shadow-2xl border border-zinc-200 flex flex-col overflow-hidden">
              <div className={`p-4 ${currentTheme.cardBg} text-white text-center space-y-0.5`}>
                <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">
                  Dine-In Storefront
                </span>
                <h3 className="text-lg font-black tracking-tight leading-tight line-clamp-1">
                  {restaurantName}
                </h3>
                <p className="text-[10px] opacity-80 truncate">{branch.address || branch.name}</p>
              </div>

              <div className="p-3 my-2 flex items-center justify-center relative">
                <StylizedQRCode
                  svgRef={svgRef}
                  value={customerUrl}
                  dotPattern={dotPattern}
                  eyePattern={eyePattern}
                  shape={shape}
                  color1={currentTheme.qrGradient.color1}
                  color2={currentTheme.qrGradient.color2}
                  excavateCenter={centerIcon !== 'none'}
                  className="w-[190px] h-[190px]"
                />
                {renderCenterEmblemOverlay('w-12 h-12', 'border-zinc-300')}
              </div>

              <div className="px-4 pb-4 pt-2 space-y-1.5 text-left text-[11px] font-medium text-zinc-600 bg-zinc-50 border-t border-zinc-100">
                <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center">1</span>
                  <span>Scan QR with phone camera</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center">2</span>
                  <span>Browse dishes & add notes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center">3</span>
                  <span>Order sent to kitchen instantly</span>
                </div>
              </div>
            </div>
          )}

          {template === 'badge' && (
            <div className="w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] rounded-full p-6 bg-white text-zinc-900 shadow-2xl border-8 border-primary flex flex-col items-center justify-between text-center relative overflow-hidden">
              <div className="space-y-0.5 pt-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                  {restaurantName}
                </span>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  Scan for Digital Menu
                </p>
              </div>

              <div className="flex items-center justify-center relative">
                <StylizedQRCode
                  svgRef={svgRef}
                  value={customerUrl}
                  dotPattern={dotPattern}
                  eyePattern={eyePattern}
                  shape={shape}
                  color1={currentTheme.qrGradient.color1}
                  color2={currentTheme.qrGradient.color2}
                  excavateCenter={centerIcon !== 'none'}
                  className="w-[160px] h-[160px]"
                />
                {renderCenterEmblemOverlay('w-10 h-10', 'border-primary')}
              </div>

              <div className="pb-1 text-[9px] font-extrabold uppercase tracking-widest text-zinc-700">
                Touchless Ordering
              </div>
            </div>
          )}

          {template === 'brand' && (
            <div
              className={`w-[300px] sm:w-[320px] rounded-3xl p-6 ${currentTheme.cardBg} ${currentTheme.borderGlow} text-white flex flex-col items-center justify-between text-center transition-all duration-300 relative overflow-hidden`}
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-black/20 blur-xl pointer-events-none" />

              <div className="space-y-1.5 w-full relative z-10">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentTheme.accentPill}`}>
                  <Sparkles size={11} />
                  <span>Digital Menu & Ordering</span>
                </span>

                <h3 className="text-lg font-black tracking-tight leading-tight drop-shadow-xs line-clamp-1">
                  {restaurantName}
                </h3>
                <p className="text-[11px] text-white/80 font-medium leading-none line-clamp-1">
                  {branch.address || branch.name}
                </p>
              </div>

              <div
                className={`my-5 p-3.5 bg-white shadow-2xl relative flex items-center justify-center ${
                  shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                }`}
              >
                <StylizedQRCode
                  svgRef={svgRef}
                  value={customerUrl}
                  dotPattern={dotPattern}
                  eyePattern={eyePattern}
                  shape={shape}
                  color1={currentTheme.qrGradient.color1}
                  color2={currentTheme.qrGradient.color2}
                  excavateCenter={centerIcon !== 'none'}
                  className="w-[185px] h-[185px]"
                />
                {renderCenterEmblemOverlay('w-12 h-12', 'border-primary')}
              </div>

              <div className="space-y-1 relative z-10">
                <div className="text-xs font-extrabold uppercase tracking-widest text-white drop-shadow-xs">
                  Scan for Digital Menu
                </div>
                <p className="text-[10px] text-white/80 font-medium">
                  Point phone camera • Instant live ordering
                </p>
                <div className="pt-2">
                  <span className="font-mono text-[9px] text-white/70 bg-black/20 px-2 py-0.5 rounded-md truncate inline-block max-w-[240px]">
                    {customerUrl.replace('http://', '').replace('https://', '')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="text-[11px] text-muted mt-3 text-center">
            {template === 'badge'
              ? 'Round sticker / decal format for tables or coasters.'
              : template === 'acrylic'
              ? 'Dine-in table tent format with 3-step order instructions.'
              : template === 'luxury'
              ? 'Fine dining gold-foil format for luxury restaurants & lounges.'
              : 'Signature branded storefront stand format.'}
          </div>
        </div>
      </div>
    </div>
  );
};
