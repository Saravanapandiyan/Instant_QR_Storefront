import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, MapPin, Phone, ArrowRight, X, AlertCircle, Coins } from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { useRestaurants } from '../../restaurants/hooks/useRestaurants';
import { SUPPORTED_CURRENCIES } from '../../../config/currencies.config';
import { getCustomerDisplayHost, useEncryptedBranchTokens } from '../../../lib/urls';
import type { Branch, CreateBranchInput } from '@instant-qr/shared-types';

const branchSchema = z.object({
  restaurantId: z.string().min(1, 'Please select a restaurant concept'),
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  address: z.string().optional(),
  countryCode: z.string().optional(),
  phone: z.string().optional(),
  currency: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

const COUNTRY_CODES = [
  { code: '91', label: '+91 (India)' },
  { code: '1', label: '+1 (US/Canada)' },
  { code: '44', label: '+44 (UK)' },
  { code: '61', label: '+61 (Australia)' },
  { code: '971', label: '+971 (UAE)' },
  { code: '65', label: '+65 (Singapore)' },
  { code: '60', label: '+60 (Malaysia)' },
];

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitBranch: (data: CreateBranchInput, id?: string) => Promise<any>;
  initialData?: Branch | null;
  defaultRestaurantId?: string | null;
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  onSubmitBranch,
  initialData,
  defaultRestaurantId,
}) => {
  const { restaurants } = useRestaurants();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      restaurantId: defaultRestaurantId || '',
      countryCode: '91',
      currency: 'INR',
    },
  });

  const branchName = watch('name') || '';
  const selectedRestaurantId = watch('restaurantId');

  // Find active restaurant slug for clean preview
  const activeRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);
  const computedSlug =
    watch('slug') ||
    (branchName
      ? `${activeRestaurant?.slug || 'store'}-${branchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
      : 'your-branch');
  const { getBranchDisplayPath } = useEncryptedBranchTokens(
    isEditing && initialData?.slug ? [initialData.slug] : [],
  );
  const previewPath =
    isEditing && initialData?.slug
      ? getBranchDisplayPath(initialData.slug)
      : `/r/${computedSlug}`;

  useEffect(() => {
    if (initialData) {
      reset({
        restaurantId: initialData.restaurantId,
        name: initialData.name,
        slug: initialData.slug,
        address: initialData.address || '',
        countryCode: initialData.countryCode || '91',
        phone: initialData.phone || '',
        currency: initialData.currency || 'INR',
      });
    } else {
      const parentRest = restaurants.find((r) => r.id === (defaultRestaurantId || restaurants[0]?.id));
      reset({
        restaurantId: defaultRestaurantId || (restaurants[0]?.id ?? ''),
        name: '',
        slug: '',
        address: '',
        countryCode: '91',
        phone: '',
        currency: parentRest?.defaultCurrency || 'INR',
      });
    }
    setServerError(null);
  }, [initialData, defaultRestaurantId, restaurants, reset, isOpen]);

  if (!isOpen) return null;

  const onFormSubmit = async (values: BranchFormValues) => {
    setServerError(null);
    try {
      const payload: any = {
        name: values.name.trim(),
        slug: values.slug?.trim() || undefined,
        address: values.address?.trim() || undefined,
        countryCode: values.countryCode || undefined,
        phone: values.phone?.trim() || undefined,
        currency: values.currency || 'INR',
      };

      // Only include restaurantId when creating a new branch
      if (!isEditing) {
        payload.restaurantId = values.restaurantId;
      }

      await onSubmitBranch(payload, initialData?.id);
      reset();
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Operation failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-backdrop backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-surface rounded-[12px] border border-border shadow-2xl flex flex-col z-10 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-2 p-4 sm:p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[8px] bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0">
              <Store size={17} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-text truncate">
                <span className="sm:hidden">{isEditing ? 'Edit Branch' : 'Add Branch'}</span>
                <span className="hidden sm:inline">
                  {isEditing ? 'Edit Restaurant Branch' : 'Add New Restaurant Branch'}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-muted leading-snug">
                {isEditing
                  ? 'Update branch details and storefront slug.'
                  : 'Add a location with its own QR table storefront.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-[6px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4" noValidate>
          {serverError && (
            <div className="p-3 rounded-[8px] bg-danger/10 border border-danger/25 text-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Restaurant Concept Selector (if multiple restaurants exist or not editing) */}
          <div className="flex flex-col gap-1.5 w-full text-left">
            <label className="text-xs font-medium text-text">
              Restaurant Concept <span className="text-danger ml-0.5">*</span>
            </label>
            <select
              {...register('restaurantId')}
              disabled={isEditing}
              className="h-[44px] px-3.5 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <option value="" disabled>
                -- Select Restaurant Concept --
              </option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.restaurantId?.message && (
              <span className="text-xs text-danger">{errors.restaurantId.message}</span>
            )}
          </div>

          <Input
            label="Branch Name"
            placeholder="e.g. Downtown Branch"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Operational Billing Currency */}
          <div className="flex flex-col gap-1.5 w-full text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text">
                Branch Billing Currency
              </label>
              {activeRestaurant?.defaultCurrency && (
                <span className="text-[11px] text-muted">
                  Brand Default: <strong className="text-primary">{activeRestaurant.defaultCurrency}</strong>
                </span>
              )}
            </div>
            <select
              {...register('currency')}
              className="h-[44px] px-3.5 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} — {curr.name} ({curr.code})
                </option>
              ))}
            </select>
            {watch('currency') &&
              activeRestaurant?.defaultCurrency &&
              watch('currency') !== activeRestaurant.defaultCurrency && (
                <p className="text-[11px] text-amber-500 font-medium">
                  ⚡ Cross-Currency Branch: Dishes will require local pricing in {watch('currency')}.
                </p>
              )}
          </div>

          {/* Live Storefront URL Slug Preview */}
          <div className="p-2.5 rounded-[8px] bg-surface-2 border border-border text-xs">
            <span className="text-muted block text-[11px] mb-0.5">
              Customer Storefront QR Link Preview:
            </span>
            <span className="font-mono text-primary font-semibold truncate block">
              {getCustomerDisplayHost()}
              {previewPath}
            </span>
          </div>

          <Input
            label="Physical Address"
            placeholder="e.g. 102 Main Street, Suite 4"
            error={errors.address?.message}
            prefixElement={<MapPin size={15} />}
            {...register('address')}
          />

          {/* Phone with Country Code */}
          <div className="flex flex-col gap-1.5 w-full text-left">
            <label className="text-xs font-medium text-text">
              Branch Contact Phone (Optional)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                {...register('countryCode')}
                className="h-[44px] w-full sm:w-auto px-2.5 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer shrink-0"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>

              <div className="flex-1 min-w-0">
                <Input
                  placeholder="9876543210"
                  type="tel"
                  prefixElement={<Phone size={14} />}
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 pb-1 flex items-center justify-end gap-2.5 border-t border-border shrink-0 bg-surface sticky bottom-0">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              icon={<ArrowRight size={15} />}
            >
              {isEditing ? 'Save Changes' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
