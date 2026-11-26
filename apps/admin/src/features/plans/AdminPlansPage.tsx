import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Search,
  Package,
  X,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.ts';
import {
  adminPlansApi,
  type AdminPack,
  type CreatePlanPayload,
} from '../../api/adminPlansApi.ts';
import { adminSettingsApi } from '../../api/adminSettingsApi.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

function getCurrencySymbol(currency: string): string {
  switch (currency?.toUpperCase()) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'AED':
      return 'AED ';
    case 'SGD':
      return 'S$';
    case 'AUD':
      return 'A$';
    case 'INR':
    default:
      return '₹';
  }
}

export function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<AdminPack | null>(null);
  const [deleteConfirmPack, setDeleteConfirmPack] = useState<AdminPack | null>(null);

  // Lock background scroll when plan modal is open
  useBodyScrollLock(Boolean(isModalOpen || editingPack || deleteConfirmPack));

  const { data: branding } = useQuery({
    queryKey: ['admin-branding-settings'],
    queryFn: adminSettingsApi.getBranding,
  });

  const platformCurrency = (branding?.defaultCurrency || 'INR').toUpperCase();
  const currencySymbol = getCurrencySymbol(platformCurrency);

  // Form State (credits-only + single price)
  const [formData, setFormData] = useState<CreatePlanPayload>({
    code: '',
    name: '',
    ordersCount: 1000,
    bonusCredits: 0,
    price: 499,
    isActive: true,
    sortOrder: 1,
  });

  const { data: packs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-plans-all'],
    queryFn: adminPlansApi.getAllPacks,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePlanPayload) => adminPlansApi.createPack(payload),
    onSuccess: () => {
      toast.success('Subscription plan created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-plans-all'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create plan.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreatePlanPayload> }) =>
      adminPlansApi.updatePack(id, payload),
    onSuccess: () => {
      toast.success('Subscription plan updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-plans-all'] });
      setIsModalOpen(false);
      setEditingPack(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update plan.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminPlansApi.deletePack(id),
    onSuccess: () => {
      toast.success('Plan deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-plans-all'] });
      setDeleteConfirmPack(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete plan.');
    },
  });

  const handleOpenCreate = () => {
    setEditingPack(null);
    setFormData({
      code: '',
      name: '',
      ordersCount: 1000,
      bonusCredits: 0,
      price: 499,
      isActive: true,
      sortOrder: packs.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pack: AdminPack) => {
    setEditingPack(pack);
    const existingPrice =
      platformCurrency === 'USD'
        ? Number(pack.priceUsd || pack.priceInr || 0)
        : Number(pack.priceInr || pack.priceUsd || 0);
    setFormData({
      code: pack.code,
      name: pack.name,
      ordersCount: pack.ordersCount,
      bonusCredits: pack.bonusCredits,
      price: existingPrice,
      isActive: pack.isActive,
      sortOrder: pack.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Code and Plan Name are required.');
      return;
    }

    const numericPrice = Number(formData.price) || 0;
    const payload: CreatePlanPayload = {
      ...formData,
      price: numericPrice,
      priceUsd: numericPrice,
      priceInr: numericPrice,
    };

    if (editingPack) {
      updateMutation.mutate({
        id: editingPack.id,
        payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredPacks = packs.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterActive === 'active') return matchesSearch && p.isActive;
    if (filterActive === 'inactive') return matchesSearch && !p.isActive;
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-20">
        {/* Modern Admin Page Header */}
        <AdminPageHeader
          title="Subscription & Credit Plans"
          description="Create, edit, and price order volume bundles, bonus rewards, and enterprise tier capabilities."
        >
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="px-3 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs text-white cursor-pointer"
            style={{ backgroundColor: 'var(--adm-primary)' }}
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        </AdminPageHeader>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search plans by name or code (e.g. PRO, STARTER)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-transparent focus:ring-1 focus:ring-emerald-500 outline-hidden"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterActive(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer capitalize ${
                  filterActive === status
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold'
                    : 'border text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                style={
                  filterActive !== status
                    ? { borderColor: 'var(--adm-border)', backgroundColor: 'var(--adm-surface)' }
                    : undefined
                }
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
            <span>Loading subscription plans catalogue...</span>
          </div>
        ) : filteredPacks.length === 0 ? (
          <div
            className="p-12 text-center rounded-xl border border-dashed flex flex-col items-center justify-center gap-3"
            style={{ borderColor: 'var(--adm-border)' }}
          >
            <Package className="w-10 h-10 text-neutral-400 opacity-60" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              No subscription plans match your search.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer"
              style={{ backgroundColor: 'var(--adm-primary)' }}
            >
              Create New Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPacks.map((pack) => {
              const displayPrice =
                platformCurrency === 'USD'
                  ? Number(pack.priceUsd || pack.priceInr || 0)
                  : Number(pack.priceInr || pack.priceUsd || 0);
              const isFree = pack.code === 'FREE' || displayPrice === 0;
              const isPopular = pack.code === 'PRO';
              const totalCredits = pack.ordersCount + (pack.bonusCredits || 0);

              return (
                <div
                  key={pack.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative ${
                    isPopular
                      ? 'border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                      : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                  style={{
                    backgroundColor: 'var(--adm-surface)',
                  }}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                        {pack.code}
                      </span>
                      {isPopular && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <Flame className="w-3 h-3" /> POPULAR
                        </span>
                      )}
                      {isFree && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          FREE TIER
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateMutation.mutate({
                          id: pack.id,
                          payload: { isActive: !pack.isActive },
                        })
                      }
                      title={pack.isActive ? 'Active Plan (Click to Disable)' : 'Inactive Plan (Click to Enable)'}
                      className="cursor-pointer"
                    >
                      {pack.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700">
                          <XCircle className="w-3 h-3 text-neutral-400" /> Inactive
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Plan Name & Price */}
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {pack.name}
                    </h3>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                        {currencySymbol}{displayPrice}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium">
                        {platformCurrency} • one-time
                      </span>
                    </div>

                    {/* Order Volume */}
                    <div
                      className="mt-3 p-3 rounded-xl border flex items-center justify-between"
                      style={{
                        backgroundColor: 'var(--adm-surface-subtle)',
                        borderColor: 'var(--adm-border)',
                      }}
                    >
                      <div>
                        <div className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
                          Order Capacity
                        </div>
                        <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                          <span>{pack.ordersCount.toLocaleString()} Orders</span>
                          {pack.bonusCredits > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              +{pack.bonusCredits.toLocaleString()} Bonus
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400">
                        {totalCredits.toLocaleString()} Total
                      </span>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="mt-5 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--adm-border)' }}>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Order: #{pack.sortOrder}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(pack)}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmPack(pack)}
                        className="p-1.5 text-xs font-medium rounded-lg border border-rose-300 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create or Edit Plan */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6"
              style={{
                backgroundColor: 'var(--adm-surface)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b mb-5" style={{ borderColor: 'var(--adm-border)' }}>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {editingPack ? `Edit Plan: ${editingPack.name}` : 'Create New Subscription Plan'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Configure order credits, bonus credits, and single price ({platformCurrency}).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Plan Code (Unique Identifier) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ULTRA_PRO"
                      value={formData.code}
                      disabled={Boolean(editingPack)}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border bg-transparent focus:ring-1 focus:ring-emerald-500 outline-hidden disabled:opacity-50"
                      style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ultra Pro Annual"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-transparent focus:ring-1 focus:ring-emerald-500 outline-hidden"
                      style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Base Order Credits *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1000"
                      value={formData.ordersCount}
                      onChange={(e) => setFormData({ ...formData, ordersCount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border bg-transparent focus:ring-1 focus:ring-emerald-500 outline-hidden"
                      style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Bonus Reward Credits (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="100"
                      value={formData.bonusCredits || 0}
                      onChange={(e) => setFormData({ ...formData, bonusCredits: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border bg-transparent focus:ring-1 focus:ring-emerald-500 outline-hidden"
                      style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Price ({currencySymbol.trim()} {platformCurrency}) *
                    </label>
                    <div className="relative">
                      <span className="text-xs font-bold absolute left-3 top-2 text-neutral-400">
                        {currencySymbol.trim()}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="499"
                        value={formData.price ?? 0}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border bg-transparent focus:ring-1 focus:ring-emerald-500 outline-hidden"
                        style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Sort Display Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.sortOrder || 1}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border bg-transparent focus:ring-1 focus:ring-emerald-500 outline-hidden"
                      style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    />
                  </div>
                </div>

                {/* Is Active Toggle */}
                <div className="pt-2 flex items-center justify-between border-t" style={{ borderColor: 'var(--adm-border)' }}>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active & Available for Purchase</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="px-5 py-2 text-xs font-bold text-white rounded-lg shadow-xs cursor-pointer"
                      style={{ backgroundColor: 'var(--adm-primary)' }}
                    >
                      {editingPack ? 'Update Plan' : 'Create Plan'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmPack && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div
              className="w-full max-w-md rounded-2xl border shadow-2xl p-6"
              style={{
                backgroundColor: 'var(--adm-surface)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Delete Plan: {deleteConfirmPack.name}?
                  </h3>
                  <p className="text-xs text-neutral-500">
                    This will permanently remove this pack option from the billing page. Existing restaurant credits are unaffected.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmPack(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deleteConfirmPack.id)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
