import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UtensilsCrossed,
  ArrowRight,
  X,
  AlertCircle,
  Upload,
  Trash2,
  Store,
  DollarSign,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { getMediaUrl, cn } from '../../../lib/utils';
import { useCurrencyStore } from '../../../store/useCurrencyStore';
import { SUPPORTED_CURRENCIES } from '../../../config/currencies.config';
import { branchProductsApi } from '../../branches/api/branchProductsApi';
import type { Category, Product } from '../api/menu-api';
import type { Restaurant } from '@instant-qr/shared-types';

const dishSchema = z.object({
  restaurantId: z.string().min(1, 'Please select a restaurant brand'),
  categoryId: z.string().min(1, 'Please select a menu category'),
  name: z.string().min(2, 'Dish name must be at least 2 characters long'),
  basePrice: z
    .string()
    .min(1, 'Price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Price must be a valid positive number',
    }),
  description: z.string().optional(),
});

type DishFormValues = z.infer<typeof dishSchema>;

export interface DishModalBranch {
  id: string;
  name: string;
  slug: string;
  currency?: string;
  restaurantId: string;
}

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  defaultRestaurantId?: string;
  defaultCategoryId?: string;
  categories: Category[];
  branches?: DishModalBranch[];
  initialData?: Product | null;
  onSubmit: (formData: FormData) => Promise<any>;
  onBranchUpdated?: () => void;
}

