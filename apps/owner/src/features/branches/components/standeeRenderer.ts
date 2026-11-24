import type { QRDotPattern, QREyePattern, QRShape } from './StylizedQRCode';

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

export interface StandeeDesignSettings {
  template: StandTemplate;
  selectedTheme: ColorTheme;
  dotPattern: QRDotPattern;
  eyePattern: QREyePattern;
  shape: QRShape;
  centerIcon: CenterIconType;
}

export const DEFAULT_STANDEE_DESIGN: StandeeDesignSettings = {
  template: 'brand',
  selectedTheme: 'terracotta',
  dotPattern: 'dots',
  eyePattern: 'squircle',
  shape: 'square',
  centerIcon: 'cutlery',
};

export function getSavedStandeeDesign(branchId?: string | null): StandeeDesignSettings {
  if (!branchId || typeof window === 'undefined') return DEFAULT_STANDEE_DESIGN;
  try {
    const raw = localStorage.getItem(`instadine_standee_design_${branchId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        template: parsed.template || DEFAULT_STANDEE_DESIGN.template,
        selectedTheme: parsed.selectedTheme || DEFAULT_STANDEE_DESIGN.selectedTheme,
        dotPattern: parsed.dotPattern || DEFAULT_STANDEE_DESIGN.dotPattern,
        eyePattern: parsed.eyePattern || DEFAULT_STANDEE_DESIGN.eyePattern,
        shape: parsed.shape || DEFAULT_STANDEE_DESIGN.shape,
        centerIcon: parsed.centerIcon || DEFAULT_STANDEE_DESIGN.centerIcon,
      };
    }
  } catch (e) {
    console.warn('Failed to load standee design from localStorage', e);
  }
  return DEFAULT_STANDEE_DESIGN;
}

export function saveStandeeDesign(
  branchId: string | undefined | null,
  updates: Partial<StandeeDesignSettings>
): StandeeDesignSettings {
  if (!branchId || typeof window === 'undefined') return DEFAULT_STANDEE_DESIGN;
  try {
    const current = getSavedStandeeDesign(branchId);
    const updated: StandeeDesignSettings = {
      ...current,
      ...updates,
    };
    localStorage.setItem(`instadine_standee_design_${branchId}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save standee design to localStorage', e);
    return DEFAULT_STANDEE_DESIGN;
  }
}

export interface ThemeConfig {
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

export const THEME_CONFIGS: Record<ColorTheme, ThemeConfig> = {
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

export interface RenderStandeeOptions {
  width?: number;
  height?: number;
  template: StandTemplate;
  colorTheme: ColorTheme;
  restaurantName: string;
  branchAddressOrName: string;
  tableNumber?: string | null;
  customerUrl: string;
  qrImg: HTMLImageElement;
  centerIcon?: CenterIconType;
}

export function getCenterIconEmoji(centerIcon: CenterIconType): string {
  switch (centerIcon) {
    case 'coffee':
      return '☕';
    case 'pizza':
      return '🍕';
    case 'bar':
      return '🍸';
    case 'cutlery':
    case 'logo':
      return '🍽️';
    case 'none':
    default:
      return '';
  }
}

export function drawCenterEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  centerIcon: CenterIconType = 'cutlery',
  primaryColor: string = '#ea580c',
) {
  if (centerIcon === 'none') return;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  const emoji = getCenterIconEmoji(centerIcon);
  if (emoji) {
    ctx.font = `${Math.round(size * 0.48)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, cx, cy + 4);
  }
}

export async function renderSvgStringToImage(
  svgString: string,
  sizePx: number = 600,
): Promise<HTMLImageElement> {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
  URL.revokeObjectURL(url);
  return img;
}

export function renderStandeeToCanvas(
  ctx: CanvasRenderingContext2D,
  options: RenderStandeeOptions,
) {
  const width = options.width || 1200;
  const height = options.height || 1600;
  const {
    template,
    colorTheme,
    restaurantName,
    branchAddressOrName,
    tableNumber,
    customerUrl,
    qrImg,
    centerIcon = 'cutlery',
  } = options;

  const currentTheme = THEME_CONFIGS[colorTheme] || THEME_CONFIGS.terracotta;

  const drawRoundRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
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
    ctx.fillText('Carte du Jour  •  Digital Dining', width / 2, 220);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Times New Roman", Georgia, serif';
    ctx.fillText(restaurantName, width / 2, 305);

    ctx.fillStyle = 'rgba(254, 243, 199, 0.8)';
    ctx.font = '28px "Times New Roman", Georgia, serif';
    ctx.fillText(branchAddressOrName, width / 2, 360);

    if (tableNumber) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 36px "Times New Roman", Georgia, serif';
      const iconPrefix = getCenterIconEmoji(centerIcon) ? `${getCenterIconEmoji(centerIcon)} ` : '';
      ctx.fillText(`${iconPrefix}${tableNumber.toUpperCase()}`, width / 2, 420);
    }

    drawRoundRect(width / 2 - 340, 460, 680, 680, 36);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.drawImage(qrImg, width / 2 - 300, 500, 600, 600);
    drawCenterEmblem(ctx, width / 2, 800, 130, centerIcon, '#d97706');

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
    ctx.fillText('Instant QR Storefront', width / 2, 1510);
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
    ctx.fillText('DINE-IN ORDERING', width / 2, 100);

    ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(restaurantName, width / 2, 185);

    ctx.font = 'normal 28px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(branchAddressOrName, width / 2, 235);

    if (tableNumber) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
      const iconPrefix = getCenterIconEmoji(centerIcon) ? `${getCenterIconEmoji(centerIcon)} ` : '';
      ctx.fillText(`${iconPrefix}${tableNumber.toUpperCase()}`, width / 2, 280);
    }

    const qrBoxY = 380;
    ctx.fillStyle = '#ffffff';
    drawRoundRect(width / 2 - 340, qrBoxY, 680, 680, 40);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.drawImage(qrImg, width / 2 - 300, qrBoxY + 40, 600, 600);
    drawCenterEmblem(ctx, width / 2, qrBoxY + 340, 130, centerIcon, currentTheme.primaryColor);

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
    ctx.fillText('Powered by Instant QR Storefront', width / 2, 1530);
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
    ctx.fillText(restaurantName.toUpperCase(), width / 2, height / 2 - 340);

    if (tableNumber) {
      ctx.fillStyle = '#18181b';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif';
      const iconPrefix = getCenterIconEmoji(centerIcon) ? `${getCenterIconEmoji(centerIcon)} ` : '';
      ctx.fillText(`${iconPrefix}${tableNumber.toUpperCase()}`, width / 2, height / 2 - 295);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('SCAN FOR DIGITAL MENU', width / 2, height / 2 - 290);
    }

    ctx.drawImage(qrImg, width / 2 - 260, height / 2 - 210, 520, 520);
    drawCenterEmblem(ctx, width / 2, height / 2 + 50, 115, centerIcon, currentTheme.primaryColor);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('TOUCHLESS ORDERING', width / 2, height / 2 + 370);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 22px monospace';
    ctx.fillText(customerUrl, width / 2, height / 2 + 420);
  } else {
    // --- DEFAULT: SIGNATURE RESTAURANT STANDEE (MATCHING IMAGE 3) ---
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
    ctx.fillText('WELCOME & DINE-IN', width / 2, 175);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(restaurantName, width / 2, 265);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'normal 30px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(branchAddressOrName, width / 2, 325);

    if (tableNumber) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      drawRoundRect(width / 2 - 200, 355, 400, 52, 16);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif';
      const iconPrefix = getCenterIconEmoji(centerIcon) ? `${getCenterIconEmoji(centerIcon)} ` : '';
      ctx.fillText(`${iconPrefix}${tableNumber.toUpperCase()}`, width / 2, 392);
    }

    drawRoundRect(width / 2 - 340, 420, 680, 680, 48);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.drawImage(qrImg, width / 2 - 300, 460, 600, 600);
    drawCenterEmblem(ctx, width / 2, 760, 130, centerIcon, currentTheme.primaryColor);

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
    ctx.fillText('Powered by Instant QR Storefront', width / 2, 1490);
  }
}
