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

    setPermissions(staff.permissions);
    setIsModalOpen(true);
  };

  // Switch role template
  const handleRolePresetChange = (preset: StaffRole) => {
    setRolePreset(preset);
    if (preset !== 'CUSTOM') {
      setPermissions(ROLE_PRESET_PERMISSIONS[preset]);
    }
  };

  // Toggle individual permission
  const handlePermissionToggle = (
    moduleKey: keyof StaffPermissions,
    actionKey: string,
    value: boolean
  ) => {
    setRolePreset('CUSTOM');
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [actionKey]: value,
      },
    }));
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
        await staffApi.update(editingStaff.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          countryCode: countryCode.trim() || undefined,
          password: password ? password : undefined,
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
          password: password || 'Staff@1234',
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
                      disabled={Boolean(editingStaff)}
                      placeholder="e.g. cashier@ananda.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-text focus:outline-none focus:border-primary disabled:opacity-60"
                    />
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

              {/* 4. Fine-Grained Permissions Matrix */}
              <div className="space-y-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs uppercase tracking-wider text-muted">
                    Granular Permission Controls
                  </div>
                  <span className="text-[11px] text-muted">
                    Toggle individual actions to restrict Edit or Delete
                  </span>
                </div>

                {/* Module 1: Live Orders */}
                <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-primary" />
                      <span className="font-bold text-xs text-text">Live Orders & Kitchen Queue</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.orders.view}
                        onChange={(e) =>
                          handlePermissionToggle('orders', 'view', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>View Orders Page</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                      <input
                        type="checkbox"
                        checked={permissions.orders.accept}
                        onChange={(e) =>
                          handlePermissionToggle('orders', 'accept', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>Accept / Dispatch Order</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                      <input
                        type="checkbox"
                        checked={permissions.orders.collectCash}
                        onChange={(e) =>
                          handlePermissionToggle('orders', 'collectCash', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>Mark Cash Collected</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                      <input
                        type="checkbox"
                        checked={permissions.orders.cancel}
                        onChange={(e) =>
                          handlePermissionToggle('orders', 'cancel', e.target.checked)
                        }
                        className="rounded accent-danger"
                      />
                      <span>Cancel Order (Restricted)</span>
                    </label>
                  </div>
                </div>

                {/* Module 2: Digital Menu */}
                <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed size={15} className="text-primary" />
                      <span className="font-bold text-xs text-text">Digital Menu Catalog</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.menu.view}
                        onChange={(e) =>
                          handlePermissionToggle('menu', 'view', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>View Menu Page</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                      <input
                        type="checkbox"
                        checked={permissions.menu.create}
                        onChange={(e) =>
                          handlePermissionToggle('menu', 'create', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>Add Dishes / Categories</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                      <input
                        type="checkbox"
                        checked={permissions.menu.edit}
                        onChange={(e) =>
                          handlePermissionToggle('menu', 'edit', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>Edit Items & Prices</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                      <input
                        type="checkbox"
                        checked={permissions.menu.delete}
                        onChange={(e) =>
                          handlePermissionToggle('menu', 'delete', e.target.checked)
                        }
                        className="rounded accent-danger"
                      />
                      <span>Delete Items</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-success font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.menu.toggleStock}
                        onChange={(e) =>
                          handlePermissionToggle('menu', 'toggleStock', e.target.checked)
                        }
                        className="rounded accent-success"
                      />
                      <span>Toggle Stock (In/Out)</span>
                    </label>
                  </div>
                </div>

                {/* Module 3: Branches & Tables */}
                <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Store size={15} className="text-primary" />
                      <span className="font-bold text-xs text-text">Branches & QR Codes</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.branches.view}
                        onChange={(e) =>
                          handlePermissionToggle('branches', 'view', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>View Branches Page</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                      <input
                        type="checkbox"
                        checked={permissions.branches.create}
                        onChange={(e) =>
                          handlePermissionToggle('branches', 'create', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>Create / Edit Branches</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                      <input
                        type="checkbox"
                        checked={permissions.branches.manageTables}
                        onChange={(e) =>
                          handlePermissionToggle('branches', 'manageTables', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>Manage Tables & QR</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                      <input
                        type="checkbox"
                        checked={permissions.branches.delete}
                        onChange={(e) =>
                          handlePermissionToggle('branches', 'delete', e.target.checked)
                        }
                        className="rounded accent-danger"
                      />
                      <span>Delete Branch</span>
                    </label>
                  </div>
                </div>

                {/* Module 4: Overview & Financials */}
                <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard size={15} className="text-primary" />
                      <span className="font-bold text-xs text-text">Overview & Metrics</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.overview.view}
                        onChange={(e) =>
                          handlePermissionToggle('overview', 'view', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>View Overview Dashboard</span>
                    </label>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                      <input
                        type="checkbox"
                        checked={permissions.overview.viewFinancials}
                        onChange={(e) =>
                          handlePermissionToggle('overview', 'viewFinancials', e.target.checked)
                        }
                        className="rounded accent-primary"
                      />
                      <span>View Total Sales & Revenue Totals</span>
                    </label>
                  </div>
                </div>

                {/* Module 5: Payment Settings & Staff Management */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-text">
                      <CreditCard size={15} className="text-primary" />
                      <span>Payment Settings</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                        <input
                          type="checkbox"
                          checked={permissions.payments.view}
                          onChange={(e) =>
                            handlePermissionToggle('payments', 'view', e.target.checked)
                          }
                          className="rounded accent-primary"
                        />
                        <span>View Payment Settings</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                        <input
                          type="checkbox"
                          checked={permissions.payments.manage}
                          onChange={(e) =>
                            handlePermissionToggle('payments', 'manage', e.target.checked)
                          }
                          className="rounded accent-danger"
                        />
                        <span>Configure Payment Gateways</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-text">
                      <Users size={15} className="text-primary" />
                      <span>Staff Management</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-text">
                        <input
                          type="checkbox"
                          checked={permissions.staff.view}
                          onChange={(e) =>
                            handlePermissionToggle('staff', 'view', e.target.checked)
                          }
                          className="rounded accent-primary"
                        />
                        <span>View Staff List</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-danger cursor-pointer hover:underline">
                        <input
                          type="checkbox"
                          checked={permissions.staff.manage}
                          onChange={(e) =>
                            handlePermissionToggle('staff', 'manage', e.target.checked)
                          }
                          className="rounded accent-danger"
                        />
                        <span>Create / Edit Team Members</span>
                      </label>
                    </div>
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