export const DishModal: React.FC<DishModalProps> = ({
  isOpen,
  onClose,
  restaurants,
  defaultRestaurantId,
  defaultCategoryId,
  categories,
  branches = [],
  initialData,
  onSubmit,
  onBranchUpdated,
}) => {
  const { currentCurrency, formatPrice } = useCurrencyStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for branch stock and price overrides when editing
  const [branchStates, setBranchStates] = useState<
    Record<string, { isAvailable: boolean; priceOverride: string | null; isSaving?: boolean }>
  >({});

  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DishFormValues>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      restaurantId: defaultRestaurantId || (restaurants[0]?.id ?? ''),
      name: '',
      categoryId: '',
      basePrice: '',
      description: '',
    },
  });

  const selectedRestaurantId = watch('restaurantId');
  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  // Filter categories to only those belonging to the selected brand
  const filteredCategories = categories.filter((c) => c.restaurantId === selectedRestaurantId);

  // Filter branches to only those belonging to the selected brand
  const relevantBranches = branches.filter((b) => b.restaurantId === selectedRestaurantId);

  // Synchronize category selection when brand changes
  useEffect(() => {
    if (filteredCategories.length > 0 && !isEditing) {
      const currentCatId = watch('categoryId');
      const exists = filteredCategories.some((c) => c.id === currentCatId);
      if (!exists) {
        setValue('categoryId', filteredCategories[0].id);
      }
    }
  }, [selectedRestaurantId, filteredCategories, isEditing, setValue, watch]);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setSelectedFile(null);

      if (initialData) {
        reset({
          restaurantId: initialData.restaurantId,
          name: initialData.name,
          categoryId: initialData.categoryId,
          basePrice: String(initialData.basePrice ?? initialData.price ?? ''),
          description: initialData.description || '',
        });
        setPreviewUrl(getMediaUrl(initialData.imageUrl));

        // Prepopulate branchStates from initialData.branchProducts
        const stateMap: Record<
          string,
          { isAvailable: boolean; priceOverride: string | null }
        > = {};

        if (initialData.branchProducts) {
          initialData.branchProducts.forEach((bp) => {
            stateMap[bp.branchId] = {
              isAvailable: bp.isAvailable,
              priceOverride: bp.priceOverride !== null ? String(bp.priceOverride) : null,
            };
          });
        }
        setBranchStates(stateMap);
      } else {
        const initialRestId = defaultRestaurantId || (restaurants[0]?.id ?? '');
        const initialCats = categories.filter((c) => c.restaurantId === initialRestId);
        reset({
          restaurantId: initialRestId,
          name: '',
          categoryId: defaultCategoryId || initialCats[0]?.id || '',
          basePrice: '',
          description: '',
        });
        setPreviewUrl(null);
        setBranchStates({});
      }
    }
  }, [isOpen, initialData, defaultRestaurantId, defaultCategoryId, restaurants, categories, reset]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setServerError('Please select a valid image (JPG, PNG, WebP, AVIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setServerError('Image size must be less than 5MB.');
      return;
    }

    setServerError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Branch Stock toggle handler
  const handleToggleBranchStock = async (branchId: string) => {
    if (!initialData) return;

    const current = branchStates[branchId] || { isAvailable: true, priceOverride: null };
    const nextStock = !current.isAvailable;

    setBranchStates((prev) => ({
      ...prev,
      [branchId]: { ...current, isAvailable: nextStock, isSaving: true },
    }));

    try {
      await branchProductsApi.toggleAvailability(branchId, initialData.id);
      setBranchStates((prev) => ({
        ...prev,
        [branchId]: { ...current, isAvailable: nextStock, isSaving: false },
      }));
      onBranchUpdated?.();
    } catch (err: any) {
      // Revert on error
      setBranchStates((prev) => ({
        ...prev,
        [branchId]: { ...current, isSaving: false },
      }));
      setServerError(err.message || 'Failed to update branch stock.');
    }
  };

  // Branch Price Override handler
  const handleSaveBranchPrice = async (branchId: string, priceStr: string) => {
    if (!initialData) return;

    const current = branchStates[branchId] || { isAvailable: true, priceOverride: null };
    const cleanNum = priceStr.trim() !== '' ? Number(priceStr) : null;

    setBranchStates((prev) => ({
      ...prev,
      [branchId]: { ...current, priceOverride: priceStr.trim() || null, isSaving: true },
    }));

    try {
      await branchProductsApi.updateOverride(branchId, initialData.id, {
        priceOverride: cleanNum,
      });
      setBranchStates((prev) => ({
        ...prev,
        [branchId]: {
          ...current,
          priceOverride: cleanNum !== null ? String(cleanNum) : null,
          isSaving: false,
        },
      }));
      onBranchUpdated?.();
    } catch (err: any) {
      setBranchStates((prev) => ({
        ...prev,
        [branchId]: { ...current, isSaving: false },
      }));
      setServerError(err.message || 'Failed to update branch price override.');
    }
  };

  const onFormSubmit = async (values: DishFormValues) => {
    setServerError(null);
    try {
      const formData = new FormData();
      formData.append('restaurantId', values.restaurantId);
      formData.append('categoryId', values.categoryId);
      formData.append('name', values.name.trim());
      formData.append('basePrice', String(Number(values.basePrice)));
      if (values.description?.trim()) {
        formData.append('description', values.description.trim());
      }
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      await onSubmit(formData);

      // Also persist all branch price overrides and stock status from modal state
      if (initialData && Object.keys(branchStates).length > 0) {
        const branchPromises = Object.entries(branchStates).map(([branchId, state]) => {
          const cleanNum =
            state.priceOverride !== null && String(state.priceOverride).trim() !== ''
              ? Number(state.priceOverride)
              : null;
          return branchProductsApi.updateOverride(branchId, initialData.id, {
            isAvailable: state.isAvailable,
            priceOverride: cleanNum,
          });
        });
        await Promise.all(branchPromises);
      }

      onBranchUpdated?.();
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to save menu dish.');
    }
  };

  // Currency resolution
  const brandCurrencyCode = selectedRestaurant?.defaultCurrency || currentCurrency.code;
  const brandCurrencyObj =
    SUPPORTED_CURRENCIES.find((c) => c.code === brandCurrencyCode) || currentCurrency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-backdrop backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={!isSubmitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-surface rounded-[14px] border border-border shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0 shadow-xs">
              <UtensilsCrossed size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-text">
                  {isEditing ? 'Edit Dish Item' : 'New Dish Item'}
                </h2>
                {selectedRestaurant && (
                  <span className="px-2 py-0.5 rounded-[6px] bg-surface-2 border border-border text-[11px] font-semibold text-text flex items-center gap-1">
                    <span>{selectedRestaurant.name}</span>
                    <span className="text-[10px] text-muted font-mono">
                      ({brandCurrencyCode} - {brandCurrencyObj.symbol})
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                {isEditing
                  ? 'Update dish details, catalog pricing, and branch stock'
                  : 'Add a new dish to your master menu catalog'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-1.5 rounded-[8px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-5 overflow-y-auto flex-1" noValidate>
          {serverError && (
            <div className="p-3.5 rounded-[10px] bg-danger/10 border border-danger/25 text-danger text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* If creating new dish and there are multiple brands without default, show selector */}
          {!isEditing && restaurants.length > 1 && !defaultRestaurantId && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text">
                Restaurant Brand <span className="text-danger">*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary cursor-pointer"
                {...register('restaurantId')}
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.defaultCurrency || 'INR'})
                  </option>
                ))}
              </select>
              {errors.restaurantId?.message && (
                <p className="text-[11px] text-danger mt-1">{errors.restaurantId.message}</p>
              )}
            </div>
          )}

          {/* Two-Column Responsive Section: Main Info & Dish Photo */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left Column: Form Details (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Dish Name */}
              <Input
                label="Dish Name"
                placeholder="e.g. Chicken Biryani or Paneer Tikka"
                required
                error={errors.name?.message}
                {...register('name')}
              />

              {/* Category & Base Price Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Category Select */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-text">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary cursor-pointer"
                    {...register('categoryId')}
                  >
                    {filteredCategories.length === 0 ? (
                      <option value="">No categories created yet</option>
                    ) : (
                      filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.categoryId?.message && (
                    <p className="text-[11px] text-danger mt-1">{errors.categoryId.message}</p>
                  )}
                </div>

                {/* Base Price */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-text">
                      Base Price <span className="text-danger">*</span>
                    </label>
                    <span className="text-[10px] text-muted font-mono">
                      {brandCurrencyCode}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted font-bold text-xs">
                      <span>{brandCurrencyObj.symbol}</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 150.00"
                      className="w-full pl-8 pr-3 py-2 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary font-medium"
                      {...register('basePrice')}
                    />
                  </div>
                  {errors.basePrice?.message ? (
                    <p className="text-[11px] text-danger mt-1">{errors.basePrice.message}</p>
                  ) : (
                    <p className="text-[10px] text-muted">Inherited by all branches</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prepared with aromatic basmati rice, tender meat & signature herbs"
                  className="w-full px-3 py-2 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary resize-none placeholder:text-muted/60"
                  {...register('description')}
                />
              </div>
            </div>

            {/* Right Column: Dish Photo Card (5 cols) */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-xs font-medium text-text">
                Dish Photo (Optional)
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />

              {previewUrl ? (
                <div className="relative rounded-[12px] border border-border bg-surface-2 p-3 space-y-3">
                  <div className="w-full h-32 rounded-[8px] overflow-hidden bg-surface border border-border relative group">
                    <img
                      src={previewUrl}
                      alt="Dish preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-[6px] bg-white text-black text-xs font-semibold shadow-xs hover:bg-white/90 transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1 rounded-[6px] bg-danger text-white text-xs shadow-xs hover:bg-danger/90 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="truncate max-w-[140px] font-medium text-text">
                      {selectedFile ? selectedFile.name : 'Current Photo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileChange(e.dataTransfer.files?.[0] || null);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-[12px] cursor-pointer transition-all text-center p-4',
                    isDragOver
                      ? 'border-primary bg-primary-soft/30'
                      : 'border-border hover:border-muted hover:bg-surface-2',
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-muted mb-2 border border-border">
                    <Upload size={16} />
                  </div>
                  <p className="text-xs font-semibold text-text">Upload Dish Photo</p>
                  <p className="text-[11px] text-muted mt-0.5">Drag & drop or browse</p>
                  <p className="text-[10px] text-muted/70 mt-1 font-mono">JPG, PNG, WebP up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Multi-Branch Stock & Availability Overview */}
          {isEditing && relevantBranches.length > 0 && (
            <div className="pt-2 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                  <Store size={15} className="text-primary" />
                  <span>Branch Availability & Custom Pricing</span>
                </div>
                <span className="text-[11px] text-muted">
                  {relevantBranches.length} Location{relevantBranches.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="rounded-[10px] border border-border bg-surface-2/40 divide-y divide-border overflow-hidden text-xs">
                {relevantBranches.map((branch) => {
                  const state = branchStates[branch.id] || {
                    isAvailable: true,
                    priceOverride: null,
                  };
                  const isAvailable = state.isAvailable;
                  const isSaving = state.isSaving;
                  const branchCurrency = branch.currency || brandCurrencyCode;
                  const isCrossCurrency = branchCurrency !== brandCurrencyCode;

                  return (
                    <div
                      key={branch.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface transition-colors"
                    >
                      {/* Branch Info & Currency */}
                      <div className="flex items-center gap-2.5 min-w-[180px]">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            isAvailable ? 'bg-success' : 'bg-muted/60',
                          )}
                        />
                        <div>
                          <p className="font-semibold text-text">{branch.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted font-mono">
                            <span>Currency: {branchCurrency}</span>
                            {isCrossCurrency && (
                              <span className="px-1 rounded bg-warning/15 text-warning font-sans font-bold">
                                Local
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stock Switch & Inline Price Override */}
                      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                        {/* Quick Stock Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleBranchStock(branch.id)}
                          disabled={isSaving}
                          className={cn(
                            'px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 shrink-0',
                            isAvailable
                              ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                              : 'bg-muted/10 text-muted border-border hover:bg-muted/20',
                          )}
                        >
                          {isAvailable ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span>In Stock</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} />
                              <span>Sold Out</span>
                            </>
                          )}
                        </button>

                        {/* Price Override Input */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-muted whitespace-nowrap">Price:</span>
                          <div className="relative w-24">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={
                                watch('basePrice')
                                  ? `${brandCurrencyObj.symbol}${watch('basePrice')}`
                                  : 'Base'
                              }
                              value={state.priceOverride ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBranchStates((prev) => ({
                                  ...prev,
                                  [branch.id]: {
                                    ...state,
                                    priceOverride: val,
                                  },
                                }));
                              }}
                              onBlur={(e) => handleSaveBranchPrice(branch.id, e.target.value)}
                              className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-[6px] focus:outline-none focus:border-primary font-mono text-text"
                            />
                          </div>
                          {state.priceOverride ? (
                            <button
                              type="button"
                              onClick={() => handleSaveBranchPrice(branch.id, '')}
                              className="text-[10px] text-muted hover:text-danger cursor-pointer ml-0.5"
                              title="Reset to Base Price"
                            >
                              Reset
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted italic">Default</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border sticky bottom-0 bg-surface">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              icon={<ArrowRight size={15} />}
            >
              {isEditing ? 'Save Changes' : 'Add Dish'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
