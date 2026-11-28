import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, toast } from '../../components/ui';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useBranches } from '../branches/hooks/useBranches';
import { restaurantsApi } from '../restaurants/api/restaurantsApi';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants/query-keys';
import { ROUTES } from '../../constants/routes';
import { ThemePresetSelector } from './components/ThemePresetSelector';
import { ColorShadeEditor } from './components/ColorShadeEditor';
import { StorefrontDevicePreview } from './components/StorefrontDevicePreview';
import { DEFAULT_STOREFRONT_THEME } from '../../config/theme-presets.config';
import type { StorefrontThemeConfig, StorefrontThemePalette } from '@instant-qr/shared-types';

export const StorefrontThemePage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { restaurants, isLoading: isRestaurantsLoading } = useRestaurants();
  const { branches } = useBranches();

  // Active restaurant concept
  const restaurant = restaurants.find((r) => r.id === restaurantId);

  // Active editing mode tab: 'light' | 'dark'
  const [activeMode, setActiveMode] = useState<'light' | 'dark'>('light');

  // Currently loaded theme configuration
  const [themeConfig, setThemeConfig] = useState<StorefrontThemeConfig>(DEFAULT_STOREFRONT_THEME);
  const [isSaving, setIsSaving] = useState(false);

  // Populate themeConfig once restaurant data is ready
  useEffect(() => {
    if (restaurant) {
      if (restaurant.themeConfig && restaurant.themeConfig.light && restaurant.themeConfig.dark) {
        setThemeConfig(restaurant.themeConfig);
      } else {
        setThemeConfig(DEFAULT_STOREFRONT_THEME);
      }
    }
  }, [restaurant]);

  const currentPalette: StorefrontThemePalette =
    activeMode === 'dark' ? themeConfig.dark : themeConfig.light;

  const handleSelectPreset = (newConfig: StorefrontThemeConfig) => {
    setThemeConfig(newConfig);
  };

  const handleUpdateColor = (field: keyof StorefrontThemePalette, value: string) => {
    setThemeConfig((prev) => ({
      ...prev,
      presetId: 'custom',
      [activeMode]: {
        ...prev[activeMode],
        [field]: value,
      },
    }));
  };

  const handleResetDefaults = () => {
    setThemeConfig(DEFAULT_STOREFRONT_THEME);
    toast.info('Reset colors to default Terracotta theme');
  };

  const handleSaveTheme = async () => {
    if (!restaurant) return;
    try {
      setIsSaving(true);
      await restaurantsApi.updateRestaurant(restaurant.id, {
        themeConfig,
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.restaurants.detail(restaurant.id) });

      toast.success(
        `Storefront theme saved for "${restaurant.name}"!`,
        'Theme Updated',
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to save theme configuration.', 'Save Error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isRestaurantsLoading) {
    return (
      <DashboardLayout branchCount={branches.length} restaurantCount={restaurants.length}>
        <div className="p-16 text-center text-muted">
          <p className="text-xs font-medium">Loading restaurant theme configuration...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!restaurant) {
    return (
      <DashboardLayout branchCount={branches.length} restaurantCount={restaurants.length}>
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-surface space-y-4">
          <AlertCircle size={32} className="mx-auto text-danger" />
          <div>
            <h2 className="text-base font-bold text-text">Restaurant Concept Not Found</h2>
            <p className="text-xs text-muted mt-1">
              The selected restaurant could not be located.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.RESTAURANTS)}>
            Back to Restaurants
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout branchCount={branches.length} restaurantCount={restaurants.length}>
      <div className="space-y-6">
        {/* Top Header & Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
              <button
                type="button"
                onClick={() => navigate(ROUTES.RESTAURANTS)}
                className="hover:text-text hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft size={13} />
                <span>Restaurants</span>
              </button>
              <span>/</span>
              <span className="font-semibold text-text whitespace-nowrap">{restaurant.name}</span>
              <span>/</span>
              <span className="text-primary font-medium whitespace-nowrap">Storefront Theme</span>
            </div>

            <div className="flex items-start sm:items-center gap-3 pt-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0 shadow-2xs">
                <Palette size={19} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-text tracking-tight flex flex-wrap items-center gap-2">
                  <span>Storefront Theme Studio</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-2 border border-border text-muted font-normal whitespace-nowrap">
                    {restaurant.name}
                  </span>
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  Customize color shades and live appearance across mobile, tablet, and web storefronts.
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions: Reset & Save */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              icon={<RotateCcw size={14} />}
              className="whitespace-nowrap justify-center"
            >
              <span className="sm:hidden">Reset</span>
              <span className="hidden sm:inline">Reset Defaults</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveTheme}
              disabled={isSaving}
              icon={<Check size={15} />}
              className="whitespace-nowrap justify-center"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <span className="sm:hidden">Save Theme</span>
                  <span className="hidden sm:inline">Save Theme Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Split Grid: Controls (Left) & Multi-Device Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: THEME CONTROLS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
            {/* Mode Switcher */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">
                Active Color Mode
              </label>

              <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-2 border border-border gap-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveMode('light')}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                    activeMode === 'light'
                      ? 'bg-surface text-text shadow-xs border border-border font-bold'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs shrink-0" />
                  <span className="sm:hidden">Light Mode</span>
                  <span className="hidden sm:inline">Light Mode Palette</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('dark')}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                    activeMode === 'dark'
                      ? 'bg-surface text-text shadow-xs border border-border font-bold'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-2xs shrink-0" />
                  <span className="sm:hidden">Dark Mode</span>
                  <span className="hidden sm:inline">Dark Mode Palette</span>
                </button>
              </div>
            </div>

            {/* Presets Gallery */}
            <ThemePresetSelector
              currentPresetId={themeConfig.presetId}
              onSelectPreset={handleSelectPreset}
            />

            {/* Custom Color Shades Editor */}
            <ColorShadeEditor
              mode={activeMode}
              palette={currentPalette}
              onChangeColor={handleUpdateColor}
            />

            {/* Bottom Save Reminder */}
            <div className="p-3.5 rounded-xl bg-primary-soft/30 border border-primary/20 flex items-center justify-between gap-3 text-xs">
              <span className="text-primary-soft-text font-medium flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> Changes apply to all branches of this concept
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveTheme}
                disabled={isSaving}
              >
                Save
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: MULTI-DEVICE PREVIEW (7 Cols) */}
          <div className="lg:col-span-7 bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
            <StorefrontDevicePreview
              restaurantName={restaurant.name}
              palette={currentPalette}
              activeMode={activeMode}
              onToggleMode={setActiveMode}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

