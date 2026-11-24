import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Loader2,
  Trash2,
  Plus,
  RefreshCw,
  X,
  Check,
  ChefHat,
  Store,
  Image as ImageIcon,
  Camera,
  Pencil,
} from 'lucide-react';
import { quickSetupApi, type MenuCategory, type MenuItem } from '../../quick-setup/api/quickSetupApi';
import { toast, Button } from '../../../components/ui';
import type { Restaurant } from '@instant-qr/shared-types';

const DEFAULT_FALLBACK_IMG =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80';

const cleanCategories = (cats: MenuCategory[]): MenuCategory[] => {
  return cats.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => {
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

interface AiMenuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurants: Restaurant[];
  defaultRestaurantId?: string;
}

export const AiMenuImportModal: React.FC<AiMenuImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  restaurants,
  defaultRestaurantId,
}) => {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    defaultRestaurantId || (restaurants[0]?.id ?? ''),
  );
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepIndex, setUploadStepIndex] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Dish Modal State
  const [editingDish, setEditingDish] = useState<{
    catIndex: number;
    itemIndex: number;
    item: MenuItem;
    targetCategory: string;
  } | null>(null);
  const [isRegeneratingEditDesc, setIsRegeneratingEditDesc] = useState(false);
  const [isChangingEditPhoto, setIsChangingEditPhoto] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    try {
      setIsUploading(true);
      setUploadProgress(15);
      setUploadStepIndex(1);
      setUploadText('Uploading menu photo & preparing analysis...');

      const t1 = setTimeout(() => {
        setUploadProgress(45);
        setUploadStepIndex(2);
        setUploadText('Smart AI scanning dishes, sections & prices...');
      }, 600);

      const t2 = setTimeout(() => {
        setUploadProgress(80);
        setUploadStepIndex(3);
        setUploadText('Crafting appetizing descriptions & pairing food photos...');
      }, 1800);

      const response = await quickSetupApi.importMenuFile(file);

      clearTimeout(t1);
      clearTimeout(t2);

      setUploadProgress(100);
      setUploadStepIndex(4);
      setUploadText('Menu extracted successfully!');

      if (response?.categories && response.categories.length > 0) {
        setTimeout(() => {
          setCategories(cleanCategories(response.categories));
          setIsUploading(false);
          setUploadProgress(0);
          toast.success(`Extracted ${response.categories.length} categories!`);
        }, 400);
      } else {
        setIsUploading(false);
        setUploadProgress(0);
        toast.error('No menu items found. Please try another photo.');
      }
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error(err.message || 'AI extraction failed.');
    }
  };

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

      if (currentCat && currentCat.name === targetCategory) {
        updated[catIndex].items[itemIndex] = { ...item };
        return updated;
      }

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

  const handleRegenerateDescription = async (cIdx: number, dIdx: number, dishName: string) => {
    try {
      const res = await quickSetupApi.generateDescription(dishName);
      if (res.description) {
        setCategories((prev) => {
          const updated = [...prev];
          updated[cIdx].items[dIdx].description = res.description;
          return updated;
        });
        toast.success('Generated new description!');
      }
    } catch (e) {
      toast.error('Failed to regenerate description');
    }
  };

  const handleRegenerateImage = async (cIdx: number, dIdx: number, dishName: string) => {
    try {
      toast.info('Fetching food photo...');
      const res = await quickSetupApi.findDishImage(dishName);
      if (res?.imageUrl) {
        setCategories((prev) => {
          const updated = [...prev];
          updated[cIdx].items[dIdx].imageUrl = res.imageUrl;
          return updated;
        });
        toast.success('Updated dish photo!');
      }
    } catch (e) {
      toast.error('Failed to change photo');
    }
  };

  const handleSaveToMenu = async () => {
    if (!selectedRestaurantId) {
      toast.error('Please select a restaurant concept');
      return;
    }
    if (categories.length === 0) {
      toast.error('No items to import. Upload a menu first.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await quickSetupApi.bulkImportToConcept(selectedRestaurantId, categories);
      toast.success(res.message || 'Menu imported successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to import menu items');
    } finally {
      setIsSaving(false);
    }
  };

  const totalDishes = categories.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text">AI Menu Import</h2>
              <p className="text-xs text-muted">
                Upload a paper menu photo to auto-extract dishes with descriptions & photos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Concept Selector */}
          <div>
            <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-primary" /> Target Restaurant Concept
            </label>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.defaultCurrency || 'INR'})
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic AI Upload & Progress Zone */}
          {isUploading ? (
            <div className="p-5 rounded-2xl border-2 border-primary/40 bg-primary/5 text-center space-y-3.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-bold text-text">
                <span className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-4 h-4 animate-spin text-primary" />
                  {uploadText}
                </span>
                <span className="text-primary font-mono text-sm font-black">{uploadProgress}%</span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-primary/20 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary via-amber-500 to-emerald-500 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              {/* Multi-Step Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-left">
                <div
                  className={`p-2 rounded-lg border text-[11px] transition-all ${
                    uploadStepIndex >= 1
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-border bg-surface text-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {uploadStepIndex > 1 ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Camera className="w-3 h-3 animate-pulse text-primary" />
                    )}
                    <span>1. Upload Menu</span>
                  </div>
                  <p className="text-[9px] text-muted">File received & prepped</p>
                </div>

                <div
                  className={`p-2 rounded-lg border text-[11px] transition-all ${
                    uploadStepIndex >= 2
                      ? uploadStepIndex > 2
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'border-primary/40 bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                      : 'border-border bg-surface text-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {uploadStepIndex > 2 ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : uploadStepIndex === 2 ? (
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-muted inline-block" />
                    )}
                    <span>2. Scan & Extract</span>
                  </div>
                  <p className="text-[9px] text-muted">Dishes, sections & prices</p>
                </div>

                <div
                  className={`p-2 rounded-lg border text-[11px] transition-all ${
                    uploadStepIndex >= 3
                      ? uploadStepIndex >= 4
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'border-primary/40 bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                      : 'border-border bg-surface text-muted'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {uploadStepIndex >= 4 ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : uploadStepIndex === 3 ? (
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-muted inline-block" />
                    )}
                    <span>3. Copy & Photos</span>
                  </div>
                  <p className="text-[9px] text-muted">Gourmet imagery & descriptions</p>
                </div>
              </div>
            </div>
          ) : (
            /* PWA Mobile Camera Capture + File Upload Zone */
            <div className="p-5 border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl bg-primary/5 text-center transition-all space-y-3.5">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              <div>
                <span className="text-sm font-bold text-text block">Digitize Restaurant Menu with AI</span>
                <p className="text-xs text-muted max-w-sm mx-auto mt-0.5">
                  Smart AI automatically reads dishes, extracts prices, and pairs delicious food photography.
                </p>
              </div>

              {/* Dual Mobile PWA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto">
                {/* 1. Camera Capture (Mobile) */}
                <input
                  type="file"
                  id="ai-camera-modal-upload"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="ai-camera-modal-upload"
                  className="w-full sm:w-auto flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Menu Photo</span>
                </label>

                {/* 2. File / PDF Upload */}
                <input
                  type="file"
                  id="ai-menu-page-upload"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="ai-menu-page-upload"
                  className="w-full sm:w-auto flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-text hover:bg-surface-2 font-semibold text-xs shadow-sm transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File / PDF</span>
                </label>
              </div>
            </div>
          )}

          {/* Extracted Dishes Preview */}
          {categories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-primary" /> Extracted Items ({totalDishes} dishes in{' '}
                  {categories.length} categories)
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {categories.map((cat, cIdx) => (
                  <div key={cIdx} className="p-3.5 rounded-xl border border-border bg-surface-2 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-text">{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => setCategories(categories.filter((_, i) => i !== cIdx))}
                        className="text-muted hover:text-danger text-xs p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.items.map((dish, dIdx) => (
                        <div
                          key={dIdx}
                          className="p-2.5 rounded-lg border border-border bg-surface flex gap-2.5 items-start"
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
                              className="w-12 h-12 rounded-lg object-cover bg-surface-2 flex-shrink-0 cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
                              onClick={() => handleRegenerateImage(cIdx, dIdx, dish.name)}
                              title="Click to change photo"
                            />
                            <button
                              type="button"
                              onClick={() => handleRegenerateImage(cIdx, dIdx, dish.name)}
                              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded-lg text-[8px] font-semibold transition-opacity"
                            >
                              Change
                            </button>
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-xs text-text truncate">{dish.name}</span>
                              <span className="text-xs font-bold text-primary">₹{dish.price}</span>
                            </div>
                            <p className="text-[10px] text-muted line-clamp-1">{dish.description}</p>
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
                                className="px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary text-[9px] font-bold hover:bg-primary/20 flex items-center gap-1 transition-colors"
                              >
                                <Pencil className="w-2 h-2" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRegenerateDescription(cIdx, dIdx, dish.name)}
                                className="text-[9px] text-muted hover:text-text flex items-center gap-1"
                              >
                                <RefreshCw className="w-2 h-2" /> Desc
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRegenerateImage(cIdx, dIdx, dish.name)}
                                className="text-[9px] text-muted hover:text-text flex items-center gap-1"
                              >
                                <ImageIcon className="w-2 h-2" /> Photo
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={isSaving || categories.length === 0}
            onClick={handleSaveToMenu}
            icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          >
            {isSaving ? 'Importing Dishes...' : `Import ${totalDishes} Dishes to Concept`}
          </Button>
        </div>
      </div>

      {/* Edit Dish Modal */}
      {editingDish && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-sm font-bold text-text">Edit Dish Details</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="text-muted hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
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
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                    Price (₹) *
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
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                  Category
                </label>
                <select
                  value={editingDish.targetCategory}
                  onChange={(e) =>
                    setEditingDish({ ...editingDish, targetCategory: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  {categories.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
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
                    className="text-[9px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    {isRegeneratingEditDesc ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                    ) : (
                      <Sparkles className="w-2.5 h-2.5 text-primary" />
                    )}
                    AI Rewrite
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
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                  Dish Photo
                </label>
                <div className="flex items-center gap-2.5 p-2 rounded-xl border border-border bg-surface-2">
                  <img
                    src={editingDish.item.imageUrl || DEFAULT_FALLBACK_IMG}
                    alt={editingDish.item.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMG;
                    }}
                    className="w-12 h-12 rounded-lg object-cover bg-surface flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1">
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
                      className="px-2.5 py-1 rounded-md bg-surface border border-border hover:bg-surface-2 text-text text-[11px] font-semibold flex items-center gap-1"
                    >
                      {isChangingEditPhoto ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                      ) : (
                        <RefreshCw className="w-2.5 h-2.5 text-primary" />
                      )}
                      Find Photo with AI
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
                      placeholder="Paste image URL..."
                      className="w-full px-2 py-0.5 rounded border border-border bg-surface text-[9px] text-text font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-text hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedDish}
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
