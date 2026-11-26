import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Palette,
  Globe,
  Save,
  RefreshCw,
  ShieldCheck,
  Eye,
  Link as LinkIcon,
  Mail,
  UploadCloud,
  Upload,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { adminSettingsApi, type SiteBrandingConfig } from '../../api/adminSettingsApi.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

interface AssetUploaderProps {
  label: string;
  description: string;
  value: string | null;
  onChange: (url: string | null) => void;
  bgMode?: 'light' | 'dark' | 'checker';
  aspect?: 'logo' | 'icon';
}

function BrandAssetUploader({
  label,
  description,
  value,
  onChange,
  bgMode = 'light',
  aspect = 'logo',
}: AssetUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await adminSettingsApi.uploadLogo(file);
      onChange(res.url);
      toast.success(`${label} uploaded successfully!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to upload ${label}.`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await adminSettingsApi.uploadLogo(file);
      onChange(res.url);
      toast.success(`${label} uploaded successfully!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to upload ${label}.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-blue-500 hover:underline cursor-pointer"
        >
          {showUrlInput ? 'Hide URL field' : 'Enter URL manually'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div
          className="p-3 rounded-xl border flex flex-col gap-2 shadow-2xs relative group"
          style={{
            backgroundColor: 'var(--adm-surface-subtle)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Visual Preview */}
          <div
            className={`w-full h-24 rounded-lg flex items-center justify-center p-3 border overflow-hidden relative ${
              bgMode === 'dark'
                ? 'bg-neutral-900 border-neutral-800'
                : bgMode === 'checker'
                ? 'bg-neutral-100 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700'
                : 'bg-white border-neutral-200'
            }`}
          >
            <img
              src={value}
              alt={label}
              className={`max-h-full object-contain ${
                aspect === 'icon' ? 'w-10 h-10' : 'max-w-full'
              }`}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span
              className="text-[10px] font-mono truncate max-w-[170px]"
              style={{ color: 'var(--adm-muted)' }}
              title={value}
            >
              {value}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                title="Replace image"
              >
                {isUploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 h-28"
          style={{ borderColor: 'var(--adm-border)' }}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-1.5">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>
                Uploading asset...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <UploadCloud className="w-6 h-6 text-indigo-500" />
              <span className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>
                Click to upload {aspect === 'icon' ? 'icon' : 'logo'}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--adm-muted)' }}>
                PNG, JPG, SVG, WebP, ICO (max 5MB)
              </span>
            </div>
          )}
        </div>
      )}

      {showUrlInput && (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://... or /uploads/..."
          className="w-full h-8 px-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all mt-1 font-mono"
          style={{
            backgroundColor: 'var(--adm-surface-subtle)',
            borderColor: 'var(--adm-border)',
            color: 'var(--adm-text)',
          }}
        />
      )}

      <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>
        {description}
      </p>
    </div>
  );
}

export function AdminBrandingPage() {
  const queryClient = useQueryClient();

  const { data: initialData, refetch, isRefetching } = useQuery({
    queryKey: ['admin-branding-settings'],
    queryFn: adminSettingsApi.getBranding,
  });

  const [form, setForm] = useState<SiteBrandingConfig>({
    siteTitle: 'InstaDine',
    siteTagline: 'Turn every table into a storefront.',
    supportEmail: 'support@instadine.com',
    defaultCurrency: 'INR',
    lightLogoUrl: null,
    darkLogoUrl: null,
    faviconUrl: null,
    poweredByText: 'Powered by InstaDine',
    poweredByLink: '/register',
    showPoweredByBadge: true,
    customFooterNote: 'Multi-restaurant touchless QR storefront platform.',
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<SiteBrandingConfig>) =>
      adminSettingsApi.updateBranding(data),
    onSuccess: (updated) => {
      toast.success('Site branding and footer configuration published successfully!');
      queryClient.setQueryData(['admin-branding-settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-branding-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-branding'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update site branding.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-20">
        {/* Modern Admin Page Header */}
        <AdminPageHeader
          title="Site Branding & Global Settings"
          description="Configure your platform brand title, logos, and footer attribution. Changes propagate automatically to the customer storefront and restaurant console."
        >
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer hover:opacity-100"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:opacity-95 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--adm-primary)',
              color: 'var(--adm-primary-contrast)',
            }}
          >
            {saveMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveMutation.isPending ? 'Publishing...' : 'Publish Branding'}</span>
          </button>
        </AdminPageHeader>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Platform Brand Identity */}
          <div
            className="p-5 rounded-xl border space-y-4 shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <Globe className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text)' }}>
                Platform Brand Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text)' }}>
                  Site Title (Platform Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.siteTitle}
                  onChange={(e) => setForm({ ...form, siteTitle: e.target.value })}
                  placeholder="e.g. InstaDine, EatQuick, BiteFlow"
                  className="w-full h-9 px-3 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-text)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--adm-muted)' }}>
                  Displayed on the customer storefront header, owner login page, and browser tabs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text)' }}>
                  Platform Tagline / Slogan
                </label>
                <input
                  type="text"
                  value={form.siteTagline}
                  onChange={(e) => setForm({ ...form, siteTagline: e.target.value })}
                  placeholder="e.g. Turn every table into a storefront."
                  className="w-full h-9 px-3 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-text)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--adm-muted)' }}>
                  Featured on the owner onboarding screens and meta tags.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text)' }}>
                  Platform Support / Contact Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
                  <input
                    type="email"
                    value={form.supportEmail}
                    onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                    placeholder="support@yourdomain.com"
                    className="w-full h-9 pl-9 pr-3 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all"
                    style={{
                      backgroundColor: 'var(--adm-surface-subtle)',
                      borderColor: 'var(--adm-border)',
                      color: 'var(--adm-text)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text)' }}>
                  Plan &amp; Billing Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.defaultCurrency || 'INR'}
                  onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all cursor-pointer font-semibold"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-text)',
                  }}
                >
                  <option value="INR">🇮🇳 INR (₹) — Indian Rupee</option>
                  <option value="USD">🇺🇸 USD ($) — US Dollar</option>
                  <option value="EUR">🇪🇺 EUR (€) — Euro</option>
                  <option value="GBP">🇬🇧 GBP (£) — British Pound</option>
                  <option value="AED">🇦🇪 AED (د.إ) — UAE Dirham</option>
                  <option value="SGD">🇸🇬 SGD (S$) — Singapore Dollar</option>
                  <option value="AUD">🇦🇺 AUD (A$) — Australian Dollar</option>
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--adm-muted)' }}>
                  Applies to all Subscription &amp; Credit Plans across Admin and Restaurant billing.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Brand Logos & Favicon */}
          <div
            className="p-5 rounded-xl border space-y-4 shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <Palette className="w-4 h-4 text-purple-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text)' }}>
                Logo Assets &amp; Icons
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <BrandAssetUploader
                label="Light Mode Logo"
                description="Used on white / light backgrounds, printed QR standees, and customer receipts."
                value={form.lightLogoUrl}
                onChange={(url) => setForm({ ...form, lightLogoUrl: url })}
                bgMode="light"
                aspect="logo"
              />

              <BrandAssetUploader
                label="Dark Mode Logo"
                description="Used on dark headers, restaurant owner sidebar, and OLED screens."
                value={form.darkLogoUrl}
                onChange={(url) => setForm({ ...form, darkLogoUrl: url })}
                bgMode="dark"
                aspect="logo"
              />

              <BrandAssetUploader
                label="Favicon / App Icon"
                description="Browser tab bookmark icon and mobile home screen PWA icon (.png, .ico, .svg)."
                value={form.faviconUrl}
                onChange={(url) => setForm({ ...form, faviconUrl: url })}
                bgMode="checker"
                aspect="icon"
              />
            </div>
          </div>

          {/* Card 3: Footer Values & Referral Link Settings */}
          <div
            className="p-5 rounded-xl border space-y-4 shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--adm-border)' }}>
              <LinkIcon className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-text)' }}>
                Storefront Footer &amp; "Powered By" Attribution
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text)' }}>
                  "Powered by" Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.poweredByText}
                  onChange={(e) => setForm({ ...form, poweredByText: e.target.value })}
                  placeholder="e.g. Powered by InstaDine"
                  className="w-full h-9 px-3 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-text)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--adm-muted)' }}>
                  Appears in the customer storefront footer bar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text)' }}>
                  Referral / Registration Target Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.poweredByLink}
                  onChange={(e) => setForm({ ...form, poweredByLink: e.target.value })}
                  placeholder="e.g. /register or https://yourdomain.com"
                  className="w-full h-9 px-3 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-text)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--adm-muted)' }}>
                  The destination URL when customers click "Powered by".
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--adm-text)' }}>
                  Custom Footer Legal / Copyright Note
                </label>
                <input
                  type="text"
                  value={form.customFooterNote}
                  onChange={(e) => setForm({ ...form, customFooterNote: e.target.value })}
                  placeholder="e.g. Multi-restaurant touchless QR storefront platform."
                  className="w-full h-9 px-3 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-text)',
                  }}
                />
              </div>

              <div className="md:col-span-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showPoweredByBadge}
                    onChange={(e) => setForm({ ...form, showPoweredByBadge: e.target.checked })}
                    className="rounded accent-emerald-500"
                  />
                  <span style={{ color: 'var(--adm-text)' }}>
                    Display "Powered by" badge in the customer storefront footer
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 4: Live Storefront Footer Preview */}
          <div
            className="p-5 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--adm-surface-subtle)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--adm-muted)' }}>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span>STOREFRONT LIVE PREVIEW (HOW CUSTOMERS SEE IT)</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--adm-border)' }}>
                Real-Time Preview
              </span>
            </div>

            <div
              className="py-4 px-4 text-center rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--adm-surface)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            >
              <div className="max-w-md mx-auto flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs opacity-85">
                <span className="font-bold tracking-tight">Bucket Briyano</span>
                <span className="opacity-40">•</span>
                <span className="inline-flex items-center gap-1 opacity-80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Touchless Menu</span>
                </span>
                {form.showPoweredByBadge && (
                  <>
                    <span className="opacity-40">•</span>
                    <a
                      href={form.poweredByLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:underline font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{form.poweredByText || 'Powered by InstaDine'}</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer hover:opacity-95 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--adm-primary)',
                color: 'var(--adm-primary-contrast)',
              }}
            >
              {saveMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saveMutation.isPending ? 'Publishing Brand Config...' : 'Save & Publish Live'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
