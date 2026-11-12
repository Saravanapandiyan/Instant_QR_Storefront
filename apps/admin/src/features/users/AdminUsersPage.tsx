import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  CheckCircle2,
  X,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Building2,
  Lock,
  Unlock,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { adminUsersApi, type AdminUserListItem, type UserRole } from '../../api/adminUsersApi.ts';
import { useAdminAuthStore } from '../../store/useAdminAuthStore.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; badgeBorder: string; badgeColor: string; description: string }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badgeBorder: '#6366f1',
    badgeColor: '#6366f1',
    description: 'Unrestricted control across all restaurant tenants, cloud clusters, and IAM policies.',
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'DEACTIVATED'>('ALL');
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);

  const [editingRole, setEditingRole] = useState<UserRole | null>(null);

  // Live Query
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-users', searchQuery, selectedRole, selectedStatus],
    queryFn: () =>
      adminUsersApi.getUsers({
        search: searchQuery.trim() || undefined,
        role: selectedRole,
        status: selectedStatus,
      }),
  });

  const counts = data?.counts ?? { total: 0, owners: 0, staff: 0, superAdmins: 0 };
  const users = data?.users ?? [];

  const activeSelectedUser = selectedUser
    ? users.find((u) => u.id === selectedUser.id) || selectedUser
    : null;

  // Mutation to update user role
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      adminUsersApi.updateUserRole(id, role),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      if (selectedUser) {
        setSelectedUser((prev) => (prev ? { ...prev, role: res.user.role } : null));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update user role.');
    },
  });

  // Mutation to update user active / lockdown status
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

  const handleOpenPrivileges = (u: AdminUserListItem) => {
    setSelectedUser(u);
    setEditingRole(u.role);
  };

  const handleSaveRole = () => {
    if (!activeSelectedUser || !editingRole || editingRole === activeSelectedUser.role) return;
    roleMutation.mutate({ id: activeSelectedUser.id, role: editingRole });
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                  color: 'var(--adm-primary)',
                }}
              >
                Access &amp; Security
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                System-Wide Directory
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
              User Accounts &amp; Permissions
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--adm-muted)' }}>
              Manage platform identities, assign organizational roles, and control account active states.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Total Users</span>
              <Users className="w-4 h-4 opacity-70" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                {counts.total}
              </span>
              <span className="text-xs text-emerald-500 font-semibold">Active</span>
            </div>
          </div>

          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Brand Owners</span>
              <Building2 className="w-4 h-4 text-blue-500 opacity-80" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                {counts.owners}
              </span>
              <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                Owners
              </span>
            </div>
          </div>

          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Store Staff</span>
              <UserCheck className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                {counts.staff}
              </span>
              <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                Operations
              </span>
            </div>
          </div>

          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Super Admins</span>
              <ShieldCheck className="w-4 h-4 text-indigo-500 opacity-80" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-indigo-500">
                {counts.superAdmins}
              </span>
              <span className="text-xs text-indigo-500 font-semibold">Platform Root</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className="p-2.5 rounded-lg border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--adm-muted)' }}
            />
            <input
              type="text"
              placeholder="Search users by name, email, or mobile..."
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Role Filter */}
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-lg border appearance-none cursor-pointer focus:outline-none text-xs font-medium"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                  color: 'var(--adm-text)',
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Restaurant Owner</option>
                <option value="MANAGER">Branch Manager</option>
                <option value="STAFF">Store Staff</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="h-9 pl-3 pr-8 rounded-lg border appearance-none cursor-pointer focus:outline-none text-xs font-medium"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                  color: 'var(--adm-text)',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="DEACTIVATED">Deactivated Only</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div
          className="rounded-lg border overflow-hidden shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Subheader */}
          <div
            className="px-4 py-2.5 border-b flex items-center justify-between text-xs"
            style={{
              backgroundColor: 'var(--adm-surface-subtle)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-muted)',
            }}
          >
            <div className="flex items-center gap-2 font-medium">
              <span className="font-bold" style={{ color: 'var(--adm-text)' }}>
                User Directory
              </span>
              <span>•</span>
              <span>{users.length} Identities Listed</span>
            </div>
            <span className="text-[11px]">Real-time Directory Sync</span>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                Loading user directory...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: 'var(--adm-muted)' }} />
              <h3 className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                No Users Found
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--adm-muted)' }}>
                No accounts match the selected role or search criteria in the database.
              </p>
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
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Tenant Scope</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                  {users.map((u) => {
                    const initials = u.name
                      ? u.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'U';
                    const roleInfo = ROLE_CONFIG[u.role] || ROLE_CONFIG.STAFF;
                    const isSelf = u.id === currentAdmin?.id;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:opacity-90 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}
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
                                color: roleInfo.badgeColor,
                              }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold tracking-tight truncate flex items-center gap-1.5 text-xs">
                                <span style={{ color: 'var(--adm-text)' }}>{u.name}</span>
                                {u.isPlatformAdmin && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                )}
                                {isSelf && (
                                  <span
                                    className="text-[9px] px-1 py-0.2 rounded border font-bold"
                                    style={{
                                      backgroundColor: 'var(--adm-primary-subtle)',
                                      borderColor: 'var(--adm-border)',
                                      color: 'var(--adm-primary)',
                                    }}
                                  >
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono block" style={{ color: 'var(--adm-muted)' }}>
                                ID: {u.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4 text-xs">
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-1 text-xs truncate" style={{ color: 'var(--adm-text)' }}>
                              <Mail className="w-3 h-3 opacity-60 shrink-0" />
                              <span>{u.email}</span>
                            </span>
                            {u.phone ? (
                              <span className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--adm-muted)' }}>
                                <Phone className="w-2.5 h-2.5 shrink-0" />
                                <span>{u.phone}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] italic mt-0.5" style={{ color: 'var(--adm-muted)' }}>
                                No phone logged
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold"
                            style={{
                              backgroundColor: 'var(--adm-surface-subtle)',
                              borderColor: roleInfo.badgeBorder,
                              color: roleInfo.badgeColor,
                            }}
                          >
                            {roleInfo.label}
                          </span>
                        </td>

                        {/* Tenant Scope */}
                        <td className="py-3 px-4 text-xs">
                          {u.restaurants && u.restaurants.length > 0 ? (
                            <span className="font-semibold text-xs" style={{ color: 'var(--adm-text)' }}>
                              {u.restaurants[0].name}
                            </span>
                          ) : u.role === 'SUPER_ADMIN' ? (
                            <span className="text-xs text-indigo-500 font-semibold">
                              Platform Wide
                            </span>
                          ) : (
                            <span className="text-xs italic" style={{ color: 'var(--adm-muted)' }}>
                              Unattached
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3 px-4 text-[11px] whitespace-nowrap" style={{ color: 'var(--adm-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN')}
                        </td>

                        {/* State */}
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          {u.isActive ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold"
                              style={{
                                backgroundColor: 'var(--adm-success-subtle)',
                                borderColor: 'var(--adm-success)',
                                color: 'var(--adm-success)',
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold"
                              style={{
                                backgroundColor: 'var(--adm-error-subtle)',
                                borderColor: 'var(--adm-error)',
                                color: 'var(--adm-error)',
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Locked
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenPrivileges(u)}
                              className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                              style={{
                                backgroundColor: 'var(--adm-surface-subtle)',
                                borderColor: 'var(--adm-border)',
                                color: 'var(--adm-primary)',
                              }}
                              title="Edit Role & Permissions"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf || statusMutation.isPending}
                              className={`p-1.5 rounded-lg border transition-opacity cursor-pointer ${
                                isSelf ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80'
                              }`}
                              style={{
                                backgroundColor: 'var(--adm-surface-subtle)',
                                borderColor: 'var(--adm-border)',
                                color: u.isActive ? 'var(--adm-error)' : 'var(--adm-success)',
                              }}
                              title={isSelf ? 'Cannot disable self' : u.isActive ? 'Lock Account' : 'Unlock Account'}
                            >
                              {u.isActive ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
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
        </div>
      </div>

      {/* Slide-Over Drawer: Permissions & Roles */}
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
            }}
          >
            {/* Header */}
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
                    color: ROLE_CONFIG[activeSelectedUser.role].badgeColor,
                  }}
                >
                  {activeSelectedUser.name?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                      {activeSelectedUser.name}
                    </h2>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.2 rounded border"
                      style={{
                        backgroundColor: 'var(--adm-surface-subtle)',
                        borderColor: 'var(--adm-border)',
                        color: 'var(--adm-muted)',
                      }}
                    >
                      {activeSelectedUser.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--adm-muted)' }}>
                    {activeSelectedUser.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                  color: 'var(--adm-muted)',
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5 flex-1">
              {/* Role Selection */}
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-tight block" style={{ color: 'var(--adm-text)' }}>
                  Assigned Platform Role
                </span>
                <div className="space-y-2">
                  {(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'] as UserRole[]).map((r) => {
                    const info = ROLE_CONFIG[r];
                    const isSelected = editingRole === r;

                    return (
                      <div
                        key={r}
                        onClick={() => setEditingRole(r)}
                        className="p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3"
                        style={{
                          backgroundColor: isSelected
                            ? 'var(--adm-surface-subtle)'
                            : 'var(--adm-surface)',
                          borderColor: isSelected ? info.badgeBorder : 'var(--adm-border)',
                        }}
                      >
                        <input
                          type="radio"
                          name="roleRadio"
                          checked={isSelected}
                          onChange={() => setEditingRole(r)}
                          className="mt-0.5 accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold block" style={{ color: 'var(--adm-text)' }}>
                            {info.label}
                          </span>
                          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--adm-muted)' }}>
                            {info.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {editingRole !== activeSelectedUser.role && (
                  <button
                    onClick={handleSaveRole}
                    disabled={roleMutation.isPending}
                    className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-bold transition-opacity cursor-pointer flex items-center justify-center gap-1.5 border"
                    style={{
                      backgroundColor: 'var(--adm-primary)',
                      color: 'var(--adm-primary-contrast)',
                      borderColor: 'var(--adm-primary)',
                    }}
                  >
                    {roleMutation.isPending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Apply Role Update</span>
                  </button>
                )}
              </div>

              {/* Tenancy Scope */}
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-tight block" style={{ color: 'var(--adm-text)' }}>
                  Tenancy Scope
                </span>
                <div
                  className="p-3 rounded-lg border text-xs space-y-2"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                  }}
                >
                  {activeSelectedUser.restaurants && activeSelectedUser.restaurants.length > 0 ? (
                    activeSelectedUser.restaurants.map((res) => (
                      <div key={res.id} className="flex items-center justify-between">
                        <span className="font-bold text-xs" style={{ color: 'var(--adm-text)' }}>
                          {res.name}
                        </span>
                        <span className="text-xs font-mono" style={{ color: 'var(--adm-muted)' }}>
                          /r/{res.slug}
                        </span>
                      </div>
                    ))
                  ) : activeSelectedUser.role === 'SUPER_ADMIN' ? (
                    <span className="text-indigo-500 font-semibold text-xs">
                      Platform-wide Root Scope (Unrestricted)
                    </span>
                  ) : (
                    <span className="text-xs italic" style={{ color: 'var(--adm-muted)' }}>
                      No restaurant franchises assigned.
                    </span>
                  )}
                </div>
              </div>

              {/* Lockdown Switch */}
              <div
                className="p-3 rounded-lg border flex items-center justify-between text-xs"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                }}
              >
                <div>
                  <span className="font-bold block" style={{ color: 'var(--adm-text)' }}>
                    Account Lockdown
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>
                    {activeSelectedUser.isActive ? 'Account is currently active' : 'Account access is disabled'}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleStatus(activeSelectedUser)}
                  disabled={
                    activeSelectedUser.id === currentAdmin?.id || statusMutation.isPending
                  }
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                    activeSelectedUser.id === currentAdmin?.id
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:opacity-85'
                  }`}
                  style={{
                    backgroundColor: activeSelectedUser.isActive
                      ? 'var(--adm-error-subtle)'
                      : 'var(--adm-success-subtle)',
                    borderColor: activeSelectedUser.isActive
                      ? 'var(--adm-error)'
                      : 'var(--adm-success)',
                    color: activeSelectedUser.isActive
                      ? 'var(--adm-error)'
                      : 'var(--adm-success)',
                  }}
                >
                  {activeSelectedUser.isActive ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lockdown</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Reactivate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
