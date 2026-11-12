import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag, ArrowRight, X, AlertCircle, Utensils } from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import type { Category } from '../api/menu-api';
import type { Restaurant } from '@instant-qr/shared-types';

const categorySchema = z.object({
  restaurantId: z.string().min(1, 'Please select a restaurant concept'),
  name: z.string().min(2, 'Category name must be at least 2 characters long'),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants?: Restaurant[];
  restaurantId?: string;
  defaultRestaurantId?: string;
  initialData?: Category | null;
  onSubmit: (data: { restaurantId: string; name: string; description?: string }) => Promise<any>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  restaurants = [],
  restaurantId,
  defaultRestaurantId,
  initialData,
  onSubmit,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(initialData);

  const effectiveDefaultRestId =
    defaultRestaurantId || restaurantId || (restaurants[0]?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      restaurantId: effectiveDefaultRestId,
      name: '',
      description: '',
    },
  });

  const selectedRestaurantId = watch('restaurantId');
  const selectedRestaurant = (restaurants || []).find((r) => r.id === selectedRestaurantId);

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      if (initialData) {
        reset({
          restaurantId: initialData.restaurantId,
          name: initialData.name,
          description: initialData.description || '',
        });
      } else {
        reset({
          restaurantId: effectiveDefaultRestId,
          name: '',
          description: '',
        });
      }
    }
  }, [isOpen, initialData, effectiveDefaultRestId, reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (values: CategoryFormValues) => {
    setServerError(null);
    try {
      await onSubmit({
        restaurantId: values.restaurantId,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to save menu category.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-backdrop backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={!isSubmitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-surface rounded-[12px] border border-border shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0">
              <Tag size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">
                {isEditing ? 'Edit Category' : 'New Menu Category'}
              </h2>
              <p className="text-xs text-muted">
                {selectedRestaurant
                  ? `For brand "${selectedRestaurant.name}"`
                  : 'Organize dishes into sections on your digital menu.'}
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

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-5 space-y-4" noValidate>
          {serverError && (
            <div className="p-3 rounded-[8px] bg-danger/10 border border-danger/25 text-danger text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Restaurant Concept / Brand Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text">
              Restaurant Brand <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full px-3 py-2 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary cursor-pointer"
                disabled={isEditing}
                {...register('restaurantId')}
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.restaurantId?.message && (
              <p className="text-[11px] text-danger mt-1">{errors.restaurantId.message}</p>
            )}
          </div>

          <Input
            label="Category Name"
            placeholder="e.g. Starters, Main Course, Breads, Drinks"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Description (Optional)"
            placeholder="e.g. Freshly baked tandoori breads and rotis"
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border">
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
              {isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
