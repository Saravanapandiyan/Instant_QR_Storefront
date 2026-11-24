import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  ShieldCheck,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  X,
  Mail,
  Building2,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { AdminPagination } from '../../components/common/AdminPagination.tsx';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.ts';
import {
  adminUsersApi,
  type AdminUserListItem,
  type UserRole,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '../../api/adminUsersApi.ts';
import { adminRestaurantsApi } from '../../api/adminRestaurantsApi.ts';
import { useAdminAuthStore } from '../../store/useAdminAuthStore.ts';
import { useAdminScopeStore } from '../../store/useAdminScopeStore.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; badgeBorder: string; badgeColor: string; description: string }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badgeBorder: '#6366f1',
    badgeColor: '#6366f1',
    description: 'Unrestricted control across all restaurant tenants, platform infrastructure, and settings.',
  },
  ADMIN: {
    label: 'Restaurant Owner',
    badgeBorder: '#0284c7',
    badgeColor: '#0284c7',
    description: 'Brand-level administrator with authority over menus, franchises, and revenue metrics.',
  },
  MANAGER: {
    label: 'Branch Manager',
    badgeBorder: '#10b981',
    badgeColor: '#10b981',
    description: 'Day-to-day outlet operations, floor staff scheduling, and active order triage.',
  },
  STAFF: {
    label: 'Store Staff',
    badgeBorder: '#94a3b8',
    badgeColor: '#94a3b8',
    description: 'Order fulfillment, KDS kitchen screen ticking, and POS floor dispatch.',
  },
};

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentAdmin = useAdminAuthStore((s) => s.user);
  const { selectedRestaurantId } = useAdminScopeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'DEACTIVATED'>('ALL');
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserListItem | null>(null);

  // Lock background scroll when user drawer or modals are open
  useBodyScrollLock(Boolean(selectedUser || isCreateModalOpen || editingUser || deletingUser));

  // Forms
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    name: '',
    email: '',
    password: '',
    countryCode: '+91',
    phone: '',
    role: 'ADMIN',
    restaurantId: '',
    pinCode: '1234',
  });

  const [editForm, setEditForm] = useState<UpdateUserPayload>({
    name: '',
    email: '',
    countryCode: '+91',
    phone: '',
    role: 'ADMIN',
    password: '',
    pinCode: '',
  });

  // Query users
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-users', searchQuery, selectedRole, selectedStatus, selectedRestaurantId],
    queryFn: () =>
      adminUsersApi.getUsers({
        search: searchQuery.trim() || undefined,
        role: selectedRole,
        status: selectedStatus,
        restaurantId: selectedRestaurantId,
      }),
  });

  // Query restaurants for dropdown
  const { data: restaurantsData } = useQuery({
    queryKey: ['admin-restaurants-for-users'],
    queryFn: () => adminRestaurantsApi.getRestaurants({ status: 'ACTIVE' }),
  });

  const availableRestaurants = restaurantsData?.restaurants ?? [];
  const counts = data?.counts ?? { total: 0, owners: 0, staff: 0, superAdmins: 0 };
  const users = data?.users ?? [];
  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, page, pageSize]);

  const activeSelectedUser = selectedUser
    ? users.find((u) => u.id === selectedUser.id) || selectedUser
    : null;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => adminUsersApi.createUser(payload),
    onSuccess: () => {
      toast.success('User account created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create user account.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      adminUsersApi.updateUser(id, payload),
    onSuccess: () => {
      toast.success('User profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update user profile.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.deleteUser(id),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeletingUser(null);
      if (selectedUser?.id === deletingUser?.id) {
        setSelectedUser(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete user.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminUsersApi.updateUserStatus(id, isActive),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      if (selectedUser) {
        setSelectedUser((prev) => (prev ? { ...prev, isActive: res.user.isActive } : null));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update account status.');
    },
  });

  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      countryCode: '+91',
      phone: '',
      role: 'ADMIN',
      restaurantId: selectedRestaurantId !== 'ALL' ? selectedRestaurantId : (availableRestaurants[0]?.id || ''),
      pinCode: '1234',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (u: AdminUserListItem) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      countryCode: u.countryCode || '+91',
      phone: u.rawPhone || '',
      role: u.role,
      password: '',
      pinCode: '',
    });
  };

  const handleToggleStatus = (u: AdminUserListItem) => {
    if (u.id === currentAdmin?.id) {
      toast.error('You cannot deactivate your own current Super Admin session.');
      return;
    }
    statusMutation.mutate({ id: u.id, isActive: !u.isActive });
  };

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-16">
        {/* Modern Admin Page Header */}
        <AdminPageHeader
          title="User Accounts & Permissions"
          description="Manage platform identities, assign restaurant roles, reset passwords/PINs, and control access states."
        >
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
            title="Refresh User Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg text-white shadow-xs cursor-pointer"
            style={{ backgroundColor: 'var(--adm-primary)' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </AdminPageHeader>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            className="p-4 rounded-xl border shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Total Platform Users</span>
              <Users className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-bold mt-1" style={{ color: 'var(--adm-text)' }}>
              {counts.total}
            </div>
          </div>

          <div
            className="p-4 rounded-xl border shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Restaurant Owners</span>
              <Building2 className="w-4 h-4 text-blue-500 opacity-80" />
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
              {counts.owners}
            </div>
          </div>

          <div
            className="p-4 rounded-xl border shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Managers &amp; Store Staff</span>
              <Users className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {counts.staff}
            </div>
          </div>

          <div
            className="p-4 rounded-xl border shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Super Administrators</span>
              <ShieldCheck className="w-4 h-4 text-indigo-500 opacity-80" />
            </div>
            <div className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
              {counts.superAdmins}
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div
          className="p-3 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Role and Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              {['ALL', 'ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedRole === role
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  style={selectedRole !== role ? { color: 'var(--adm-muted)' } : undefined}
                >
                  {role === 'ALL'
                    ? 'All Roles'
                    : role === 'ADMIN'
                    ? 'Owners'
                    : role === 'MANAGER'
                    ? 'Managers'
                    : role === 'STAFF'
                    ? 'Staff'
                    : 'Super Admins'}
                </button>
              ))}
            </div>

            <div
              className="inline-flex p-0.5 rounded-lg border text-xs"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
              }}
            >
              {(['ALL', 'ACTIVE', 'DEACTIVATED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedStatus === status ? 'shadow-xs font-bold' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: selectedStatus === status ? 'var(--adm-surface)' : 'transparent',
                    color:
                      selectedStatus === status
                        ? status === 'ACTIVE'
                          ? '#10b981'
                          : status === 'DEACTIVATED'
                          ? '#ef4444'
                          : 'var(--adm-text)'
                        : 'var(--adm-muted)',
                  }}
                >
                  {status === 'ALL' ? 'All Status' : status === 'ACTIVE' ? 'Active' : 'Locked'}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--adm-muted)' }}
            />
            <input
              type="text"
              placeholder="Search user by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-75 cursor-pointer"
                style={{ color: 'var(--adm-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div
          className="rounded-xl border overflow-hidden shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                Loading user directory...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-neutral-400" />
              <h3 className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                No User Accounts Found
              </h3>
              <p className="text-xs mt-1 text-neutral-500">
                No records match your active search or role criteria.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-3 px-3 py-1.5 text-xs font-bold text-white rounded-lg cursor-pointer"
                style={{ backgroundColor: 'var(--adm-primary)' }}
              >
                Create First User
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className="border-b uppercase text-[11px] font-semibold tracking-wider select-none"
                    style={{
                      borderColor: 'var(--adm-border)',
                      backgroundColor: 'var(--adm-surface-subtle)',
                      color: 'var(--adm-muted)',
                    }}
                  >
                    <th className="py-3 px-4">User Identity</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Associated Restaurant</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                  {paginatedUsers.map((u) => {
                    const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.STAFF;
                    const primaryRestaurant =
                      u.restaurants?.[0]?.name ||
                      (u as any).staffProfiles?.[0]?.restaurant?.name ||
                      (u.role === 'SUPER_ADMIN' ? 'Platform Wide' : 'Not Assigned');

                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="hover:opacity-95 transition-colors cursor-pointer"
                        style={{
                          backgroundColor:
                            selectedUser?.id === u.id ? 'var(--adm-surface-subtle)' : 'transparent',
                        }}
                      >
                        {/* User Identity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border"
                              style={{
                                backgroundColor: 'var(--adm-surface-subtle)',
                                borderColor: 'var(--adm-border)',
                                color: roleCfg.badgeColor,
                              }}
                            >
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--adm-text)' }}>
                                <span>{u.name}</span>
                                {u.id === currentAdmin?.id && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 font-bold border border-indigo-500/20">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                                <Mail className="w-3 h-3 opacity-60" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold"
                            style={{
                              borderColor: `${roleCfg.badgeBorder}40`,
                              backgroundColor: `${roleCfg.badgeColor}15`,
                              color: roleCfg.badgeColor,
                            }}
                          >
                            {roleCfg.label}
                          </span>
                        </td>

                        {/* Associated Restaurant */}
                        <td className="py-3 px-4 text-xs">
                          <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-medium">
                            <Building2 className="w-3.5 h-3.5 opacity-60 text-blue-500" />
                            <span>{primaryRestaurant}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4 text-xs font-mono text-neutral-500">
                          {u.phone || 'No phone'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Locked
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-600 dark:text-neutral-300"
                              title="Edit User & Credentials"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              disabled={u.id === currentAdmin?.id}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                u.isActive
                                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-500/20'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/20'
                              } disabled:opacity-40`}
                              title={u.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                            >
                              {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              disabled={u.id === currentAdmin?.id}
                              className="p-1.5 rounded-lg border border-rose-300 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-40"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* User Directory Table Pagination */}
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={users.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="users"
          />
        </div>
      </div>

      {/* Slide-Over Drawer for User Inspection */}
      {activeSelectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedUser(null)}
          />
          <div
            className="relative w-full max-w-lg h-full overflow-y-auto border-l shadow-2xl flex flex-col z-10"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            <div
              className="p-4 border-b flex items-start justify-between sticky top-0 z-10 backdrop-blur-md"
              style={{
                backgroundColor: 'var(--adm-surface)',
                borderColor: 'var(--adm-border)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                    color: ROLE_CONFIG[activeSelectedUser.role]?.badgeColor || '#6366f1',
                  }}
                >
                  {activeSelectedUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">{activeSelectedUser.name}</h2>
                  <p className="text-xs font-mono text-neutral-400">ID: {activeSelectedUser.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 text-xs">
              {/* Account Quick Controls */}
              <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--adm-border)' }}>
                <div>
                  <span className="font-bold block">Account Status</span>
                  <span className="text-[11px] text-neutral-500">
                    {activeSelectedUser.isActive ? 'Active and credentials allowed' : 'Account locked'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(activeSelectedUser)}
                    className="px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(activeSelectedUser)}
                    disabled={activeSelectedUser.id === currentAdmin?.id}
                    className="px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1 cursor-pointer text-white disabled:opacity-40"
                    style={{
                      backgroundColor: activeSelectedUser.isActive ? '#ef4444' : '#10b981',
                      borderColor: activeSelectedUser.isActive ? '#ef4444' : '#10b981',
                    }}
                  >
                    {activeSelectedUser.isActive ? 'Lock' : 'Unlock'}
                  </button>
                </div>
              </div>

              {/* Details List */}
              <div className="p-4 rounded-xl border space-y-2.5" style={{ borderColor: 'var(--adm-border)' }}>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Email:</span>
                  <span className="font-mono font-medium">{activeSelectedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Phone:</span>
                  <span className="font-mono font-medium">{activeSelectedUser.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">System Role:</span>
                  <span className="font-bold" style={{ color: ROLE_CONFIG[activeSelectedUser.role]?.badgeColor }}>
                    {ROLE_CONFIG[activeSelectedUser.role]?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Member Since:</span>
                  <span>{new Date(activeSelectedUser.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Associated Restaurants */}
              <div className="space-y-2">
                <span className="font-bold block text-neutral-800 dark:text-neutral-200">
                  Owned / Managed Restaurant Tenancies
                </span>
                {activeSelectedUser.restaurants && activeSelectedUser.restaurants.length > 0 ? (
                  activeSelectedUser.restaurants.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl border flex items-center justify-between"
                      style={{ borderColor: 'var(--adm-border)' }}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">{r.name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-neutral-400">/r/{r.slug}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-neutral-400 italic">No primary ownership tenancies attached.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border shadow-2xl p-6"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Create New User Account</h3>
                  <p className="text-[11px] text-neutral-500">Provision platform credentials and assign roles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(createForm);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="name@restaurant.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={createForm.countryCode}
                    onChange={(e) => setCreateForm({ ...createForm, countryCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Initial Password *</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">System Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden cursor-pointer"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                >
                  <option value="ADMIN">ADMIN - Restaurant Owner</option>
                  <option value="MANAGER">MANAGER - Branch Manager</option>
                  <option value="STAFF">STAFF - Store Staff / Cashier / Chef</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN - Platform Super Administrator</option>
                </select>
              </div>

              {/* Restaurant Assignment for Staff / Managers */}
              {['STAFF', 'MANAGER'].includes(createForm.role) && (
                <div className="p-3 rounded-xl border space-y-2 bg-neutral-50 dark:bg-neutral-900/40" style={{ borderColor: 'var(--adm-border)' }}>
                  <div>
                    <label className="block font-semibold mb-1">Assign to Restaurant Concept *</label>
                    <select
                      value={createForm.restaurantId}
                      onChange={(e) => setCreateForm({ ...createForm, restaurantId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-transparent cursor-pointer"
                      style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                      required
                    >
                      <option value="">Select Restaurant...</option>
                      {availableRestaurants.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (/r/{r.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">4-Digit POS PIN (Optional)</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="1234"
                      value={createForm.pinCode}
                      onChange={(e) => setCreateForm({ ...createForm, pinCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono tracking-widest text-center"
                      style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg text-white font-bold cursor-pointer"
                  style={{ backgroundColor: 'var(--adm-primary)' }}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User & Reset Credentials */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border shadow-2xl p-6"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Edit User: {editingUser.name}</h3>
                  <p className="text-[11px] text-neutral-500">Update profile details, role, or reset password / PIN</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingUser.id,
                  payload: editForm,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={editForm.countryCode}
                    onChange={(e) => setEditForm({ ...editForm, countryCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">System Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent cursor-pointer"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                >
                  <option value="ADMIN">ADMIN - Restaurant Owner</option>
                  <option value="MANAGER">MANAGER - Branch Manager</option>
                  <option value="STAFF">STAFF - Store Staff / Cashier / Chef</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN - Platform Super Administrator</option>
                </select>
              </div>

              <div className="p-3 rounded-xl border space-y-2 bg-neutral-50 dark:bg-neutral-900/40" style={{ borderColor: 'var(--adm-border)' }}>
                <div>
                  <label className="block font-semibold mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                    Reset Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    placeholder="New password (min 6 characters)"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    minLength={6}
                  />
                </div>

                {['STAFF', 'MANAGER'].includes(editForm.role || '') && (
                  <div>
                    <label className="block font-semibold mb-1">Update 4-Digit POS PIN</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 5678"
                      value={editForm.pinCode}
                      onChange={(e) => setEditForm({ ...editForm, pinCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono text-center tracking-widest"
                      style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-lg text-white font-bold cursor-pointer"
                  style={{ backgroundColor: 'var(--adm-primary)' }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete User Confirmation */}
      {deletingUser && (
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
                <h3 className="text-base font-bold">Remove User: {deletingUser.name}?</h3>
                <p className="text-xs text-neutral-500">
                  Are you sure you want to delete <strong className="font-mono">{deletingUser.email}</strong>? They will be locked out immediately.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingUser.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
