import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Store, AlertCircle, MapPin, Phone, ArrowRight } from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { branchesApi } from '../api/branchesApi';

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91 (India)' },
  { code: '+1', label: '🇺🇸 +1 (US / Canada)' },
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+971', label: '🇦🇪 +971 (UAE)' },
  { code: '+65', label: '🇸🇬 +65 (Singapore)' },
  { code: '+61', label: '🇦🇺 +61 (Australia)' },
];

const createBranchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  slug: z.string().optional(),
  address: z.string().min(3, 'Address is required'),
  countryCode: z.string().optional(),
  phone: z.string().optional(),
});

type CreateBranchFormData = z.infer<typeof createBranchSchema>;

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBranchCreated: () => void;
}

export const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  isOpen,
  onClose,
  onBranchCreated,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBranchFormData>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: '',
      slug: '',
      address: '',
      countryCode: '+91',
      phone: '',
    },
  });

  const watchedName = watch('name');
  const computedSlug = watchedName
    ? watchedName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : 'branch-name';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (data: CreateBranchFormData) => {
    try {
      setServerError(null);
      await branchesApi.createBranch({
        name: data.name,
        slug: data.slug || undefined,
        address: data.address,
        countryCode: data.countryCode || undefined,
        phone: data.phone || undefined,
      });
      reset();
      onBranchCreated();
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to create branch. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-backdrop backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card (12px radius, surface bg) */}
      <div className="relative w-full max-w-lg bg-surface rounded-[12px] border border-border shadow-xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0">
              <Store size={17} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">
                Add New Restaurant Branch
              </h2>
              <p className="text-xs text-muted">
                Create a branch location with its own QR table stands.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-[6px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>
          {serverError && (
            <div className="p-3 rounded-[8px] bg-danger/10 border border-danger/25 text-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <Input
            label="Branch Name"
            placeholder="e.g. Downtown Bistro"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Live URL Slug Preview */}
          <div className="p-2.5 rounded-[8px] bg-surface-2 border border-border text-xs">
            <span className="text-muted block text-[11px] mb-0.5">Customer Storefront URL Preview:</span>
            <span className="font-mono text-primary font-semibold truncate block">
              ordzo.com/r/{computedSlug}
            </span>
          </div>

          <Input
            label="Physical Address"
            placeholder="e.g. 102 Main Street, Suite 4"
            required
            error={errors.address?.message}
            prefixElement={<MapPin size={15} />}
            {...register('address')}
          />

          {/* Phone with Country Code */}
          <div className="flex flex-col gap-1.5 w-full text-left">
            <label className="text-xs font-medium text-text">
              Branch Contact Phone (Optional)
            </label>
            <div className="flex items-center gap-2">
              <select
                {...register('countryCode')}
                className="h-[44px] px-2.5 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer shrink-0"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>

              <div className="flex-1">
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
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border">
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
              Create Branch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
