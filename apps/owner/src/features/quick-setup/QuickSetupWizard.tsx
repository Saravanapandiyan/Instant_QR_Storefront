import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  ChefHat,
  Users,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trash2,
  Plus,
  RefreshCw,
  ShoppingBag,
  Gift,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Minus,
  Printer,
  Palette,
  UtensilsCrossed,
  Smartphone,
  Camera,
  Pencil,
  X,
} from 'lucide-react';
import {
  StylizedQRCode,
  type QRDotPattern,
  type QREyePattern,
  type QRShape,
} from '../branches/components/StylizedQRCode';
import {
  THEME_CONFIGS,
  type StandTemplate,
  type ColorTheme,
  type CenterIconType,
  getCenterIconEmoji,
  saveStandeeDesign,
} from '../branches/components/standeeRenderer';
import { quickSetupApi, type MenuCategory, type MenuItem } from './api/quickSetupApi';
import { toast } from '../../components/ui';
import { getCustomerStorefrontUrl, CUSTOMER_APP_URL } from '../../lib/urls';

interface QuickSetupWizardProps {
  onComplete: () => void;
  onCancel?: () => void;
}

const DEFAULT_FALLBACK_IMG =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80';

const cleanCategories = (cats: MenuCategory[]): MenuCategory[] => {
  return (cats || []).map((cat) => ({
    ...cat,
    items: (cat.items || []).map((item) => {
      let img = item.imageUrl;
      if (!img || img.includes('pollinations.ai')) {
        img = DEFAULT_FALLBACK_IMG;
      }
      return {
        ...item,
        imageUrl: img,
      };
    }),
  }));
};

