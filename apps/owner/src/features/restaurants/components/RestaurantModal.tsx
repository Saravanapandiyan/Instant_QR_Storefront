import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Utensils, ArrowRight, X, AlertCircle, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { getMediaUrl } from '../../../lib/utils';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { SUPPORTED_CURRENCIES } from '../../../config/currencies.config';
import type { Restaurant } from '@instant-qr/shared-types';

const restaurantSchema = z.object({
  name: z.string().min(2, 'Restaurant concept name must be at least 2 characters'),
  description: z.string().optional(),
  defaultCurrency: z.string().optional(),
});

type RestaurantFormValues = z.infer<typeof restaurantSchema>;

interface RestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant?: Restaurant | null; // null/undefined = create mode, object = edit mode
  onSubmit: (formData: FormData) => Promise<any>;
}

export const RestaurantModal: React.FC<RestaurantModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  onSubmit,
}) => {
  useBodyScrollLock(isOpen);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = Boolean(restaurant);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: '',
      description: '',
      defaultCurrency: 'INR',
    },
  });

  // Synchronize initial values when modal opens or target restaurant changes
  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setSelectedFile(null);
      if (restaurant) {
        reset({
          name: restaurant.name,
          description: restaurant.description || '',
          defaultCurrency: restaurant.defaultCurrency || 'INR',
        });
        setPreviewUrl(getMediaUrl(restaurant.logoUrl));
      } else {
        reset({
          name: '',
          description: '',
          defaultCurrency: 'INR',
        });
        setPreviewUrl(null);
      }
    }
  }, [isOpen, restaurant, reset]);

  // Clean up object URLs to avoid memory leaks
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

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setServerError('Please select a valid image file (JPG, PNG, WebP, AVIF).');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setServerError('Logo file size must be less than 5MB.');
      return;
    }

    setServerError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveLogo = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onFormSubmit = async (values: RestaurantFormValues) => {
    setServerError(null);
    try {
      const formData = new FormData();
      formData.append('name', values.name.trim());
      if (values.description?.trim()) {
        formData.append('description', values.description.trim());
      }
      if (values.defaultCurrency) {
        formData.append('defaultCurrency', values.defaultCurrency);
      }
      if (selectedFile) {
        formData.append('logo', selectedFile);
      }

      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to save restaurant concept.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-backdrop backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={!isSubmitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-surface rounded-[12px] border border-border shadow-2xl flex flex-col z-10 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0">
              <Utensils size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">
                {isEditMode ? 'Edit Restaurant Concept' : 'New Restaurant Concept'}
              </h2>
              <p className="text-xs text-muted">
                {isEditMode
                  ? 'Update brand concept details and brand logo.'
                  : 'Define a food concept (e.g. Pure Veg, BBQ) with its brand identity.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-1.5 rounded-[6px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={18} />
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

          {/* Restaurant Concept Name */}
          <Input
            label="Concept Name"
            placeholder="e.g. Ananda Pure Veg or Babu Non-Veg"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Concept Description */}
          <Input
            label="Description (Optional)"
            placeholder="e.g. Authentic South Indian vegetarian dosas, thalis, and filter coffee"
            error={errors.description?.message}
            {...register('description')}
          />

          {/* Master Catalog Default Currency */}
          <div className="flex flex-col gap-1.5 w-full text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text">
                Master Catalog Default Currency
              </label>
              <span className="text-[11px] text-muted">
                Currency for dish base prices
              </span>
            </div>
            <select
              {...register('defaultCurrency')}
              className="h-[44px] px-3.5 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} — {curr.name} ({curr.code})
                </option>
              ))}
            </select>
          </div>

          {/* Restaurant Logo Upload Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text">
              Brand Logo
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />

            {previewUrl ? (
              <div className="flex items-center gap-4 p-3 rounded-[8px] border border-border bg-surface-2">
                <div className="relative w-16 h-16 rounded-[8px] overflow-hidden border border-border bg-surface shrink-0 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text truncate">
                    {selectedFile ? selectedFile.name : 'Current Brand Logo'}
                  </p>
                  <p className="text-[11px] text-muted">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                      : 'Uploaded logo is active on customer QR storefronts'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-[6px] border border-border bg-surface text-text hover:bg-surface-2 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    title="Remove logo"
                    className="p-1.5 rounded-[6px] text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
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
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[10px] cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary-soft/30'
                    : 'border-border hover:border-muted hover:bg-surface-2'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-muted mb-2">
                  <Upload size={18} />
                </div>
                <p className="text-xs font-semibold text-text">
                  Click to upload brand logo or drag & drop
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  PNG, JPG, WebP or AVIF (up to 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 pb-1 flex items-center justify-end gap-2.5 border-t border-border shrink-0 bg-surface sticky bottom-0">
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
              {isEditMode ? 'Save Changes' : 'Create Concept'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
