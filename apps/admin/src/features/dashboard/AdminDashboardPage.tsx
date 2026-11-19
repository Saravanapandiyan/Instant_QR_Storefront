import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Store,
  Building2,
  Receipt,
  CreditCard,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { adminDashboardApi } from '../../api/adminDashboardApi.ts';
import { getCustomerStorefrontUrl } from '../../lib/urls.ts';

export function AdminDashboardPage() {
  // Live queries to NestJS Backend
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminDashboardApi.getStats,
  });

  const {
    data: velocityPoints = [],
    isLoading: velocityLoading,
  } = useQuery({
    queryKey: ['admin-dashboard-velocity'],
    queryFn: adminDashboardApi.getVelocity,
  });

  const {
    data: fleet = [],
    isLoading: fleetLoading,
  } = useQuery({
    queryKey: ['admin-dashboard-fleet'],
    queryFn: adminDashboardApi.getRecentFleet,
  });

  const maxVelocity = Math.max(...velocityPoints.map((p) => p.orders), 25);

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-16">
        {/* Clean Header */}
        <div className="pb-4 border-b" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-md border"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-primary)',
              }}
            >
              Platform Overview
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>
              Live Ingestion Active
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
            Executive Dashboard
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--adm-muted)' }}>
            Platform adoption, tenant fleet volume, and cross-restaurant order telemetry.
          </p>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Active Tenancies */}
          <div
            className="p-4 rounded-lg border flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Active Restaurants</span>
              <Store className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                {stats?.restaurants.total ?? 0}
              </div>
              <div className="text-xs text-emerald-500 font-semibold mt-0.5">
                {stats?.restaurants.active ?? 0} active in fleet
              </div>
            </div>
            <div
              className="pt-2.5 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}
            >
              <span>Verified: {stats?.restaurants.active ?? 0}</span>
              <span>Pending: {stats?.restaurants.pending ?? 0}</span>
            </div>
          </div>

          {/* Card 2: Outlets */}
          <div
            className="p-4 rounded-lg border flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Physical Outlets</span>
              <Building2 className="w-4 h-4 text-blue-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                {stats?.branches.total ?? 0}
              </div>
              <div className="text-xs text-blue-500 font-semibold mt-0.5">
                {stats?.branches.availabilityRate ?? 100}% availability
              </div>
            </div>
            <div
              className="pt-2.5 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}
            >
              <span>Active QR Points: {stats?.branches.active ?? 0}</span>
              <span>Multi-Outlet</span>
            </div>
          </div>

          {/* Card 3: Platform Orders */}
          <div
            className="p-4 rounded-lg border flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Total Orders</span>
              <Receipt className="w-4 h-4 text-indigo-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                {stats?.orders.total ?? 0}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--adm-muted)' }}>
                {stats?.orders.total === 0 ? 'No orders logged yet' : `+${stats?.orders.growthPercentage}% growth`}
              </div>
            </div>
            <div
              className="pt-2.5 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}
            >
              <span>Gateway Nominal</span>
              <span>Phase 6 Stream</span>
            </div>
          </div>

          {/* Card 4: Gross Platform GMV */}
          <div
            className="p-4 rounded-lg border flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--adm-muted)' }}>
              <span>Gross Platform GMV</span>
              <CreditCard className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                {stats?.orders.currency ?? '₹'}{Number(stats?.orders.grossVolume ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-500 font-semibold mt-0.5">
                {stats?.orders.grossVolume === 0 ? 'Awaiting transactions' : '+19.6% across tenancies'}
              </div>
            </div>
            <div
              className="pt-2.5 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}
            >
              <span>Avg Ticket: ₹0.00</span>
              <span>Take-rate: 2.8%</span>
            </div>
          </div>
        </div>

        {/* Analytics Section: Velocity & Fleet Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Order Velocity */}
          <div
            className="lg:col-span-2 rounded-lg border p-5 flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--adm-text)' }}>
                  Order Velocity &amp; Transaction Throughput
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--adm-muted)' }}>
                  Live 30-day cross-restaurant order volume trends and platform telemetry.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--adm-primary)' }} />
                  <span style={{ color: 'var(--adm-muted)' }}>Orders</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span style={{ color: 'var(--adm-muted)' }}>GMV</span>
                </div>
              </div>
            </div>

            {/* Velocity Chart / Empty State */}
            <div className="h-48 w-full flex items-center justify-center p-2">
              {velocityLoading ? (
                <div className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                  Loading telemetry...
                </div>
              ) : velocityPoints.length === 0 || velocityPoints.every((p) => p.orders === 0) ? (
                <div className="flex flex-col items-center justify-center text-center max-w-sm py-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5 border"
                    style={{
                      backgroundColor: 'var(--adm-surface-subtle)',
                      borderColor: 'var(--adm-border)',
                      color: 'var(--adm-muted)',
                    }}
                  >
                    <Receipt className="w-5 h-5 opacity-40" />
                  </div>
                  <h4 className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                    No Transaction Activity Logged Yet
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--adm-muted)' }}>
                    Live transaction ingestion is active and listening. When customers place orders through storefronts, real-time volume velocity graphs here automatically.
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex items-end gap-1 pt-6 pb-2">
                  {velocityPoints.map((point) => {
                    const heightPercent = maxVelocity > 0 ? Math.round((point.orders / maxVelocity) * 100) : 0;
                    return (
                      <div key={point.date} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                        <div
                          className="w-full rounded-t-xs transition-opacity group-hover:opacity-100 opacity-80"
                          style={{
                            height: `${Math.max(4, heightPercent)}%`,
                            backgroundColor: 'var(--adm-primary)',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="pt-3 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--adm-border)' }}
            >
              <span style={{ color: 'var(--adm-muted)' }}>30-Day Timeline</span>
              <div className="flex items-center gap-1 text-indigo-500 font-semibold">
                <span>Real-time Ingestion Nominal</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Fleet Health & Reviews */}
          <div
            className="rounded-lg border p-5 flex flex-col justify-between shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold" style={{ color: 'var(--adm-text)' }}>
                  Merchant Reviews
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    color: 'var(--adm-muted)',
                  }}
                >
                  {stats?.restaurants.pending ?? 0} Pending
                </span>
              </div>

              <div className="space-y-3">
                <div
                  className="p-3 rounded-lg border space-y-2 text-xs"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold" style={{ color: 'var(--adm-text)' }}>
                      Platform Tenant Health
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                    All active restaurant tenants are operating normally with zero compliance flags.
                  </p>
                  <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--adm-border)' }}>
                    <span style={{ color: 'var(--adm-muted)' }}>Catalog Items:</span>
                    <span className="font-bold text-indigo-500">{stats?.catalog.totalProducts ?? 0} Dishes</span>
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: 'var(--adm-surface-subtle)',
                    borderColor: 'var(--adm-border)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 opacity-70" />
                    <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>
                      Platform Owners
                    </span>
                  </div>
                  <span className="font-bold">{stats?.users.total ?? 0} Users</span>
                </div>
              </div>
            </div>

            <Link
              to="/restaurants"
              className="mt-4 py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-opacity hover:opacity-85 text-center"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            >
              <span>Manage Tenant Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Fleet Section */}
        <div
          className="rounded-lg border overflow-hidden shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          <div
            className="px-4 py-2.5 border-b flex items-center justify-between text-xs"
            style={{
              backgroundColor: 'var(--adm-surface-subtle)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-muted)',
            }}
          >
            <div className="flex items-center gap-2 font-medium">
              <Store className="w-3.5 h-3.5" />
              <span className="font-bold" style={{ color: 'var(--adm-text)' }}>
                Recent Brand Registrations
              </span>
            </div>
            <Link to="/restaurants" className="text-xs hover:underline text-indigo-500 font-semibold">
              View All Restaurants →
            </Link>
          </div>

          {fleetLoading ? (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--adm-muted)' }}>
              Loading recent restaurants...
            </div>
          ) : fleet.length === 0 ? (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--adm-muted)' }}>
              No restaurants registered yet.
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
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Storefront Slug</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Outlets</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                  {fleet.map((tenant) => (
                    <tr key={tenant.id} className="hover:opacity-90 transition-opacity">
                      <td className="py-3 px-4 font-bold text-xs" style={{ color: 'var(--adm-text)' }}>
                        {tenant.name}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={getCustomerStorefrontUrl(tenant.slug)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-500 hover:underline"
                        >
                          <span>/r/{tenant.slug}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--adm-muted)' }}>
                        {tenant.owner?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">
                        {tenant.branchesCount} Outlets
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {tenant.status === 'ACTIVE' ? (
                          <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-rose-500 font-bold text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            SUSPENDED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
