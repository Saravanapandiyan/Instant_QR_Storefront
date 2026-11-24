import React, { useState, useRef, useEffect } from 'react';
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
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import {
  StylizedQRCode,
  type QRDotPattern,
  type QREyePattern,
  type QRShape,
} from './StylizedQRCode';
import type { Branch, Restaurant, RestaurantTable } from '@instant-qr/shared-types';
import { branchesApi } from '../api/branchesApi';

export interface InstagramQRModalProps {
  branch: Branch | null;
  restaurant?: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  initialTableNumber?: string | null;
  tables?: RestaurantTable[];
}

import {
  type StandTemplate,
  type ColorTheme,
  type CenterIconType,
  type ThemeConfig,
  THEME_CONFIGS,
  renderStandeeToCanvas,
  renderSvgStringToImage,
  getCenterIconEmoji,
  getSavedStandeeDesign,
  saveStandeeDesign,
} from './standeeRenderer';

export const InstagramQRModal: React.FC<InstagramQRModalProps> = ({
  branch,
  restaurant,
  isOpen,
  onClose,
  initialTableNumber,
  tables,
}) => {
  useBodyScrollLock(isOpen);
  const initialDesign = getSavedStandeeDesign(branch?.id);

  // Customization state
  const [template, setTemplate] = useState<StandTemplate>(initialDesign.template);
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(initialDesign.selectedTheme);
  const [dotPattern, setDotPattern] = useState<QRDotPattern>(initialDesign.dotPattern);
  const [eyePattern, setEyePattern] = useState<QREyePattern>(initialDesign.eyePattern);
  const [shape, setShape] = useState<QRShape>(initialDesign.shape);
  const [centerIcon, setCenterIcon] = useState<CenterIconType>(initialDesign.centerIcon);

  const [selectedTableNumber, setSelectedTableNumber] = useState<string | null>(
    initialTableNumber || null
  );
  const [allTables, setAllTables] = useState<RestaurantTable[]>(tables || []);

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Synchronize state with saved design whenever modal opens or branch changes
  useEffect(() => {
    if (isOpen && branch?.id) {
      const saved = getSavedStandeeDesign(branch.id);
      setTemplate(saved.template);
      setSelectedTheme(saved.selectedTheme);
      setDotPattern(saved.dotPattern);
      setEyePattern(saved.eyePattern);
      setShape(saved.shape);
      setCenterIcon(saved.centerIcon);
    }
  }, [isOpen, branch?.id]);

  // Design selection handlers that persist immediately to localStorage
  const handleSelectTemplate = (tpl: StandTemplate) => {
    setTemplate(tpl);
    saveStandeeDesign(branch?.id, { template: tpl });
  };

  const handleSelectTheme = (thm: ColorTheme) => {
    setSelectedTheme(thm);
    saveStandeeDesign(branch?.id, { selectedTheme: thm });
  };

  const handleSelectDotPattern = (pat: QRDotPattern) => {
    setDotPattern(pat);
    saveStandeeDesign(branch?.id, { dotPattern: pat });
  };

  const handleSelectEyePattern = (eye: QREyePattern) => {
    setEyePattern(eye);
    saveStandeeDesign(branch?.id, { eyePattern: eye });
  };

  const handleSelectShape = (sh: QRShape) => {
    setShape(sh);
    saveStandeeDesign(branch?.id, { shape: sh });
  };

  const handleSelectCenterIcon = (ic: CenterIconType) => {
    setCenterIcon(ic);
    saveStandeeDesign(branch?.id, { centerIcon: ic });
  };

  // Sync initial table
  useEffect(() => {
    if (initialTableNumber !== undefined) {
      setSelectedTableNumber(initialTableNumber);
    }
  }, [initialTableNumber]);

  // Sync / fetch tables
  useEffect(() => {
    if (tables && tables.length > 0) {
      setAllTables(tables);
    } else if (branch?.id && isOpen) {
      branchesApi.getBranchTables(branch.id).then(setAllTables).catch(() => {});
    }
  }, [branch?.id, tables, isOpen]);

  // Reference directly to our live SVG element
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!isOpen || !branch) {
    return null;
  }

  const currentTheme = THEME_CONFIGS[selectedTheme];
  const restaurantName = restaurant?.name || branch.restaurant?.name || 'Restaurant';
  const logoUrl = getMediaUrl(restaurant?.logoUrl || branch.restaurant?.logoUrl);
  const baseCustomerUrl = getCustomerStorefrontUrl(branch.slug);
  const customerUrl = selectedTableNumber
    ? `${baseCustomerUrl}?table=${encodeURIComponent(selectedTableNumber)}`
    : baseCustomerUrl;

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
      const height = template === 'badge' ? 1200 : 1600;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize 2D context');

      renderStandeeToCanvas(ctx, {
        width,
        height,
        template,
        colorTheme: selectedTheme,
        restaurantName,
        branchAddressOrName: branch.address || branch.name,
        tableNumber: selectedTableNumber,
        customerUrl,
        qrImg,
        centerIcon,
      });

      const tableSuffix = selectedTableNumber
        ? `-${selectedTableNumber.toLowerCase().replace(/\s+/g, '-')}`
        : '';
      const fileName = `${branch.slug}${tableSuffix}-${template}-stand.png`;
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
  const renderCenterEmblemOverlay = (sizeClass = 'w-12 h-12', borderColor?: string) => {
    if (centerIcon === 'none') return null;
    const borderStyle = borderColor ? { borderColor } : { borderColor: currentTheme.primaryColor };
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`${sizeClass} rounded-full bg-white shadow-md border-2 flex items-center justify-center overflow-hidden p-1`}
          style={borderStyle}
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
          ) : (
            <span className="text-lg">{getCenterIconEmoji(centerIcon) || '🍽️'}</span>
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

            {/* Target QR Mode / Table Selector */}
            <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text flex items-center gap-1.5">
                  <UtensilsCrossed size={13} className="text-primary" />
                  <span>Target Table / QR Mode</span>
                </span>
                {selectedTableNumber && (
                  <button
                    type="button"
                    onClick={() => setSelectedTableNumber(null)}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Reset to Main Storefront
                  </button>
                )}
              </div>
              <select
                value={selectedTableNumber || ''}
                onChange={(e) => setSelectedTableNumber(e.target.value || null)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="">Main Storefront QR (All Tables / Walk-in)</option>
                {allTables.map((t) => (
                  <option key={t.id} value={t.tableNumber}>
                    {t.tableNumber} • {t.section || 'Main Room'} ({t.capacity || 4} Guests)
                  </option>
                ))}
              </select>
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
                    onClick={() => handleSelectTemplate(tpl.id as StandTemplate)}
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
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'dots', label: '● Dots', sub: 'Circles' },
                  { id: 'tiles', label: '▢ Tiles', sub: 'Mosaic' },
                  { id: 'diamond', label: '◆ Diamond', sub: 'Gems' },
                  { id: 'bars', label: '▬ Bars', sub: 'Capsules' },
                  { id: 'square', label: '■ Classic', sub: 'Square' },
                ].map((pattern) => (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => handleSelectDotPattern(pattern.id as QRDotPattern)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      dotPattern === pattern.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border hover:border-text/30 bg-surface text-muted'
                    }`}
                  >
                    <span className="text-xs font-semibold leading-tight">{pattern.label}</span>
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
                      onClick={() => handleSelectEyePattern(eye.id as QREyePattern)}
                      className={`py-1.5 px-1.5 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer ${
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
                      onClick={() => handleSelectShape(sh.id as QRShape)}
                      className={`py-1.5 px-2 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer ${
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
                      onClick={() => handleSelectTheme(themeKey)}
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
                  onClick={() => handleSelectCenterIcon('logo')}
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
                    onClick={() => handleSelectCenterIcon(item.id as CenterIconType)}
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
                {selectedTableNumber && (
                  <div className="inline-block px-3 py-0.5 border-y border-amber-400/50 text-amber-200 font-serif font-bold text-xs tracking-widest uppercase my-0.5">
                    {selectedTableNumber}
                  </div>
                )}
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
                {renderCenterEmblemOverlay('w-12 h-12', '#d97706')}
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
                {selectedTableNumber && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white font-black text-[11px] tracking-wider uppercase mt-1">
                    {selectedTableNumber}
                  </span>
                )}
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
                {renderCenterEmblemOverlay('w-12 h-12', currentTheme.primaryColor)}
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
            <div
              className="w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] rounded-full p-6 bg-white text-zinc-900 shadow-2xl border-8 flex flex-col items-center justify-between text-center relative overflow-hidden"
              style={{ borderColor: currentTheme.primaryColor }}
            >
              <div className="space-y-0.5 pt-1">
                <span
                  className="text-[11px] font-black uppercase tracking-wider block truncate max-w-[220px]"
                  style={{ color: currentTheme.primaryColor }}
                >
                  {restaurantName}
                </span>
                {selectedTableNumber && (
                  <div>
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5"
                      style={{
                        backgroundColor: `${currentTheme.primaryColor}15`,
                        color: currentTheme.primaryColor,
                      }}
                    >
                      {selectedTableNumber}
                    </span>
                  </div>
                )}
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
                {renderCenterEmblemOverlay('w-10 h-10', currentTheme.primaryColor)}
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
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentTheme.accentPill}`}>
                    <Sparkles size={11} />
                    <span>Digital Menu & Ordering</span>
                  </span>
                  {selectedTableNumber && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/25 text-white border border-white/35">
                      <UtensilsCrossed size={10} />
                      <span>{selectedTableNumber}</span>
                    </span>
                  )}
                </div>

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
                {renderCenterEmblemOverlay('w-12 h-12', currentTheme.primaryColor)}
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
