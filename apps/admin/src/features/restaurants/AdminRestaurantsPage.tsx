import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Search,
  ExternalLink,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
  Ban,
  Check,
  MapPin,
  Building2,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { adminRestaurantsApi, type AdminRestaurantTenant } from '../../api/adminRestaurantsApi.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';
import { getCustomerStorefrontUrl } from '../../lib/urls.ts';

type StatusTab = 'ALL' | 'ACTIVE' | 'SUSPENDED';

export function AdminRestaurantsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<AdminRestaurantTenant | null>(null);

  // Live Query
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-restaurants', activeTab, searchQuery],
    queryFn: () =>
      adminRestaurantsApi.getRestaurants({
        search: searchQuery.trim() || undefined,
        status: activeTab,
      }),
  });

  const counts = data?.counts ?? { all: 0, active: 0, suspended: 0 };
  const restaurants = data?.restaurants ?? [];

  const activeSelectedTenant = selectedTenant
    ? restaurants.find((r) => r.id === selectedTenant.id) || selectedTenant
    : null;

  // Mutation to Suspend / Reactivate a tenant
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminRestaurantsApi.updateStatus(id, isActive),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      if (selectedTenant) {
        setSelectedTenant((prev) => (prev ? { ...prev, isActive: res.isActive } : null));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update tenant status.');
    },
  });

  const totalBranches = restaurants.reduce((acc, r) => acc + (r.branches?.length || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-16">
        {/* Page Header */}
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
                Tenant Registry
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                Multi-Tenant Governance
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
              Restaurant &amp; Tenant Management
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--adm-muted)' }}>
              Supervise brand tenancies, inspect multi-branch fleets, and manage operational status across all restaurant groups.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div
              className="px-3 py-1.5 rounded-lg border flex items-center gap-2 font-medium"
              style={{
                backgroundColor: 'var(--adm-surface)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            >
              <Store className="w-4 h-4 text-emerald-500" />
              <span>
                <strong className="font-bold text-emerald-500">{counts.active}</strong> / {counts.all} Active
              </span>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
              style={{
                backgroundColor: 'var(--adm-surface)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
              title="Refresh Tenants"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Strip & Search Filter Bar */}
        <div
          className="p-2.5 rounded-lg border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Status Tabs */}
          <div
            className="inline-flex p-1 rounded-lg border gap-1 text-xs"
            style={{
              backgroundColor: 'var(--adm-surface-subtle)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ALL' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeTab === 'ALL' ? 'var(--adm-surface)' : 'transparent',
                color: activeTab === 'ALL' ? 'var(--adm-text)' : 'var(--adm-muted)',
                border: activeTab === 'ALL' ? '1px solid var(--adm-border)' : '1px solid transparent',
              }}
            >
              All Brands <span className="opacity-60 font-mono">({counts.all})</span>
            </button>

            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ACTIVE' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeTab === 'ACTIVE' ? 'var(--adm-surface)' : 'transparent',
                color: activeTab === 'ACTIVE' ? '#10b981' : 'var(--adm-muted)',
                border: activeTab === 'ACTIVE' ? '1px solid var(--adm-border)' : '1px solid transparent',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active <span className="opacity-60 font-mono">({counts.active})</span>
            </button>

            <button
              onClick={() => setActiveTab('SUSPENDED')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'SUSPENDED' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeTab === 'SUSPENDED' ? 'var(--adm-surface)' : 'transparent',
                color: activeTab === 'SUSPENDED' ? '#ef4444' : 'var(--adm-muted)',
                border: activeTab === 'SUSPENDED' ? '1px solid var(--adm-border)' : '1px solid transparent',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Suspended <span className="opacity-60 font-mono">({counts.suspended})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--adm-muted)' }}
            />
            <input
              type="text"
              placeholder="Filter by brand name, slug (/r/...), or owner email..."
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

        {/* Directory Table */}
        <div
          className="rounded-lg border overflow-hidden shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {/* Manifest Sub-Header */}
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
                Directory Manifest
              </span>
              <span>•</span>
              <span>{restaurants.length} Concepts Found</span>
              <span>•</span>
              <span>{totalBranches} Outlets Provisioned</span>
            </div>
            <span className="text-[11px]">Click row to inspect fleet</span>
          </div>

          {/* Table Data */}
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                Loading restaurant directory...
              </p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="p-12 text-center">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: 'var(--adm-muted)' }} />
              <h3 className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                No Restaurants Found
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--adm-muted)' }}>
                No records match the active search filter or tab status.
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
                    <th className="py-3 px-4">Brand / Concept</th>
                    <th className="py-3 px-4">Storefront Route</th>
                    <th className="py-3 px-4">Owner Contact</th>
                    <th className="py-3 px-4">Fleet</th>
                    <th className="py-3 px-4">Catalog</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                  {restaurants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      onClick={() => setSelectedTenant(tenant)}
                      className="hover:opacity-90 transition-colors cursor-pointer group"
                      style={{
                        backgroundColor:
                          selectedTenant?.id === tenant.id
                            ? 'var(--adm-surface-subtle)'
                            : 'transparent',
                      }}
                    >
                      {/* Brand Concept */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border"
                            style={{
                              backgroundColor: 'var(--adm-primary-subtle)',
                              borderColor: 'var(--adm-border)',
                              color: 'var(--adm-primary)',
                            }}
                          >
                            {tenant.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold tracking-tight truncate flex items-center gap-1.5 text-xs">
                              <span style={{ color: 'var(--adm-text)' }}>{tenant.name}</span>
                              {tenant.isActive && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] font-mono block" style={{ color: 'var(--adm-muted)' }}>
                              ID: {tenant.id.slice(0, 8)} • {tenant.defaultCurrency}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Storefront Route */}
                      <td className="py-3 px-4 text-xs">
                        <a
                          href={getCustomerStorefrontUrl(tenant.slug)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-mono hover:underline"
                          style={{
                            backgroundColor: 'var(--adm-surface-subtle)',
                            borderColor: 'var(--adm-border)',
                            color: 'var(--adm-primary)',
                          }}
                        >
                          <span>/r/{tenant.slug}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      </td>

                      {/* Owner Contact */}
                      <td className="py-3 px-4 text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs truncate" style={{ color: 'var(--adm-text)' }}>
                            {tenant.owner?.name || 'Unknown'}
                          </span>
                          <span className="text-[11px] truncate" style={{ color: 'var(--adm-muted)' }}>
                            {tenant.owner?.email}
                          </span>
                        </div>
                      </td>

                      {/* Fleet Outlets */}
                      <td className="py-3 px-4 text-xs">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold"
                          style={{
                            backgroundColor: 'var(--adm-surface-subtle)',
                            borderColor: 'var(--adm-border)',
                            color: 'var(--adm-text)',
                          }}
                        >
                          {tenant.branches?.length || 0} Outlets
                        </span>
                      </td>

                      {/* Catalog Items */}
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--adm-muted)' }}>
                        {tenant.productsCount ?? 0} Dishes
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {tenant.isActive ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold"
                            style={{
                              backgroundColor: 'var(--adm-success-subtle)',
                              borderColor: 'var(--adm-success)',
                              color: 'var(--adm-success)',
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ACTIVE
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
                            SUSPENDED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTenant(tenant);
                          }}
                          className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                          style={{
                            backgroundColor: 'var(--adm-surface-subtle)',
                            borderColor: 'var(--adm-border)',
                            color: 'var(--adm-text)',
                          }}
                          title="Inspect Fleet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slide-Over Inspection Drawer */}
      {activeSelectedTenant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTenant(null)}
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
                    backgroundColor: 'var(--adm-primary-subtle)',
                    borderColor: 'var(--adm-border)',
                    color: 'var(--adm-primary)',
                  }}
                >
                  {activeSelectedTenant.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                      {activeSelectedTenant.name}
                    </h2>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.2 rounded border"
                      style={{
                        backgroundColor: 'var(--adm-surface-subtle)',
                        borderColor: 'var(--adm-border)',
                        color: 'var(--adm-muted)',
                      }}
                    >
                      {activeSelectedTenant.defaultCurrency}
                    </span>
                  </div>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--adm-muted)' }}>
                    ID: {activeSelectedTenant.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTenant(null)}
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
              {/* Operational Status Control Strip */}
              <div
                className="p-3.5 rounded-lg border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                }}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                    Tenancy Status
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>
                    {activeSelectedTenant.isActive
                      ? 'Storefront is active and customer orders are allowed.'
                      : 'Storefront is suspended. QR codes return 503 Maintenance.'}
                  </span>
                </div>

                <button
                  onClick={() =>
                    statusMutation.mutate({
                      id: activeSelectedTenant.id,
                      isActive: !activeSelectedTenant.isActive,
                    })
                  }
                  disabled={statusMutation.isPending}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border hover:opacity-85"
                  style={{
                    backgroundColor: activeSelectedTenant.isActive
                      ? 'var(--adm-error-subtle)'
                      : 'var(--adm-success-subtle)',
                    borderColor: activeSelectedTenant.isActive
                      ? 'var(--adm-error)'
                      : 'var(--adm-success)',
                    color: activeSelectedTenant.isActive
                      ? 'var(--adm-error)'
                      : 'var(--adm-success)',
                  }}
                >
                  {statusMutation.isPending ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : activeSelectedTenant.isActive ? (
                    <>
                      <Ban className="w-3 h-3" />
                      <span>Suspend</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Reactivate</span>
                    </>
                  )}
                </button>
              </div>

              {/* Identity Manifest */}
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-tight block" style={{ color: 'var(--adm-text)' }}>
                  Tenancy Details
                </span>
                <div
                  className="p-3 rounded-lg border space-y-2 text-xs"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--adm-muted)' }}>Storefront Route:</span>
                    <a
                      href={getCustomerStorefrontUrl(activeSelectedTenant.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] text-indigo-500 hover:underline flex items-center gap-1"
                    >
                      <span>/r/{activeSelectedTenant.slug}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--adm-muted)' }}>Owner:</span>
                    <span style={{ color: 'var(--adm-text)' }}>
                      {activeSelectedTenant.owner?.name} ({activeSelectedTenant.owner?.email})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--adm-muted)' }}>Registered:</span>
                    <span style={{ color: 'var(--adm-text)' }}>
                      {new Date(activeSelectedTenant.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Outlet Fleet */}
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-tight block" style={{ color: 'var(--adm-text)' }}>
                  Outlets &amp; Branches ({activeSelectedTenant.branches?.length || 0})
                </span>

                <div className="space-y-1.5">
                  {activeSelectedTenant.branches && activeSelectedTenant.branches.length > 0 ? (
                    activeSelectedTenant.branches.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-lg border flex items-start justify-between text-xs"
                        style={{
                          backgroundColor: 'var(--adm-surface-subtle)',
                          borderColor: 'var(--adm-border)',
                        }}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-bold" style={{ color: 'var(--adm-text)' }}>
                              {b.name}
                            </span>
                          </div>
                          <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--adm-muted)' }}>
                            <MapPin className="w-3 h-3" />
                            <span>{b.address || 'Address not configured'}</span>
                          </p>
                        </div>

                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded border font-semibold"
                          style={{
                            backgroundColor: 'var(--adm-surface)',
                            borderColor: 'var(--adm-border)',
                            color: b.isActive ? '#10b981' : '#ef4444',
                          }}
                        >
                          {b.isActive ? 'Active' : 'Offline'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic" style={{ color: 'var(--adm-muted)' }}>
                      No branches provisioned yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
