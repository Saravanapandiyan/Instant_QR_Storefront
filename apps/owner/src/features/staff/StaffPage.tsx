import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Store,
  Shield,
  ChefHat,
  CreditCard,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Check,
  AlertTriangle,
  KeyRound,
  FileText,
  UtensilsCrossed,
  LayoutDashboard,
  Layers,
  Tv,
  BarChart3,
  Coins,
  ClipboardList,
} from 'lucide-react';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { staffApi } from './api/staffApi';
import { usePermissions } from '../../hooks/usePermissions';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { toast } from '../../components/ui';
import {
  ROLE_PRESET_PERMISSIONS,
  type StaffMember,
  type StaffRole,
  type StaffPermissions,
  type PagePermissions,
} from '@instant-qr/shared-types';

export const StaffPage: React.FC = () => {
  const { restaurants = [], isLoading: isLoadingRestaurants } = useRestaurants();
  const { can, isOwner } = usePermissions();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const [rolePreset, setRolePreset] = useState<StaffRole>('CASHIER');
  const [branchAccessMode, setBranchAccessMode] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<StaffPermissions>(ROLE_PRESET_PERMISSIONS.CASHIER);

  // Auto-select first restaurant
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  const activeRestaurant = useMemo(() => {
    return restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0] || null;
  }, [restaurants, selectedRestaurantId]);

  const branches = useMemo(() => {
    return activeRestaurant?.branches || [];
  }, [activeRestaurant]);

  // Load staff members for selected restaurant
  const loadStaff = async () => {
    if (!selectedRestaurantId) return;
    setIsLoadingStaff(true);
    try {
      const data = await staffApi.getByRestaurant(selectedRestaurantId);
      setStaffList(data);
    } catch (err: any) {
      console.error('Failed to load staff list', err);
      toast.error(err.response?.data?.message || err.message || 'Could not fetch team members', 'Error loading staff');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [selectedRestaurantId]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    setName('');
    setEmail('');
    setPhone('');
    setCountryCode('+91');
    setPassword('Staff@1234');
    setShowPassword(false);
    setPinCode('');
    setRolePreset('CASHIER');
    setBranchAccessMode('ALL');
    setSelectedBranches([]);
    setPermissions(ROLE_PRESET_PERMISSIONS.CASHIER);
    setIsModalOpen(true);
  };

  // Helper to ensure permissions object is fully formed with all modules and page-wise controls
  const normalizePermissions = (raw: any, role: StaffRole = 'CUSTOM'): StaffPermissions => {
    const fallback = ROLE_PRESET_PERMISSIONS[role] || ROLE_PRESET_PERMISSIONS.CUSTOM;
    const defaultPages = fallback.pages || {
      overview: false,
      orders: false,
      kds: true,
      tv: false,
      analytics: false,
      branches: false,
      menu: false,
      staff: false,
      billing: false,
      payments: false,
    };

    const rawPages = raw?.pages || {};
    const pages: PagePermissions = {
      overview: Boolean(rawPages.overview ?? raw?.overview?.view ?? defaultPages.overview),
      orders: Boolean(rawPages.orders ?? raw?.orders?.view ?? defaultPages.orders),
      kds: Boolean(rawPages.kds ?? raw?.orders?.view ?? defaultPages.kds),
      tv: Boolean(rawPages.tv ?? raw?.orders?.view ?? defaultPages.tv),
      analytics: Boolean(rawPages.analytics ?? raw?.overview?.view ?? defaultPages.analytics),
      branches: Boolean(rawPages.branches ?? raw?.branches?.view ?? defaultPages.branches),
      menu: Boolean(rawPages.menu ?? raw?.menu?.view ?? defaultPages.menu),
      staff: Boolean(rawPages.staff ?? raw?.staff?.view ?? defaultPages.staff),
      billing: Boolean(rawPages.billing ?? raw?.payments?.view ?? defaultPages.billing),
      payments: Boolean(rawPages.payments ?? raw?.payments?.view ?? defaultPages.payments),
    };

    if (!raw || typeof raw !== 'object') {
      return { ...fallback, pages };
    }

    return {
      pages,
      orders: {
        view: Boolean(raw.orders?.view ?? (pages.orders || pages.kds || pages.tv)),
        accept: Boolean(raw.orders?.accept ?? fallback.orders.accept),
        collectCash: Boolean(raw.orders?.collectCash ?? fallback.orders.collectCash),
        cancel: Boolean(raw.orders?.cancel ?? fallback.orders.cancel),
      },
      menu: {
        view: Boolean(raw.menu?.view ?? pages.menu),
        create: Boolean(raw.menu?.create ?? fallback.menu.create),
        edit: Boolean(raw.menu?.edit ?? fallback.menu.edit),
        delete: Boolean(raw.menu?.delete ?? fallback.menu.delete),
        toggleStock: Boolean(raw.menu?.toggleStock ?? fallback.menu.toggleStock),
      },
      branches: {
        view: Boolean(raw.branches?.view ?? pages.branches),
        create: Boolean(raw.branches?.create ?? fallback.branches.create),
        edit: Boolean(raw.branches?.edit ?? fallback.branches.edit),
        delete: Boolean(raw.branches?.delete ?? fallback.branches.delete),
        manageTables: Boolean(raw.branches?.manageTables ?? fallback.branches.manageTables),
      },
      overview: {
        view: Boolean(raw.overview?.view ?? (pages.overview || pages.analytics)),
        viewFinancials: Boolean(raw.overview?.viewFinancials ?? fallback.overview.viewFinancials),
      },
      payments: {
        view: Boolean(raw.payments?.view ?? (pages.payments || pages.billing)),
        manage: Boolean(raw.payments?.manage ?? fallback.payments.manage),
      },
      staff: {
        view: Boolean(raw.staff?.view ?? pages.staff),
        manage: Boolean(raw.staff?.manage ?? fallback.staff.manage),
      },
    };
  };

  // Helper to extract clean badges for the staff list table
  const getAllowedPageBadges = (staff: StaffMember) => {
    const p = normalizePermissions(staff.permissions, staff.role as StaffRole);
    const pages = p.pages!;
    const badges: { key: string; label: string; color: string }[] = [];

    if (pages.kds) badges.push({ key: 'kds', label: 'Kitchen (KDS)', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' });
    if (pages.orders) badges.push({ key: 'orders', label: 'Live Orders', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' });
    if (pages.overview) badges.push({ key: 'overview', label: 'Overview', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' });
    if (pages.tv) badges.push({ key: 'tv', label: 'TV Order Board', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20' });
    if (pages.analytics) badges.push({ key: 'analytics', label: 'Sales & Analytics', color: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20' });
    if (pages.menu) badges.push({ key: 'menu', label: 'Digital Menu', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' });
    if (pages.branches) badges.push({ key: 'branches', label: 'Branches', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20' });
    if (pages.staff) badges.push({ key: 'staff', label: 'Staff & Roles', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' });
    if (pages.billing) badges.push({ key: 'billing', label: 'Plans & Credits', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20' });
    if (pages.payments) badges.push({ key: 'payments', label: 'Payment Settings', color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20' });

    return badges;
  };

  // Open modal for Edit
  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setName(staff.user?.name || '');
    setEmail(staff.user?.email || '');
    setPhone(staff.user?.phone || '');
    setCountryCode(staff.user?.countryCode || '+91');
    setPassword('');
    setShowPassword(false);
    setPinCode(staff.pinCode || '');

    const currentRole = (staff.role as StaffRole) || 'CUSTOM';
    setRolePreset(currentRole);

    const assigned = Array.isArray(staff.assignedBranches) ? staff.assignedBranches : [];
    if (assigned.includes('ALL') || assigned.length === 0) {
      setBranchAccessMode('ALL');
      setSelectedBranches([]);
    } else {
      setBranchAccessMode('SPECIFIC');
      setSelectedBranches(assigned);
    }

    setPermissions(normalizePermissions(staff.permissions, currentRole));
    setIsModalOpen(true);
  };

  // Switch role template
  const handleRolePresetChange = (preset: StaffRole) => {
    setRolePreset(preset);
    if (preset !== 'CUSTOM') {
      setPermissions(ROLE_PRESET_PERMISSIONS[preset]);
    }
  };

  // Toggle page-level access
  const handlePageToggle = (pageKey: keyof PagePermissions, value: boolean) => {
    setRolePreset('CUSTOM');
    setPermissions((prev) => {
      const safe = normalizePermissions(prev, 'CUSTOM');
      const updatedPages: PagePermissions = {
        ...safe.pages!,
        [pageKey]: value,
      };

      return {
        ...safe,
        pages: updatedPages,
        orders: {
          ...safe.orders,
          view: Boolean(updatedPages.orders || updatedPages.kds || updatedPages.tv),
        },
        menu: {
          ...safe.menu,
          view: updatedPages.menu,
        },
        branches: {
          ...safe.branches,
          view: updatedPages.branches,
        },
        overview: {
          ...safe.overview,
          view: Boolean(updatedPages.overview || updatedPages.analytics),
        },
        payments: {
          ...safe.payments,
          view: Boolean(updatedPages.payments || updatedPages.billing),
        },
        staff: {
          ...safe.staff,
          view: updatedPages.staff,
        },
      };
    });
  };

  // Toggle individual action permission
  const handlePermissionToggle = (
    moduleKey: keyof Omit<StaffPermissions, 'pages'>,
    actionKey: string,
    value: boolean
  ) => {
    setRolePreset('CUSTOM');
    setPermissions((prev) => {
      const safePrev = normalizePermissions(prev, 'CUSTOM');
      return {
        ...safePrev,
        [moduleKey]: {
          ...(safePrev[moduleKey] as any),
          [actionKey]: value,
        },
      };
    });
  };

  // Toggle branch selection
  const handleBranchToggle = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  // Submit Modal (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId) return;

    if (!isOwner && !can('staff', 'manage')) {
      toast.error('You do not have permission to manage team members.', 'Access Restricted');
      return;
    }

    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required.', 'Validation Error');
      return;
    }

    if (branchAccessMode === 'SPECIFIC' && selectedBranches.length === 0) {
      toast.error('Please select at least one branch or choose "All Outlets".', 'Branch Required');
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedBranches = branchAccessMode === 'ALL' ? ['ALL'] : selectedBranches;

      if (editingStaff) {
        // STRICT FIX: only pass password if explicitly provided with length >= 6
        await staffApi.update(editingStaff.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          countryCode: countryCode.trim() || undefined,
          password: password.trim().length >= 6 ? password.trim() : undefined,
          pinCode: pinCode.trim() || undefined,
          role: rolePreset,
          assignedBranches,
          permissions,
        });

        toast.success(`${name} has been updated successfully.`, 'Staff Updated');
      } else {
        await staffApi.create(selectedRestaurantId, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          countryCode: countryCode.trim() || undefined,
          password: password.trim() ? password.trim() : 'Staff@1234',
          pinCode: pinCode.trim() || undefined,
          role: rolePreset,
          assignedBranches,
          permissions,
        });

        toast.success(`${name} has been added to your restaurant team.`, 'Staff Member Created');
      }

      setIsModalOpen(false);
      loadStaff();
    } catch (err: any) {
      console.error('Failed to save staff member', err);
      toast.error(err.response?.data?.message || err.message || 'Something went wrong', 'Failed to Save');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (staff: StaffMember) => {
    try {
      await staffApi.toggleActive(staff.id);
      toast.success(
        `${staff.user?.name || 'Staff member'} status updated.`,
        staff.isActive ? 'Staff Deactivated' : 'Staff Activated'
      );
      loadStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update status', 'Error');
    }
  };

  // Remove staff
  const handleRemove = async (staff: StaffMember) => {
    const confirm = window.confirm(
      `Are you sure you want to remove ${staff.user?.name || 'this team member'} from ${
        activeRestaurant?.name
      }?`
    );
    if (!confirm) return;

    try {
      await staffApi.remove(staff.id);
      toast.success('Team member has been removed.', 'Staff Removed');
      loadStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not remove member', 'Error');
    }
  };

  return (
    <DashboardLayout
      branchCount={branches.length}
      restaurantCount={restaurants.length}
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">Staff & Roles</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {staffList.length} Members
            </span>
          </div>
          <p className="text-sm text-muted mt-1">
            Manage team accounts, assign branch access, and configure granular permissions.
          </p>
        </div>

        {/* Restaurant Brand Selector & Add Button */}
        <div className="flex items-center gap-3 flex-wrap">
          {restaurants.length > 1 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted" />
              <select
                aria-label="Select Restaurant Brand"
                className="bg-surface border border-border text-text rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
              >
                {restaurants.map((rest) => (
                  <option key={rest.id} value={rest.id} className="bg-surface text-text">
                    {rest.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(isOwner || can('staff', 'manage')) && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Restaurant Information Banner */}
      {activeRestaurant && (
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center font-bold text-text text-sm shrink-0">
              {activeRestaurant.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-text text-sm">{activeRestaurant.name}</div>
              <div className="text-xs text-muted">
                {branches.length} branch {branches.length === 1 ? 'outlet' : 'outlets'} connected
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Shield className="w-4 h-4 text-primary" />
            <span>Root Owner: You have full administrative control</span>
          </div>
        </div>
      )}

      {/* Staff Members List */}
      <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="font-bold text-text text-base">Active Team Members</div>
          <span className="text-xs text-muted">
            {staffList.filter((s) => s.isActive).length} active,{' '}
            {staffList.filter((s) => !s.isActive).length} inactive
          </span>
        </div>

        {isLoadingStaff ? (
          <div className="p-12 text-center text-muted text-sm">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading team members...
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mx-auto text-muted">
              <Users size={24} />
            </div>
            <div className="font-bold text-text text-base">No staff members created yet</div>
            <p className="text-xs text-muted max-w-md mx-auto">
              Add cashier, manager, or kitchen staff accounts so your team can log in with restricted
              access to specific branches and orders.
            </p>
            {(isOwner || can('staff', 'manage')) && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <UserPlus size={15} />
                <span>Add Your First Member</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-2 border-b border-border text-muted font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Branch Access</th>
                  <th className="py-3 px-4">Quick PIN</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffList.map((staff) => {
                  const assigned = Array.isArray(staff.assignedBranches) ? staff.assignedBranches : [];
                  const isAll = assigned.includes('ALL') || assigned.length === 0;

                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-surface-2/60 transition-colors ${
                        !staff.isActive ? 'opacity-60 bg-surface-2/30' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-soft text-primary-soft-text flex items-center justify-center font-bold text-xs shrink-0">
                            {staff.user?.name ? staff.user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-text text-sm">
                              {staff.user?.name || 'Unnamed Staff'}
                            </div>
                            <div className="text-muted text-[11px]">
                              {staff.user?.email}
                              {staff.user?.phone && ` • ${staff.user?.countryCode || '+91'} ${staff.user?.phone}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Preset Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            staff.role === 'MANAGER'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : staff.role === 'CASHIER'
                              ? 'bg-success/10 text-success border border-success/20'
                              : staff.role === 'KITCHEN'
                              ? 'bg-warning/10 text-warning border border-warning/20'
                              : 'bg-surface-2 text-text border border-border'
                          }`}
                        >
                          {staff.role === 'MANAGER' && <Shield size={12} />}
                          {staff.role === 'CASHIER' && <CreditCard size={12} />}
                          {staff.role === 'KITCHEN' && <ChefHat size={12} />}
                          <span>{staff.role}</span>
                        </span>
                      </td>

                      {/* Branch Access */}
                      <td className="py-3 px-4">
                        {isAll ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-2 text-text text-xs font-semibold border border-border">
                            <Store size={12} className="text-primary" />
                            All Outlets
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assigned.map((bId) => {
                              const match = branches.find((b) => b.id === bId);
                              return (
                                <span
                                  key={bId}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-2 text-muted text-[11px] font-medium border border-border"
                                >
                                  {match?.name || 'Branch'}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Quick PIN */}
                      <td className="py-3 px-4">
                        {staff.pinCode ? (
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-2 text-text border border-border">
                            •••• ({staff.pinCode})
                          </span>
                        ) : (
                          <span className="text-muted text-[11px]">None</span>
                        )}
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3 px-4">
                        {isOwner || can('staff', 'manage') ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(staff)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              staff.isActive
                                ? 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
                                : 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20'
                            }`}
                          >
                            {staff.isActive ? (
                              <>
                                <CheckCircle2 size={12} />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={12} />
                                <span>Suspended</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold select-none ${
                              staff.isActive
                                ? 'bg-success/10 text-success border border-success/20'
                                : 'bg-danger/10 text-danger border border-danger/20'
                            }`}
                          >
                            {staff.isActive ? (
                              <>
                                <CheckCircle2 size={12} />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={12} />
                                <span>Suspended</span>
                              </>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isOwner || can('staff', 'manage') ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(staff)}
                              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                              title="Edit Permissions"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(staff)}
                              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted italic">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          ADD / EDIT STAFF MEMBER MODAL
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-backdrop backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-2/40">
              <div>
                <h3 className="font-bold text-text text-base">
                  {editingStaff ? 'Edit Team Member & Permissions' : 'Add New Team Member'}
                </h3>
                <p className="text-xs text-muted">
                  Assign branch outlets and customize page access for {activeRestaurant?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 cursor-pointer transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 1. Basic Account Information */}
              <div className="space-y-4">
                <div className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Users size={14} className="text-primary" />
                  <span>Account Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-text focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. cashier@ananda.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-text focus:outline-none focus:border-primary"
                    />
                    {editingStaff && email.includes('@instantqr.internal') && (
                      <p className="text-[10px] text-primary mt-1">
                        💡 Auto-generated setup email. You can replace this with a real email address, or log in with the registered phone number + PIN.
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="+91"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-16 px-2.5 py-2 text-xs rounded-xl bg-surface border border-border text-text text-center focus:outline-none focus:border-primary"
                      />
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface border border-border text-text focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Quick POS PIN */}
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1 flex items-center justify-between">
                      <span>Quick 4-Digit POS PIN</span>
                      <span className="text-[10px] text-muted font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <KeyRound size={14} className="absolute left-3 top-2.5 text-muted" />
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="e.g. 1234"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface border border-border text-text focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-text mb-1 flex items-center justify-between">
                      <span>{editingStaff ? 'New Password (Leave blank to keep current)' : 'Login Password'}</span>
                      <span className="text-[10px] text-muted font-normal">Min 6 characters</span>
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-2.5 text-muted" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={editingStaff ? '••••••••' : 'Staff@1234'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-surface border border-border text-text focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted hover:text-text cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Branch Access Scoping */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Store size={14} className="text-primary" />
                  <span>Branch Outlet Access</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      branchAccessMode === 'ALL'
                        ? 'bg-primary-soft/40 border-primary text-text'
                        : 'bg-surface border-border text-muted hover:bg-surface-2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="branchAccess"
                      checked={branchAccessMode === 'ALL'}
                      onChange={() => setBranchAccessMode('ALL')}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <div className="font-bold text-xs text-text">All Current & Future Branches</div>
                      <div className="text-[11px] text-muted mt-0.5">
                        Member can switch between any outlet under {activeRestaurant?.name}
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      branchAccessMode === 'SPECIFIC'
                        ? 'bg-primary-soft/40 border-primary text-text'
                        : 'bg-surface border-border text-muted hover:bg-surface-2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="branchAccess"
                      checked={branchAccessMode === 'SPECIFIC'}
                      onChange={() => setBranchAccessMode('SPECIFIC')}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <div className="font-bold text-xs text-text">Specific Outlets Only</div>
                      <div className="text-[11px] text-muted mt-0.5">
                        Restrict access exclusively to selected physical branches
                      </div>
                    </div>
                  </label>
                </div>

                {/* Specific Branch Checkboxes */}
                {branchAccessMode === 'SPECIFIC' && (
                  <div className="p-3.5 rounded-xl bg-surface-2 border border-border space-y-2">
                    <div className="text-xs font-bold text-text">Select Allowed Branches:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {branches.map((b) => (
                        <label
                          key={b.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border text-xs cursor-pointer hover:bg-surface-2"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(b.id)}
                            onChange={() => handleBranchToggle(b.id)}
                            className="rounded accent-primary"
                          />
                          <span className="font-semibold text-text">{b.name}</span>
                          {b.address && (
                            <span className="text-[10px] text-muted truncate">({b.address})</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Role Preset Selector */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Shield size={14} className="text-primary" />
                  <span>Role Preset (Auto-Configures Permissions)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'MANAGER' as StaffRole, label: 'Manager', icon: Shield, desc: 'Full branch operations' },
                    { id: 'CASHIER' as StaffRole, label: 'Cashier & POS', icon: CreditCard, desc: 'Accept orders & cash' },
                    { id: 'KITCHEN' as StaffRole, label: 'Kitchen / Chef', icon: ChefHat, desc: 'Kitchen queue & 86 stock' },
                    { id: 'CUSTOM' as StaffRole, label: 'Custom', icon: Layers, desc: 'Individual checkboxes' },
                  ].map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = rolePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleRolePresetChange(preset.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary-soft border-primary shadow-xs'
                            : 'bg-surface border-border hover:bg-surface-2'
                        }`}
                      >
                        <Icon
                          size={16}
                          className={isSelected ? 'text-primary' : 'text-muted'}
                        />
                        <div
                          className={`font-bold text-xs mt-1.5 ${
                            isSelected ? 'text-primary-soft-text' : 'text-text'
                          }`}
                        >
                          {preset.label}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5 leading-tight">
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Page-Wise Menu Access & Fine-Grained Permissions */}
              <div className="space-y-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider text-muted">
                      Page-Wise Menu Access
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      Enable exact sidebar navigation menus for this staff member (e.g. Kitchen only sees Kitchen (KDS))
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-primary">
                    Exact Sidebar Matching
                  </span>
                </div>

                {/* --- GROUP 1: OPERATE --- */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>OPERATE PAGES</span>
                  </div>

                  {/* 1. Kitchen (KDS) */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      permissions.pages?.kds
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                          <ChefHat size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>Kitchen (KDS)</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/kds</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            Cooking queue display for kitchen chefs to view tickets and mark dishes ready
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.kds ?? false}
                          onChange={(e) => handlePageToggle('kds', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* 2. Live Orders */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                      permissions.pages?.orders
                        ? 'bg-blue-500/5 border-blue-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                          <ClipboardList size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>Live Orders</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/orders</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            Cashier desk queue to accept incoming orders, print bills, and collect payments
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.orders ?? false}
                          onChange={(e) => handlePageToggle('orders', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>

                    {/* Sub-actions for Live Orders */}
                    {permissions.pages?.orders && (
                      <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                          <input
                            type="checkbox"
                            checked={permissions.orders?.accept ?? false}
                            onChange={(e) => handlePermissionToggle('orders', 'accept', e.target.checked)}
                            className="rounded accent-primary"
                          />
                          <span>Accept / Dispatch Order</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                          <input
                            type="checkbox"
                            checked={permissions.orders?.collectCash ?? false}
                            onChange={(e) => handlePermissionToggle('orders', 'collectCash', e.target.checked)}
                            className="rounded accent-primary"
                          />
                          <span>Collect Cash at Counter</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                          <input
                            type="checkbox"
                            checked={permissions.orders?.cancel ?? false}
                            onChange={(e) => handlePermissionToggle('orders', 'cancel', e.target.checked)}
                            className="rounded accent-danger"
                          />
                          <span>Cancel Orders (Restricted)</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 3. TV Order Board */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      permissions.pages?.tv
                        ? 'bg-indigo-500/5 border-indigo-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                          <Tv size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>TV Order Board</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/tv</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            Fullscreen customer queue status display for kitchen pickup counters
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.tv ?? false}
                          onChange={(e) => handlePageToggle('tv', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* 4. Overview */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      permissions.pages?.overview
                        ? 'bg-purple-500/5 border-purple-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                          <LayoutDashboard size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>Overview</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            Main store dashboard with live daily summaries, order counters, and setup checklists
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.overview ?? false}
                          onChange={(e) => handlePageToggle('overview', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* 5. Sales & Analytics */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      permissions.pages?.analytics
                        ? 'bg-teal-500/5 border-teal-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                          <BarChart3 size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>Sales & Analytics</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/analytics</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            Financial reports, revenue trends, top-selling items, and outlet volume metrics
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.analytics ?? false}
                          onChange={(e) => handlePageToggle('analytics', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* --- GROUP 2: MANAGE --- */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>MANAGE PAGES</span>
                  </div>

                  {/* 6. Branches */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                      permissions.pages?.branches
                        ? 'bg-orange-500/5 border-orange-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                          <Store size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>Branches</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/branches</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            Branch outlets, Dine-in QR standees, and physical table management
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.branches ?? false}
                          onChange={(e) => handlePageToggle('branches', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    {permissions.pages?.branches && (
                      <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                          <input
                            type="checkbox"
                            checked={permissions.branches?.create ?? false}
                            onChange={(e) => handlePermissionToggle('branches', 'create', e.target.checked)}
                            className="rounded accent-primary"
                          />
                          <span>Create / Edit Outlets</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                          <input
                            type="checkbox"
                            checked={permissions.branches?.manageTables ?? false}
                            onChange={(e) => handlePermissionToggle('branches', 'manageTables', e.target.checked)}
                            className="rounded accent-primary"
                          />
                          <span>Manage Tables & QR</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                          <input
                            type="checkbox"
                            checked={permissions.branches?.delete ?? false}
                            onChange={(e) => handlePermissionToggle('branches', 'delete', e.target.checked)}
                            className="rounded accent-danger"
                          />
                          <span>Delete Branch</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 7. Digital Menu */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                      permissions.pages?.menu
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <UtensilsCrossed size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>Digital Menu</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/menu</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            Food catalog, dishes, pricing, AI translation, and 86 stock toggles
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.menu ?? false}
                          onChange={(e) => handlePageToggle('menu', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {permissions.pages?.menu && (
                      <div className="pt-2 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                          <input
                            type="checkbox"
                            checked={permissions.menu?.create ?? false}
                            onChange={(e) => handlePermissionToggle('menu', 'create', e.target.checked)}
                            className="rounded accent-primary"
                          />
                          <span>Add Dishes & Categories</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                          <input
                            type="checkbox"
                            checked={permissions.menu?.edit ?? false}
                            onChange={(e) => handlePermissionToggle('menu', 'edit', e.target.checked)}
                            className="rounded accent-primary"
                          />
                          <span>Edit Items & Prices</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                          <input
                            type="checkbox"
                            checked={permissions.menu?.delete ?? false}
                            onChange={(e) => handlePermissionToggle('menu', 'delete', e.target.checked)}
                            className="rounded accent-danger"
                          />
                          <span>Delete Items</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-success font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.menu?.toggleStock ?? false}
                            onChange={(e) => handlePermissionToggle('menu', 'toggleStock', e.target.checked)}
                            className="rounded accent-success"
                          />
                          <span>Toggle Stock (In/Out 86)</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* 8. Staff & Roles */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                      permissions.pages?.staff
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                          <Users size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>Staff & Roles</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/staff</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            Invite team members, assign POS PINs, and configure permissions
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.staff ?? false}
                          onChange={(e) => handlePageToggle('staff', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>

                    {permissions.pages?.staff && (
                      <div className="pt-2 border-t border-border/60">
                        <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                          <input
                            type="checkbox"
                            checked={permissions.staff?.manage ?? false}
                            onChange={(e) => handlePermissionToggle('staff', 'manage', e.target.checked)}
                            className="rounded accent-danger"
                          />
                          <span>Create, Edit & Remove Team Members</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- GROUP 3: BILLING & CREDITS --- */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>BILLING & CREDITS PAGES</span>
                  </div>

                  {/* 9. Plans & Credits */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      permissions.pages?.billing
                        ? 'bg-yellow-500/5 border-yellow-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0">
                          <Coins size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>Plans & Credits</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/billing</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            Storefront subscription tier, AI import credits, and payment transaction history
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.billing ?? false}
                          onChange={(e) => handlePageToggle('billing', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* 10. Payment Settings */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                      permissions.pages?.payments
                        ? 'bg-cyan-500/5 border-cyan-500/30'
                        : 'bg-surface border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
                          <CreditCard size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text flex items-center gap-2">
                            <span>Payment Settings</span>
                            <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.2 rounded border border-border">/payments</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            UPI IDs, QR payment codes, Cash on Counter toggles, and online gateways
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.pages?.payments ?? false}
                          onChange={(e) => handlePageToggle('payments', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>

                    {permissions.pages?.payments && (
                      <div className="pt-2 border-t border-border/60">
                        <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                          <input
                            type="checkbox"
                            checked={permissions.payments?.manage ?? false}
                            onChange={(e) => handlePermissionToggle('payments', 'manage', e.target.checked)}
                            className="rounded accent-danger"
                          />
                          <span>Configure Payment Gateways & UPI Keys</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-xs font-bold text-text cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingStaff ? 'Save Changes' : 'Create Team Member'}</span>
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
