import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Coins,
  Sparkles,
  RotateCw,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { packsApi, type DynamicPack, type CreatePackInput } from './api/packsApi';
import { toast } from '../../components/ui';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const SuperAdminPlansPage: React.FC = () => {
  const [packs, setPacks] = useState<DynamicPack[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingPack, setEditingPack] = useState<DynamicPack | null>(null);

  useBodyScrollLock(isCreateModalOpen);

  // Form states
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formOrders, setFormOrders] = useState<number>(1000);
  const [formBonus, setFormBonus] = useState<number>(100);
  const [formPriceInr, setFormPriceInr] = useState<number>(299);
  const [formPriceUsd, setFormPriceUsd] = useState<number>(10);
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formFeatures, setFormFeatures] = useState<{
    dailyReports: boolean;
    multiLanguage: boolean;
    kitchenScreen: boolean;
    tvDisplay: boolean;
    multiCounter: boolean;
  }>({
    dailyReports: true,
    multiLanguage: false,
    kitchenScreen: true,
    tvDisplay: false,
    multiCounter: false,
  });

  const loadAllPacks = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await packsApi.getAllPacks();
      setPacks(data);
    } catch (err: any) {
      console.error('Failed to load admin packs:', err);
      // Fallback to active packs if admin endpoint restricted
      try {
        const fallback = await packsApi.getActivePacks();
        setPacks(fallback);
      } catch {}
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllPacks();
  }, []);

  const openCreateModal = () => {
    setEditingPack(null);
    setFormCode('');
    setFormName('');
    setFormOrders(1000);
    setFormBonus(100);
    setFormPriceInr(299);
    setFormPriceUsd(10);
    setFormSortOrder(packs.length + 1);
    setFormIsActive(true);
    setFormFeatures({
      dailyReports: true,
      multiLanguage: false,
      kitchenScreen: true,
      tvDisplay: false,
      multiCounter: false,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (pack: DynamicPack) => {
    setEditingPack(pack);
    setFormCode(pack.code);
    setFormName(pack.name);
    setFormOrders(pack.ordersCount);
    setFormBonus(pack.bonusCredits);
    setFormPriceInr(Number(pack.priceInr));
    setFormPriceUsd(Number(pack.priceUsd));
    setFormSortOrder(pack.sortOrder);
    setFormIsActive(pack.isActive);
    setFormFeatures({
      dailyReports: Boolean(pack.featuresJson?.dailyReports),
      multiLanguage: Boolean(pack.featuresJson?.multiLanguage),
      kitchenScreen: Boolean(pack.featuresJson?.kitchenScreen),
      tvDisplay: Boolean(pack.featuresJson?.tvDisplay),
      multiCounter: Boolean(pack.featuresJson?.multiCounter),
    });
    setIsCreateModalOpen(true);
  };

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      toast.error('Code and Name are required.');
      return;
    }

    try {
      if (editingPack) {
        await packsApi.updatePack(editingPack.id, {
          name: formName.trim(),
          ordersCount: Number(formOrders),
          bonusCredits: Number(formBonus),
          priceInr: Number(formPriceInr),
          priceUsd: Number(formPriceUsd),
          sortOrder: Number(formSortOrder),
          isActive: formIsActive,
          featuresJson: formFeatures,
        });
        toast.success(`Pack "${formName}" updated successfully!`);
      } else {
        await packsApi.createPack({
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          ordersCount: Number(formOrders),
          bonusCredits: Number(formBonus),
          priceInr: Number(formPriceInr),
          priceUsd: Number(formPriceUsd),
          sortOrder: Number(formSortOrder),
          isActive: formIsActive,
          featuresJson: formFeatures,
        });
        toast.success(`New pack "${formName}" created successfully!`);
      }

      setIsCreateModalOpen(false);
      loadAllPacks(true);
    } catch (err: any) {
      console.error('Error saving pack:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save pack.');
    }
  };

  const handleToggleActive = async (pack: DynamicPack) => {
    try {
      await packsApi.updatePack(pack.id, {
        isActive: !pack.isActive,
      });
      toast.success(`Pack ${pack.code} is now ${!pack.isActive ? 'Active' : 'Inactive'}`);
      loadAllPacks(true);
    } catch (err: any) {
      toast.error('Failed to update pack status.');
    }
  };

  const handleDelete = async (pack: DynamicPack) => {
    if (!window.confirm(`Are you sure you want to delete pack "${pack.name}"?`)) return;

    try {
      await packsApi.deletePack(pack.id);
      toast.success(`Pack "${pack.name}" deleted.`);
      loadAllPacks(true);
    } catch (err: any) {
      toast.error('Failed to delete pack.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-black uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin Portal</span>
            </div>
            <h1 className="text-2xl font-black text-text tracking-tight flex items-center gap-2">
              <Coins className="w-6 h-6 text-primary" />
              <span>Dynamic Plans & Pricing Engine</span>
            </h1>
            <p className="text-xs text-muted mt-1">
              Configure database-driven credit tiers, regional pricing, bonuses, and feature tier permissions without code redeployments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadAllPacks(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-border bg-surface text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer shadow-2xs"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-on-primary shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>
        </div>

        {/* Plans Management Table */}
        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-2/60 text-muted uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code & Name</th>
                  <th className="py-3 px-4 text-center">Base Orders</th>
                  <th className="py-3 px-4 text-center">Bonus Credits</th>
                  <th className="py-3 px-4 text-right">Price (INR)</th>
                  <th className="py-3 px-4 text-right">Price (USD)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {packs.map((pack) => (
                  <tr key={pack.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-surface-2 border border-border text-primary">
                          {pack.code}
                        </span>
                        <span className="font-bold text-text">{pack.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-text">
                      {pack.ordersCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {pack.bonusCredits > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          +{pack.bonusCredits.toLocaleString()} Free
                        </span>
                      ) : (
                        <span className="text-muted text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-text">
                      ₹{Number(pack.priceInr).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-text">
                      ${Number(pack.priceUsd).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(pack)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold cursor-pointer transition-colors ${
                          pack.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-border'
                        }`}
                      >
                        {pack.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{pack.isActive ? 'Active' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(pack)}
                          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                          title="Edit Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pack)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="text-base font-bold text-text flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  <span>{editingPack ? `Edit Plan: ${editingPack.name}` : 'Create New Promotional Plan'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-surface-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePack} className="space-y-4 pt-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text block mb-1">Plan Code</label>
                    <input
                      type="text"
                      disabled={Boolean(editingPack)}
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. MEGA_BOOSTER"
                      required
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-surface-2 border border-border text-text disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Festival Mega Pack"
                      required
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-2 border border-border text-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text block mb-1">Base Orders Count</label>
                    <input
                      type="number"
                      min={1}
                      value={formOrders}
                      onChange={(e) => setFormOrders(Number(e.target.value))}
                      required
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-2 border border-border text-text"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text block mb-1">Bonus Credits (Free)</label>
                    <input
                      type="number"
                      min={0}
                      value={formBonus}
                      onChange={(e) => setFormBonus(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-2 border border-border text-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text block mb-1">Price (INR ₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formPriceInr}
                      onChange={(e) => setFormPriceInr(Number(e.target.value))}
                      required
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-2 border border-border text-text"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text block mb-1">Price (USD $)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formPriceUsd}
                      onChange={(e) => setFormPriceUsd(Number(e.target.value))}
                      required
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-2 border border-border text-text"
                    />
                  </div>
                </div>

                {/* Features Checkboxes */}
                <div>
                  <label className="text-xs font-bold text-text block mb-2">Feature Tier Unlocks</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-2/60 border border-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formFeatures.dailyReports}
                        onChange={(e) => setFormFeatures({ ...formFeatures, dailyReports: e.target.checked })}
                      />
                      <span>Daily Sales Reports</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-2/60 border border-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formFeatures.kitchenScreen}
                        onChange={(e) => setFormFeatures({ ...formFeatures, kitchenScreen: e.target.checked })}
                      />
                      <span>Kitchen KDS Display</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-2/60 border border-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formFeatures.multiLanguage}
                        onChange={(e) => setFormFeatures({ ...formFeatures, multiLanguage: e.target.checked })}
                      />
                      <span>AI Multi-Language</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-2/60 border border-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formFeatures.tvDisplay}
                        onChange={(e) => setFormFeatures({ ...formFeatures, tvDisplay: e.target.checked })}
                      />
                      <span>TV Pickup Board</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-text hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-on-primary shadow-sm"
                  >
                    {editingPack ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