export const QuickSetupWizard: React.FC<QuickSetupWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [serviceType, setServiceType] = useState('BOTH');
  const [tablesCount, setTablesCount] = useState<number | string>(10);

  // QR Design Studio State (standardized matching TableQrModal and standeeRenderer)
  const [template, setTemplate] = useState<StandTemplate>('brand');
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>('terracotta');
  const [dotPattern, setDotPattern] = useState<QRDotPattern>('dots');
  const [eyePattern, setEyePattern] = useState<QREyePattern>('squircle');
  const [shape, setShape] = useState<QRShape>('square');
  const [centerIcon, setCenterIcon] = useState<CenterIconType>('cutlery');
  const [showTableNumber, setShowTableNumber] = useState<boolean>(true);
  const [previewTableNum, setPreviewTableNum] = useState<number>(1);

  // Menu State (empty by default as requested)
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isUploadingMenu, setIsUploadingMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadStepIndex, setUploadStepIndex] = useState(1);

  // Edit Dish Modal State
  const [editingDish, setEditingDish] = useState<{
    catIndex: number;
    itemIndex: number;
    item: MenuItem;
    targetCategory: string;
  } | null>(null);
  const [isRegeneratingEditDesc, setIsRegeneratingEditDesc] = useState(false);
  const [isChangingEditPhoto, setIsChangingEditPhoto] = useState(false);

  // Staff State (Terminal PIN & Email/Password login)
  const [staffName, setStaffName] = useState('Counter Team');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('CASHIER');
  const [staffPin, setStaffPin] = useState('1234');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);

  // Auto-clean any broken or pollinations URLs
  useEffect(() => {
    setCategories((prev) => cleanCategories(prev));
  }, []);

  // Upload menu handler (AI OCR + Descriptions + Images)
  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so user can upload again
    e.target.value = '';

    try {
      setIsUploadingMenu(true);
      setUploadProgress(15);
      setUploadStepIndex(1);
      setUploadProgressText('Uploading menu photo & preparing analysis...');

      const timer1 = setTimeout(() => {
        setUploadProgress(45);
        setUploadStepIndex(2);
        setUploadProgressText('Smart AI scanning dishes, sections & prices...');
      }, 600);

      const timer2 = setTimeout(() => {
        setUploadProgress(80);
        setUploadStepIndex(3);
        setUploadProgressText('Generating mouth-watering descriptions & pairing food photos...');
      }, 1800);

      const response = await quickSetupApi.importMenuFile(file);

      clearTimeout(timer1);
      clearTimeout(timer2);

      setUploadProgress(100);
      setUploadStepIndex(4);
      setUploadProgressText('Menu extracted successfully!');

      if (response?.categories && response.categories.length > 0) {
        setTimeout(() => {
          setCategories(cleanCategories(response.categories));
          setIsUploadingMenu(false);
          setUploadProgress(0);
          toast.success(`Successfully imported ${response.categories.length} categories!`);
        }, 400);
      } else {
        setIsUploadingMenu(false);
        setUploadProgress(0);
        toast.error('Could not detect any menu items. Please ensure prices and names are legible.');
      }
    } catch (err: any) {
      setIsUploadingMenu(false);
      setUploadProgress(0);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'AI menu import failed. Please ensure the menu photo is clear.';
      toast.error(errorMsg);
    }
  };

  // Save edited dish
  const handleSaveEditedDish = () => {
    if (!editingDish) return;
    const { catIndex, itemIndex, item, targetCategory } = editingDish;

    if (!item.name.trim()) {
      toast.error('Dish name cannot be empty');
      return;
    }

    setCategories((prev) => {
      const updated = [...prev];
      const currentCat = updated[catIndex];

      // If category didn't change:
      if (currentCat && currentCat.name === targetCategory) {
        updated[catIndex].items[itemIndex] = { ...item };
        return updated;
      }

      // If category changed, move dish
      if (updated[catIndex]?.items) {
        updated[catIndex].items.splice(itemIndex, 1);
      }
      let targetCatObj = updated.find((c) => c.name.toLowerCase() === targetCategory.toLowerCase());
      if (!targetCatObj) {
        targetCatObj = { name: targetCategory, items: [] };
        updated.push(targetCatObj);
      }
      targetCatObj.items.push({ ...item });
      return updated;
    });

    toast.success(`Updated "${item.name}"`);
    setEditingDish(null);
  };

  // Regeneration of single description
  const handleRegenerateDescription = async (catIndex: number, itemIndex: number, dishName: string) => {
    try {
      const res = await quickSetupApi.generateDescription(dishName);
      if (res.description) {
        setCategories((prev) => {
          const updated = [...prev];
          updated[catIndex].items[itemIndex].description = res.description;
          return updated;
        });
        toast.success('Generated new dish description!');
      }
    } catch (e) {
      toast.error('Failed to regenerate description');
    }
  };

  // Regeneration or change of dish image
  const handleRegenerateImage = async (catIndex: number, itemIndex: number, dishName: string) => {
    try {
      toast.info('Fetching food photo...');
      const res = await quickSetupApi.findDishImage(dishName);
      if (res?.imageUrl) {
        setCategories((prev) => {
          const updated = [...prev];
          updated[catIndex].items[itemIndex].imageUrl = res.imageUrl;
          return updated;
        });
        toast.success('Updated dish photo!');
      }
    } catch (e) {
      toast.error('Failed to change photo');
    }
  };

  // Submit quick setup to backend
  const handleFinalSubmit = async () => {
    if (!restaurantName.trim()) {
      toast.error('Please enter a restaurant name in Step 1');
      setCurrentStep(1);
      return;
    }

    const numericTablesCount =
      typeof tablesCount === 'number' && tablesCount > 0
        ? tablesCount
        : parseInt(String(tablesCount), 10) || 10;

    try {
      setIsSubmitting(true);
      const res = await quickSetupApi.submitQuickSetup({
        restaurantName: restaurantName.trim(),
        currency,
        serviceType,
        tablesCount: numericTablesCount,
        staffName: staffName.trim() || undefined,
        staffEmail: staffEmail.trim() || undefined,
        staffPassword: staffPassword.trim() || undefined,
        staffRole,
        staffPin: staffPin.trim() || undefined,
        categories,
      });

      if (res?.branch?.id) {
        saveStandeeDesign(res.branch.id, {
          template,
          selectedTheme,
          dotPattern,
          eyePattern,
          shape,
          centerIcon,
        });
      }

      setSetupResult(res);
      toast.success('Your storefront is live!');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete quick setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-border bg-surface-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-text">5-Minute Storefront Setup</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  ⚡ Live in 5 mins
                </span>
              </div>
              <p className="text-xs text-muted">
                Step {currentStep} of 4 — Fast-track setup for cafés, food stalls & restaurants
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold">
              <Gift className="w-3.5 h-3.5" />
              100 Free Credits Included
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-muted hover:text-text text-sm p-1.5 rounded-lg hover:bg-surface"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 border-b border-border text-xs font-medium bg-surface">
          {[
            { step: 1, label: 'Profile' },
            { step: 2, label: 'Menu & AI' },
            { step: 3, label: 'Staff PIN' },
            { step: 4, label: 'Tables & QR' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => (setupResult ? setCurrentStep(item.step) : item.step < currentStep && setCurrentStep(item.step))}
              className={`py-2.5 px-1 sm:px-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                currentStep === item.step
                  ? 'border-primary text-primary font-bold bg-primary/5'
                  : currentStep > item.step
                  ? 'border-emerald-500 text-emerald-600 font-medium'
                  : 'border-transparent text-muted opacity-60'
              }`}
            >
              {currentStep > item.step ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center border border-current">
                  {item.step}
                </span>
              )}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Profile & Free Credits */}
          {currentStep === 1 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center gap-3">
                <Gift className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-text">100 Free Orders Credited to Your Account</h4>
                  <p className="text-xs text-muted">
                    No credit card required. 1 confirmed order = 1 credit (~$0.01 / ~₹0.30). Credits never expire!
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                    Restaurant / Outlet Name *
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g. Chai Junction, Mario's Pizzeria, Food Truck Express"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium"
                    >
                      <option value="INR">₹ INR (India)</option>
                      <option value="USD">$ USD (Global)</option>
                      <option value="PHP">₱ PHP (Philippines)</option>
                      <option value="MYR">RM MYR (Malaysia)</option>
                      <option value="EUR">€ EUR (Europe)</option>
                      <option value="GBP">£ GBP (UK)</option>
                      <option value="SGD">S$ SGD (Singapore)</option>
                      <option value="AED">AED (UAE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                      Service Type
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium"
                    >
                      <option value="BOTH">Dine-in & Takeaway (Both)</option>
                      <option value="DINE_IN">Dine-in Only (Tables)</option>
                      <option value="TAKEAWAY">Takeaway / Counter Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Menu & AI Import */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Dynamic AI Upload & Progress Zone */}
              {isUploadingMenu ? (
                <div className="p-6 rounded-2xl border-2 border-primary/40 bg-primary/5 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs font-bold text-text">
                    <span className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4 animate-spin text-primary" />
                      {uploadProgressText}
                    </span>
                    <span className="text-primary font-mono text-sm font-black">{uploadProgress}%</span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-primary/20 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-amber-500 to-emerald-500 rounded-full transition-all duration-500 ease-out shadow-sm"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  {/* Multi-Step Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
                    <div
                      className={`p-2.5 rounded-xl border text-[11px] transition-all ${
                        uploadStepIndex >= 1
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'border-border bg-surface text-muted'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {uploadStepIndex > 1 ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 animate-pulse text-primary" />
                        )}
                        <span>1. Upload Menu</span>
                      </div>
                      <p className="text-[10px] text-muted">File received & pre-processed</p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-[11px] transition-all ${
                        uploadStepIndex >= 2
                          ? uploadStepIndex > 2
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'border-primary/40 bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                          : 'border-border bg-surface text-muted'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {uploadStepIndex > 2 ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : uploadStepIndex === 2 ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-muted inline-block" />
                        )}
                        <span>2. Scan & Extract</span>
                      </div>
                      <p className="text-[10px] text-muted">Dishes, sections & prices</p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-[11px] transition-all ${
                        uploadStepIndex >= 3
                          ? uploadStepIndex >= 4
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'border-primary/40 bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                          : 'border-border bg-surface text-muted'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {uploadStepIndex >= 4 ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : uploadStepIndex === 3 ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-muted inline-block" />
                        )}
                        <span>3. Descriptions & Photos</span>
                      </div>
                      <p className="text-[10px] text-muted">Gourmet imagery & copywriting</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* PWA Mobile Camera Capture + File Upload Zone */
                <div className="p-6 border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl bg-primary/5 text-center transition-all space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-inner">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text">Digitize Your Restaurant Menu with AI</h4>
                    <p className="text-xs text-muted max-w-md mx-auto mt-1">
                      Take a picture of your paper menu or upload a PDF/Image. Smart AI extracts categories, dish names, prices, and matches food photography automatically!
                    </p>
                  </div>

                  {/* Dual Mobile PWA Buttons: Camera Capture + File Upload */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-1">
                    {/* 1. Camera Capture (Mobile Camera via capture="environment") */}
                    <input
                      type="file"
                      id="camera-capture-input"
                      accept="image/*,application/pdf,application/json,text/plain,text/csv,.jpg,.jpeg,.png,.webp,.avif,.pdf,.json,.csv,.txt"
                      capture="environment"
                      onChange={handleMenuUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="camera-capture-input"
                      className="w-full sm:w-auto flex-1 cursor-pointer flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Menu Photo</span>
                    </label>

                    {/* 2. File / PDF / JSON Upload */}
                    <input
                      type="file"
                      id="menu-file-upload"
                      accept="image/*,application/pdf,application/json,text/plain,text/csv,.jpg,.jpeg,.png,.webp,.avif,.pdf,.json,.csv,.txt"
                      onChange={handleMenuUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="menu-file-upload"
                      className="w-full sm:w-auto flex-1 cursor-pointer flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-surface text-text hover:bg-surface-2 font-semibold text-xs shadow-sm transition-all active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload File / PDF / JSON</span>
                    </label>
                  </div>

                  <p className="text-[11px] text-muted">
                    Supported formats: JPG, PNG, AVIF, WEBP, PDF, JSON, CSV, TXT • Clear, well-lit photos work best
                  </p>
                </div>
              )}

              {/* Menu Categories Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-primary" />
                    Menu Categories & Dishes ({categories.reduce((acc, c) => acc + c.items.length, 0)} items)
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setCategories((prev) => [
                        ...prev,
                        {
                          name: `New Category ${prev.length + 1}`,
                          items: [
                            {
                              name: 'New Dish',
                              price: 50,
                              description: 'Freshly prepared specialty dish.',
                              imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
                            },
                          ],
                        },
                      ])
                    }
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Category
                  </button>
                </div>

                {categories.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-3 bg-surface-2/40">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">No Menu Categories Added Yet</p>
                      <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                        Snap a photo or upload your menu file above to auto-populate dishes, or click below to start manually.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCategories([
                          {
                            name: 'Starters',
                            items: [
                              {
                                name: 'Special Item',
                                price: 100,
                                description: 'Freshly prepared specialty dish.',
                                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
                              },
                            ],
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Category Manually
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((cat, cIdx) => (
                      <div key={cIdx} className="p-4 rounded-xl border border-border bg-surface-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => {
                              const updated = [...categories];
                              updated[cIdx].name = e.target.value;
                              setCategories(updated);
                            }}
                            className="font-bold text-sm text-text bg-transparent border-b border-border/50 focus:border-primary focus:outline-none px-1"
                          />
                          <button
                            type="button"
                            onClick={() => setCategories(categories.filter((_, i) => i !== cIdx))}
                            className="text-muted hover:text-danger text-xs p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {cat.items.map((dish, dIdx) => (
                            <div
                              key={dIdx}
                              className="p-3 rounded-lg border border-border bg-surface flex gap-3 items-start shadow-sm"
                            >
                              <div className="relative group/img flex-shrink-0">
                                <img
                                  src={dish.imageUrl || DEFAULT_FALLBACK_IMG}
                                  alt={dish.name}
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (!target.src.includes('photo-1504674900247-0877df9cc836')) {
                                      target.src = DEFAULT_FALLBACK_IMG;
                                    }
                                  }}
                                  className="w-16 h-16 rounded-lg object-cover bg-surface-2 flex-shrink-0 cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
                                  onClick={() => handleRegenerateImage(cIdx, dIdx, dish.name)}
                                  title="Click to change photo"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRegenerateImage(cIdx, dIdx, dish.name)}
                                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded-lg text-[9px] font-semibold transition-opacity"
                                >
                                  Change
                                </button>
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <input
                                    type="text"
                                    value={dish.name}
                                    onChange={(e) => {
                                      const updated = [...categories];
                                      updated[cIdx].items[dIdx].name = e.target.value;
                                      setCategories(updated);
                                    }}
                                    className="font-semibold text-xs text-text bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none w-full"
                                  />
                                  <div className="flex items-center gap-0.5 text-xs font-bold text-primary">
                                    <span>{currency === 'INR' ? '₹' : '$'}</span>
                                    <input
                                      type="number"
                                      value={dish.price}
                                      onChange={(e) => {
                                        const updated = [...categories];
                                        updated[cIdx].items[dIdx].price = Number(e.target.value) || 0;
                                        setCategories(updated);
                                      }}
                                      className="w-14 bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-right"
                                    />
                                  </div>
                                </div>
                                <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                                  {dish.description}
                                </p>
                                <div className="flex items-center justify-between pt-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingDish({
                                          catIndex: cIdx,
                                          itemIndex: dIdx,
                                          item: { ...dish },
                                          targetCategory: cat.name,
                                        })
                                      }
                                      className="px-2 py-0.5 rounded-md border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 flex items-center gap-1 transition-colors"
                                    >
                                      <Pencil className="w-2.5 h-2.5" /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRegenerateDescription(cIdx, dIdx, dish.name)}
                                      className="text-[10px] text-muted hover:text-text flex items-center gap-1 font-medium"
                                    >
                                      <RefreshCw className="w-2.5 h-2.5" /> Desc
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRegenerateImage(cIdx, dIdx, dish.name)}
                                      className="text-[10px] text-muted hover:text-text flex items-center gap-1 font-medium"
                                    >
                                      <ImageIcon className="w-2.5 h-2.5" /> Photo
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...categories];
                                      updated[cIdx].items = updated[cIdx].items.filter((_, i) => i !== dIdx);
                                      setCategories(updated);
                                    }}
                                    className="text-muted hover:text-danger text-[10px]"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Staff & PIN */}
          {currentStep === 3 && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-text">Assign Staff & Credentials</h3>
                <p className="text-xs text-muted">
                  Staff can log into the owner portal via email & password, or switch quickly on counter & kitchen screens using a 4-digit PIN.
                </p>
              </div>

              <div className="space-y-4 p-5 rounded-xl border border-border bg-surface-2">
                <div>
                  <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                    Staff Name / Shift Label *
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Cashier Counter 1, Kitchen Master"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium"
                  />
                </div>

                {/* Email and Password Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                      Staff Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="e.g. staff@restaurant.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                      Staff Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="e.g. 6+ characters"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                      Role
                    </label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-medium"
                    >
                      <option value="CASHIER">Cashier (Confirm Orders)</option>
                      <option value="KITCHEN">Kitchen Chef (KDS View)</option>
                      <option value="MANAGER">Store Manager (Full)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                      4-Digit Terminal PIN *
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1234"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-mono tracking-widest text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Tables & Instant QR Code Studio */}
          {currentStep === 4 && (() => {
            const cleanSlug =
              restaurantName
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '') || 'demo';

            const totalTables =
              typeof tablesCount === 'number' && tablesCount > 0
                ? tablesCount
                : parseInt(String(tablesCount), 10) || 1;

            const activeTableNum = Math.max(1, Math.min(previewTableNum, totalTables));
            const qrPreviewUrl = getCustomerStorefrontUrl(
              cleanSlug,
              showTableNumber ? activeTableNum : undefined,
            );

            const currentTheme = THEME_CONFIGS[selectedTheme] || THEME_CONFIGS.terracotta;

            const TEMPLATE_OPTIONS: { id: StandTemplate; name: string; desc: string; icon: string }[] = [
              {
                id: 'brand',
                name: 'Signature Standee',
                desc: 'Classic branded table tent with table badge',
                icon: '🏕️',
              },
              {
                id: 'acrylic',
                name: 'Minimal Acrylic',
                desc: 'Crisp clean border for modern tables',
                icon: '🤍',
              },
              {
                id: 'luxury',
                name: 'Gold Luxe',
                desc: 'Dark theme for fine dining & lounges',
                icon: '🖤',
              },
              {
                id: 'badge',
                name: 'Circular Disc',
                desc: 'Round table badge for bistro discs',
                icon: '🔘',
              },
            ];

            const THEME_OPTIONS: ColorTheme[] = [
              'terracotta',
              'crimson',
              'emerald',
              'slate',
              'navy',
              'mono',
            ];

            const CENTER_ICONS: { id: CenterIconType; label: string; icon: string }[] = [
              { id: 'cutlery', label: 'Cutlery', icon: '🍴' },
              { id: 'coffee', label: 'Coffee', icon: '☕' },
              { id: 'pizza', label: 'Pizza', icon: '🍕' },
              { id: 'bar', label: 'Bar', icon: '🍷' },
              { id: 'none', label: 'None', icon: '🚫' },
            ];

            return (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-text">
                    Table QR Codes & Standee Design Studio
                  </h3>
                  <p className="text-xs text-muted max-w-lg mx-auto">
                    Customize your table tent design and table count. QR codes are permanent and link directly to your customer storefront.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Settings & Styles (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Section 1: Number of Tables */}
                    <div className="p-4 rounded-xl border border-border bg-surface-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary" /> Number of Tables to Generate
                        </label>
                        <span className="text-xs text-muted font-medium">1 to 200 tables</span>
                      </div>

                      {/* Stepper + Free-type Input */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const cur =
                              typeof tablesCount === 'number'
                                ? tablesCount
                                : parseInt(String(tablesCount), 10) || 1;
                            setTablesCount(Math.max(1, cur - 1));
                          }}
                          className="w-10 h-10 rounded-xl border border-border bg-surface text-text hover:bg-surface-2 flex items-center justify-center font-bold text-lg transition-colors shadow-sm"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={tablesCount}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setTablesCount(val === '' ? '' : parseInt(val, 10));
                          }}
                          onBlur={() => {
                            if (tablesCount === '' || Number(tablesCount) < 1) {
                              setTablesCount(1);
                            } else if (Number(tablesCount) > 200) {
                              setTablesCount(200);
                            }
                          }}
                          placeholder="Tables"
                          className="flex-1 h-10 px-3 rounded-xl border border-border bg-surface text-center font-bold text-base text-text focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const cur =
                              typeof tablesCount === 'number'
                                ? tablesCount
                                : parseInt(String(tablesCount), 10) || 1;
                            setTablesCount(Math.min(200, cur + 1));
                          }}
                          className="w-10 h-10 rounded-xl border border-border bg-surface text-text hover:bg-surface-2 flex items-center justify-center font-bold text-lg transition-colors shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Preset Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] text-muted mr-1 font-medium">Quick tap:</span>
                        {[5, 10, 15, 20, 30, 50].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setTablesCount(num)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              tablesCount === num
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-surface border-border text-text hover:border-primary/50'
                            }`}
                          >
                            {num} Tables
                          </button>
                        ))}
                      </div>

                      {/* Table Number Toggle */}
                      <label className="flex items-center gap-2 pt-2 border-t border-border/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showTableNumber}
                          onChange={(e) => setShowTableNumber(e.target.checked)}
                          className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
                        />
                        <span className="text-xs text-text font-medium">
                          Print dynamic table number on standees (e.g. Table 01)
                        </span>
                      </label>
                    </div>

                    {/* Section 2: Standee Template Selection */}
                    <div className="p-4 rounded-xl border border-border bg-surface-2 space-y-3">
                      <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-primary" /> Select Standee Design Template
                      </label>

                      <div className="grid grid-cols-2 gap-2.5">
                        {TEMPLATE_OPTIONS.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setTemplate(tpl.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              template === tpl.id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm'
                                : 'border-border bg-surface hover:border-border/80'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-base">{tpl.icon}</span>
                              {template === tpl.id && (
                                <Check className="w-3.5 h-3.5 text-primary font-bold" />
                              )}
                            </div>
                            <span className="block text-xs font-bold text-text">{tpl.name}</span>
                            <span className="block text-[10px] text-muted line-clamp-1">
                              {tpl.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section 3: Color Theme Selection */}
                    <div className="p-4 rounded-xl border border-border bg-surface-2 space-y-2.5">
                      <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                        Culinary Color Theme
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {THEME_OPTIONS.map((thm) => {
                          const conf = THEME_CONFIGS[thm];
                          return (
                            <button
                              key={thm}
                              type="button"
                              onClick={() => setSelectedTheme(thm)}
                              className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                                selectedTheme === thm
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm'
                                  : 'border-border bg-surface hover:border-border/80'
                              }`}
                            >
                              <div
                                className="w-6 h-6 rounded-full shadow-sm"
                                style={{ backgroundColor: conf.primaryColor }}
                              />
                              <span className="text-[10px] font-bold text-text leading-tight truncate w-full">
                                {conf.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 4: QR Pattern & Center Icon */}
                    <div className="p-4 rounded-xl border border-border bg-surface-2 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-text uppercase tracking-wider block mb-1.5">
                            Center Emblem
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {CENTER_ICONS.map((ic) => (
                              <button
                                key={ic.id}
                                type="button"
                                onClick={() => setCenterIcon(ic.id)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all ${
                                  centerIcon === ic.id
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-surface border-border text-text hover:border-primary/50'
                                }`}
                              >
                                <span>{ic.icon}</span>
                                <span className="text-[10px]">{ic.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-text uppercase tracking-wider block mb-1.5">
                            QR Dot Style
                          </label>
                          <div className="flex items-center gap-1.5">
                            {(['dots', 'squares', 'rounded'] as QRDotPattern[]).map((pat) => (
                              <button
                                key={pat}
                                type="button"
                                onClick={() => setDotPattern(pat)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border transition-all ${
                                  dotPattern === pat
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-surface border-border text-text hover:border-primary/50'
                                }`}
                              >
                                {pat}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Storefront URL Preview */}
                    <div className="p-3 rounded-xl border border-border bg-surface flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <span className="text-muted block text-[10px]">Storefront URL</span>
                        <span className="font-mono font-bold text-text truncate">
                          {CUSTOMER_APP_URL}/r/{cleanSlug}
                        </span>
                      </div>
                      <a
                        href={`${CUSTOMER_APP_URL}/r/${cleanSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 whitespace-nowrap text-xs font-semibold"
                      >
                        Preview <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Right Column: Live Standee Preview (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <div className="w-full text-center mb-2">
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                        Live Standee Preview
                      </span>
                    </div>

                    {/* Dynamic Standee Card Frame matching TableQrModal */}
                    <div className="w-full flex justify-center transition-all duration-300">
                      {/* Template 1: Signature Standee (brand) */}
                      {template === 'brand' && (
                        <div
                          className={`w-[270px] sm:w-[290px] rounded-3xl p-5 ${currentTheme.cardBg} ${currentTheme.borderGlow} text-white flex flex-col items-center justify-between text-center transition-all duration-300 relative overflow-hidden shadow-2xl`}
                        >
                          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-lg pointer-events-none" />
                          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-black/20 blur-lg pointer-events-none" />

                          <div className="space-y-1 w-full relative z-10">
                            {showTableNumber && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 text-white font-black text-xs tracking-wider uppercase border border-white/30 shadow-xs mb-0.5">
                                {centerIcon !== 'none' && <span>{getCenterIconEmoji(centerIcon)}</span>}
                                <span>Table {activeTableNum < 10 ? `0${activeTableNum}` : activeTableNum}</span>
                              </div>
                            )}

                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                              WELCOME & DINE-IN
                            </div>

                            <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight drop-shadow-xs line-clamp-1">
                              {restaurantName || 'Restaurant Name'}
                            </h3>
                            <p className="text-[10px] text-white/80 font-medium leading-none line-clamp-1">
                              Scan to Order & Pay
                            </p>
                          </div>

                          <div className="my-3.5 p-3 bg-white shadow-2xl relative flex items-center justify-center rounded-2xl">
                            <StylizedQRCode
                              value={qrPreviewUrl}
                              dotPattern={dotPattern}
                              eyePattern={eyePattern}
                              shape={shape}
                              color1={currentTheme.qrGradient.color1}
                              color2={currentTheme.qrGradient.color2}
                              excavateCenter={centerIcon !== 'none'}
                              className="w-[155px] h-[155px]"
                            />
                            {centerIcon !== 'none' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                  className="w-10 h-10 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-base"
                                  style={{ borderColor: currentTheme.primaryColor }}
                                >
                                  {getCenterIconEmoji(centerIcon)}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5 relative z-10">
                            <div className="text-[11px] font-extrabold uppercase tracking-widest text-white drop-shadow-xs">
                              SCAN FOR DIGITAL MENU
                            </div>
                            <p className="text-[9px] text-white/80 font-medium">
                              Point phone camera • Instant live ordering
                            </p>
                            <div className="pt-1">
                              <span className="font-mono text-[8px] text-white/70 bg-black/20 px-2 py-0.5 rounded-md truncate inline-block max-w-[220px]">
                                /r/{cleanSlug}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Template 2: Minimal Acrylic (acrylic) */}
                      {template === 'acrylic' && (
                        <div className="w-[270px] sm:w-[290px] rounded-2xl bg-white text-zinc-900 shadow-2xl border border-zinc-200 flex flex-col overflow-hidden">
                          <div className={`p-3.5 ${currentTheme.cardBg} text-white text-center space-y-0.5`}>
                            <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">
                              Dine-In Storefront
                            </span>
                            <h3 className="text-base font-black tracking-tight leading-tight line-clamp-1">
                              {restaurantName || 'Restaurant Name'}
                            </h3>
                            {showTableNumber && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white font-black text-[10px] tracking-wider uppercase">
                                {centerIcon !== 'none' && <span>{getCenterIconEmoji(centerIcon)}</span>}
                                <span>Table {activeTableNum < 10 ? `0${activeTableNum}` : activeTableNum}</span>
                              </span>
                            )}
                          </div>

                          <div className="p-3 my-1 flex items-center justify-center relative">
                            <StylizedQRCode
                              value={qrPreviewUrl}
                              dotPattern={dotPattern}
                              eyePattern={eyePattern}
                              shape={shape}
                              color1={currentTheme.qrGradient.color1}
                              color2={currentTheme.qrGradient.color2}
                              excavateCenter={centerIcon !== 'none'}
                              className="w-[155px] h-[155px]"
                            />
                            {centerIcon !== 'none' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                  className="w-10 h-10 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-base"
                                  style={{ borderColor: currentTheme.primaryColor }}
                                >
                                  {getCenterIconEmoji(centerIcon)}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="px-3 pb-3 pt-1 space-y-1 text-left text-[10px] font-medium text-zinc-600 bg-zinc-50 border-t border-zinc-100">
                            <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                              <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">1</span>
                              <span>Scan QR with phone camera</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">2</span>
                              <span>Browse dishes & select</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">3</span>
                              <span>Direct kitchen dispatch</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Template 3: Gold Luxe (luxury) */}
                      {template === 'luxury' && (
                        <div className="w-[270px] sm:w-[290px] rounded-3xl p-5 bg-zinc-950 text-white flex flex-col items-center justify-between text-center border-2 border-amber-600/70 shadow-2xl relative overflow-hidden">
                          <div className="space-y-1 w-full relative z-10 pt-1">
                            <span className="text-[9px] tracking-widest uppercase text-amber-300/80 font-serif">
                              Carte du Jour • Fine Dining
                            </span>
                            <h3 className="text-lg font-serif font-bold text-amber-100 tracking-wide line-clamp-1">
                              {restaurantName || 'Restaurant Name'}
                            </h3>
                            {showTableNumber && (
                              <div className="inline-block px-3 py-0.5 border-y border-amber-400/50 text-amber-200 font-serif font-bold text-xs tracking-widest uppercase my-0.5">
                                {centerIcon !== 'none' && <span className="mr-1">{getCenterIconEmoji(centerIcon)}</span>}
                                <span>Table {activeTableNum < 10 ? `0${activeTableNum}` : activeTableNum}</span>
                              </div>
                            )}
                            <p className="text-[10px] text-amber-200/70 font-serif truncate">
                              Digital Storefront & Table Service
                            </p>
                          </div>

                          <div className="my-3.5 p-3 bg-white shadow-xl relative flex items-center justify-center border-2 border-amber-500/60 rounded-2xl">
                            <StylizedQRCode
                              value={qrPreviewUrl}
                              dotPattern={dotPattern}
                              eyePattern={eyePattern}
                              shape={shape}
                              color1={currentTheme.qrGradient.color1}
                              color2={currentTheme.qrGradient.color2}
                              excavateCenter={centerIcon !== 'none'}
                              className="w-[155px] h-[155px]"
                            />
                            {centerIcon !== 'none' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-10 h-10 rounded-full bg-white border-2 border-amber-600 shadow-sm flex items-center justify-center text-base">
                                  {getCenterIconEmoji(centerIcon)}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5 relative z-10 pb-1">
                            <div className="text-[11px] font-serif font-bold text-amber-200 uppercase tracking-widest">
                              Scan for Digital Menu
                            </div>
                            <p className="text-[9px] text-amber-100/70">Point phone camera to order</p>
                          </div>
                        </div>
                      )}

                      {/* Template 4: Circular Disc (badge) */}
                      {template === 'badge' && (
                        <div
                          className="w-[260px] h-[260px] rounded-full p-5 bg-white text-zinc-900 shadow-2xl border-6 flex flex-col items-center justify-between text-center relative overflow-hidden"
                          style={{ borderColor: currentTheme.primaryColor }}
                        >
                          <div className="space-y-0.5 pt-1">
                            <span
                              className="text-[10px] font-black uppercase tracking-wider truncate max-w-[190px] block"
                              style={{ color: currentTheme.primaryColor }}
                            >
                              {restaurantName || 'Restaurant Name'}
                            </span>
                            {showTableNumber && (
                              <span
                                className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                                style={{
                                  backgroundColor: `${currentTheme.primaryColor}15`,
                                  color: currentTheme.primaryColor,
                                }}
                              >
                                {centerIcon !== 'none' && <span>{getCenterIconEmoji(centerIcon)}</span>}
                                <span>Table {activeTableNum < 10 ? `0${activeTableNum}` : activeTableNum}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-center relative my-1">
                            <StylizedQRCode
                              value={qrPreviewUrl}
                              dotPattern={dotPattern}
                              eyePattern={eyePattern}
                              shape={shape}
                              color1={currentTheme.qrGradient.color1}
                              color2={currentTheme.qrGradient.color2}
                              excavateCenter={centerIcon !== 'none'}
                              className="w-[135px] h-[135px]"
                            />
                            {centerIcon !== 'none' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                  className="w-8 h-8 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-sm"
                                  style={{ borderColor: currentTheme.primaryColor }}
                                >
                                  {getCenterIconEmoji(centerIcon)}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pb-1 text-[8px] font-extrabold uppercase tracking-widest text-zinc-600">
                            Touchless Ordering
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Table Stepper Preview */}
                    {showTableNumber && totalTables > 1 && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted">
                        <button
                          type="button"
                          onClick={() => setPreviewTableNum((p) => Math.max(1, p - 1))}
                          disabled={activeTableNum <= 1}
                          className="px-2 py-0.5 rounded bg-surface border border-border hover:bg-surface-2 disabled:opacity-40"
                        >
                          ←
                        </button>
                        <span className="font-medium text-text">
                          Previewing Table {activeTableNum} of {totalTables}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewTableNum((p) => Math.min(totalTables, p + 1))}
                          disabled={activeTableNum >= totalTables}
                          className="px-2 py-0.5 rounded bg-surface border border-border hover:bg-surface-2 disabled:opacity-40"
                        >
                          →
                        </button>
                      </div>
                    )}

                    {/* Print Standees Button */}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="mt-3 text-xs text-primary font-semibold flex items-center gap-1.5 hover:underline py-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Table Standees
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-6 border-t border-border bg-surface-2 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s - 1)}
              className="px-4 py-2 rounded-xl border border-border text-text font-semibold text-xs hover:bg-surface flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && !restaurantName.trim()) {
                  toast.error('Please enter a restaurant name');
                  return;
                }
                setCurrentStep((s) => s + 1);
              }}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 flex items-center gap-1.5 ml-auto cursor-pointer"
            >
              Continue to Step {currentStep + 1} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg hover:bg-emerald-700 flex items-center gap-1.5 ml-auto disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Storefront...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Launch Storefront in 5 Mins
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Edit Dish Modal */}
      {editingDish && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-5 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text">Edit Dish Details</h4>
                  <p className="text-[11px] text-muted">Customize name, price, category, photo & description</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Name & Price */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    value={editingDish.item.name}
                    onChange={(e) =>
                      setEditingDish({
                        ...editingDish,
                        item: { ...editingDish.item, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Price ({currency === 'INR' ? '₹' : '$'}) *
                  </label>
                  <input
                    type="number"
                    value={editingDish.item.price}
                    onChange={(e) =>
                      setEditingDish({
                        ...editingDish,
                        item: { ...editingDish.item, price: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Category
                </label>
                <select
                  value={editingDish.targetCategory}
                  onChange={(e) =>
                    setEditingDish({ ...editingDish, targetCategory: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {categories.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description + AI Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Description
                  </label>
                  <button
                    type="button"
                    disabled={isRegeneratingEditDesc}
                    onClick={async () => {
                      try {
                        setIsRegeneratingEditDesc(true);
                        const res = await quickSetupApi.generateDescription(
                          editingDish.item.name,
                          editingDish.targetCategory,
                        );
                        if (res?.description) {
                          setEditingDish({
                            ...editingDish,
                            item: { ...editingDish.item, description: res.description },
                          });
                          toast.success('Generated new description!');
                        }
                      } catch (e) {
                        toast.error('Failed to generate description');
                      } finally {
                        setIsRegeneratingEditDesc(false);
                      }
                    }}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    {isRegeneratingEditDesc ? (
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-primary" />
                    )}
                    AI Rewrite Description
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={editingDish.item.description}
                  onChange={(e) =>
                    setEditingDish({
                      ...editingDish,
                      item: { ...editingDish.item, description: e.target.value },
                    })
                  }
                  placeholder="Appetizing 1-sentence food description..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Food Photo Preview + Change */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                  Dish Photo
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-2">
                  <img
                    src={editingDish.item.imageUrl || DEFAULT_FALLBACK_IMG}
                    alt={editingDish.item.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMG;
                    }}
                    className="w-14 h-14 rounded-lg object-cover bg-surface shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    <button
                      type="button"
                      disabled={isChangingEditPhoto}
                      onClick={async () => {
                        try {
                          setIsChangingEditPhoto(true);
                          const res = await quickSetupApi.findDishImage(editingDish.item.name);
                          if (res?.imageUrl) {
                            setEditingDish({
                              ...editingDish,
                              item: { ...editingDish.item, imageUrl: res.imageUrl },
                            });
                            toast.success('Updated dish photo!');
                          }
                        } catch (e) {
                          toast.error('Failed to change photo');
                        } finally {
                          setIsChangingEditPhoto(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-2 text-text text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      {isChangingEditPhoto ? (
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      ) : (
                        <RefreshCw className="w-3 h-3 text-primary" />
                      )}
                      Find New Photo with AI
                    </button>
                    <input
                      type="text"
                      value={editingDish.item.imageUrl || ''}
                      onChange={(e) =>
                        setEditingDish({
                          ...editingDish,
                          item: { ...editingDish.item, imageUrl: e.target.value },
                        })
                      }
                      placeholder="Or paste direct image URL..."
                      className="w-full px-2.5 py-1 rounded-md border border-border bg-surface text-[10px] text-text font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-text hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedDish}
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
