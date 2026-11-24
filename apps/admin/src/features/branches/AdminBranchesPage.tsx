import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Store,
  Search,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  QrCode,
  MapPin,
  Phone,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.ts';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { AdminPagination } from '../../components/common/AdminPagination.tsx';
import {
  adminBranchesApi,
  type AdminBranchItem,
  type CreateBranchPayload,
  type UpdateBranchPayload,
  type TableItem,
} from '../../api/adminBranchesApi.ts';
import { adminRestaurantsApi } from '../../api/adminRestaurantsApi.ts';
import { useAdminScopeStore } from '../../store/useAdminScopeStore.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

export function AdminBranchesPage() {
  const queryClient = useQueryClient();
  const {
    selectedRestaurantId,
    selectedBranchId,
  } = useAdminScopeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<AdminBranchItem | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<AdminBranchItem | null>(null);
  const [inspectingTablesBranch, setInspectingTablesBranch] = useState<AdminBranchItem | null>(null);

  // Lock background scroll when any modal or slide-over drawer is open
  useBodyScrollLock(Boolean(inspectingTablesBranch || isCreateModalOpen || editingBranch || deletingBranch));

  // New Table in Drawer state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableSection, setNewTableSection] = useState('Main Hall');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Forms
  const [createForm, setCreateForm] = useState<CreateBranchPayload>({
    restaurantId: '',
    name: '',
    slug: '',
    address: '',
    phone: '',
    countryCode: '+91',
    currency: 'INR',
  });

  const [editForm, setEditForm] = useState<UpdateBranchPayload>({
    name: '',
    slug: '',
    address: '',
    phone: '',
    currency: 'INR',
    isActive: true,
  });

  // Query branches
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-branches', selectedRestaurantId, searchQuery, statusFilter],
    queryFn: () =>
      adminBranchesApi.getBranches({
        restaurantId: selectedRestaurantId,
        search: searchQuery.trim() || undefined,
        status: statusFilter,
      }),
  });

  // Query active restaurants for branch creation
  const { data: restaurantsData } = useQuery({
    queryKey: ['admin-restaurants-for-branches'],
    queryFn: () => adminRestaurantsApi.getRestaurants({ status: 'ACTIVE' }),
  });

  // Query tables when inspecting a branch
  const { data: branchTables = [], refetch: refetchTables } = useQuery({
    queryKey: ['admin-branch-tables', inspectingTablesBranch?.id],
    queryFn: () =>
      inspectingTablesBranch ? adminBranchesApi.getTables(inspectingTablesBranch.id) : [],
    enabled: Boolean(inspectingTablesBranch),
  });

  const branches = data?.branches ?? [];
  const totalPages = Math.ceil(branches.length / pageSize) || 1;
  const paginatedBranches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return branches.slice(start, start + pageSize);
  }, [branches, page, pageSize]);
  const counts = data?.counts ?? { total: 0, active: 0, inactive: 0 };
  const availableRestaurants = restaurantsData?.restaurants ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateBranchPayload) => adminBranchesApi.createBranch(payload),
    onSuccess: () => {
      toast.success('Branch outlet provisioned successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create branch.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchPayload }) =>
      adminBranchesApi.updateBranch(id, payload),
    onSuccess: () => {
      toast.success('Branch outlet updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      setEditingBranch(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update branch.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminBranchesApi.deleteBranch(id),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      setDeletingBranch(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to archive branch.');
    },
  });

  const addTableMutation = useMutation({
    mutationFn: ({
      branchId,
      data,
    }: {
      branchId: string;
      data: { tableNumber: string; section?: string; capacity?: number };
    }) => adminBranchesApi.createTable(branchId, data),
    onSuccess: () => {
      toast.success('Table added successfully!');
      refetchTables();
      setNewTableNumber('');
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add table.');
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: ({ branchId, tableId }: { branchId: string; tableId: string }) =>
      adminBranchesApi.deleteTable(branchId, tableId),
    onSuccess: () => {
      toast.success('Table removed.');
      refetchTables();
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove table.');
    },
  });

  const handleOpenCreate = () => {
    setCreateForm({
      restaurantId:
        selectedRestaurantId !== 'ALL' ? selectedRestaurantId : (availableRestaurants[0]?.id || ''),
      name: '',
      slug: '',
      address: '',
      phone: '',
      countryCode: '+91',
      currency: 'INR',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (b: AdminBranchItem) => {
    setEditingBranch(b);
    setEditForm({
      name: b.name,
      slug: b.slug,
      address: b.address || '',
      phone: b.rawPhone || '',
      currency: b.currency,
      isActive: b.isActive,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-16">
        {/* Modern Admin Page Header */}
        <AdminPageHeader
          title="Outlets & Branches"
          description="Supervise physical restaurant branches, configure QR scan storefront slugs, and preview table standees."
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
            title="Refresh Outlets"
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
            <span>Provision Branch</span>
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
            <div className="flex items-center justify-between text-xs font-medium mb-1 text-neutral-500">
              <span>Total Outlets</span>
              <Building2 className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
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
            <div className="flex items-center justify-between text-xs font-medium mb-1 text-neutral-500">
              <span>Active &amp; Open</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {counts.active}
            </div>
          </div>

          <div
            className="p-4 rounded-xl border shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1 text-neutral-500">
              <span>Inactive / Offline</span>
              <Store className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold mt-1 text-neutral-600 dark:text-neutral-400">
              {counts.inactive}
            </div>
          </div>

          <div
            className="p-4 rounded-xl border shadow-xs"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1 text-neutral-500">
              <span>Total Floor Tables</span>
              <QrCode className="w-4 h-4 text-indigo-500 opacity-80" />
            </div>
            <div className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
              {branches.reduce((acc, b) => acc + (b.tablesCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* Filter Strip */}
        <div
          className="p-3 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          <div className="flex items-center gap-1.5 text-xs">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                  statusFilter === status
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search outlets by name, slug (/r/...), or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all bg-transparent"
              style={{
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Outlets Table */}
        <div
          className="rounded-xl border overflow-hidden shadow-xs"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {isLoading ? (
            <div className="p-12 text-center text-xs text-neutral-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
              <span>Loading branch outlets registry...</span>
            </div>
          ) : branches.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                No Branch Outlets Found
              </h3>
              <p className="text-xs mt-1 text-neutral-500">
                No outlets match the selected search or parent restaurant scope.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-3 px-3 py-1.5 text-xs font-bold text-white rounded-lg cursor-pointer"
                style={{ backgroundColor: 'var(--adm-primary)' }}
              >
                Provision First Branch
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className="border-b uppercase text-[11px] font-semibold tracking-wider select-none text-neutral-500"
                    style={{
                      borderColor: 'var(--adm-border)',
                      backgroundColor: 'var(--adm-surface-subtle)',
                    }}
                  >
                    <th className="py-3 px-4">Outlet Name</th>
                    <th className="py-3 px-4">Parent Brand</th>
                    <th className="py-3 px-4">Storefront QR Slug</th>
                    <th className="py-3 px-4">Location &amp; Phone</th>
                    <th className="py-3 px-4">Tables</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                  {paginatedBranches.map((b) => {
                    const isSelected = selectedBranchId === b.id;

                    return (
                      <tr
                        key={b.id}
                        className="hover:opacity-95 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        }}
                      >
                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border"
                              style={{
                                backgroundColor: isSelected ? '#3b82f6' : 'var(--adm-surface-subtle)',
                                borderColor: 'var(--adm-border)',
                                color: isSelected ? '#fff' : '#3b82f6',
                              }}
                            >
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                <span>{b.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-neutral-400 block">
                                ID: {b.id.slice(0, 8)} • {b.currency}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Parent Brand */}
                        <td className="py-3 px-4 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                            <Store className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{b.restaurant?.name || 'Unknown Brand'}</span>
                          </div>
                        </td>

                        {/* Storefront Route */}
                        <td className="py-3 px-4 text-xs">
                          <a
                            href={`http://localhost:5174/r/${b.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <span>/r/{b.slug}</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 text-xs text-neutral-500">
                          <div className="flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate">{b.address || 'Address unassigned'}</span>
                          </div>
                          {b.phone && (
                            <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-400 mt-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{b.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Tables count */}
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setInspectingTablesBranch(b)}
                            className="px-2 py-0.5 rounded-md border text-[11px] font-bold text-indigo-600 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            {b.tablesCount || 0} Tables
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {b.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Offline
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setInspectingTablesBranch(b)}
                              className="p-1.5 rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-indigo-600"
                              style={{ borderColor: 'var(--adm-border)' }}
                              title="Table QR Standees"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(b)}
                              className="p-1.5 rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-600 dark:text-neutral-300"
                              style={{ borderColor: 'var(--adm-border)' }}
                              title="Edit Outlet"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingBranch(b)}
                              className="p-1.5 rounded-lg border border-rose-300 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Archive Outlet"
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

          {/* Outlets Table Pagination */}
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={branches.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="outlets"
          />
        </div>
      </div>

      {/* Drawer: Table QR Standee Inspector */}
      {inspectingTablesBranch && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setInspectingTablesBranch(null)}
          />
          <div
            className="relative w-full max-w-xl h-full overflow-y-auto border-l shadow-2xl flex flex-col z-10"
            style={{
              backgroundColor: 'var(--adm-surface)',
              borderColor: 'var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            <div
              className="p-4 border-b flex items-start justify-between sticky top-0 z-10 backdrop-blur-md"
              style={{ backgroundColor: 'var(--adm-surface)', borderColor: 'var(--adm-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {inspectingTablesBranch.name} — Floor Tables
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono">
                    Storefront: /r/{inspectingTablesBranch.slug}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTablesBranch(null)}
                className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 text-xs">
              {/* Add Table Strip */}
              <div className="p-3.5 rounded-xl border space-y-2.5 bg-neutral-50 dark:bg-neutral-900/40" style={{ borderColor: 'var(--adm-border)' }}>
                <span className="font-bold block text-neutral-900 dark:text-neutral-100">
                  + Add Table Standee
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Table No (e.g. Table 5)"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border bg-transparent font-medium"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                  <input
                    type="text"
                    placeholder="Section (e.g. Patio)"
                    value={newTableSection}
                    onChange={(e) => setNewTableSection(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border bg-transparent"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newTableCapacity}
                      onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                      className="w-16 px-2.5 py-1.5 rounded-lg border bg-transparent text-center font-mono"
                      style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                      title="Seats Capacity"
                    />
                    <button
                      type="button"
                      disabled={!newTableNumber.trim() || addTableMutation.isPending}
                      onClick={() =>
                        addTableMutation.mutate({
                          branchId: inspectingTablesBranch.id,
                          data: {
                            tableNumber: newTableNumber.trim(),
                            section: newTableSection.trim() || 'Main Hall',
                            capacity: newTableCapacity,
                          },
                        })
                      }
                      className="flex-1 px-3 py-1.5 text-xs font-bold text-white rounded-lg cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: 'var(--adm-primary)' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Cards Grid */}
              <div className="space-y-2">
                <span className="font-bold text-neutral-700 dark:text-neutral-300 block">
                  Active Tables ({branchTables.length})
                </span>

                {branchTables.length === 0 ? (
                  <p className="text-neutral-400 italic py-4 text-center">
                    No table standees created yet. Add one above.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {branchTables.map((tbl: TableItem) => {
                      const tableUrl = `http://localhost:5174/r/${inspectingTablesBranch.slug}?table=${encodeURIComponent(
                        tbl.tableNumber,
                      )}`;

                      return (
                        <div
                          key={tbl.id}
                          className="p-3 rounded-xl border flex flex-col justify-between space-y-2"
                          style={{
                            backgroundColor: 'var(--adm-surface)',
                            borderColor: 'var(--adm-border)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">
                              {tbl.tableNumber}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                              {tbl.section}
                            </span>
                          </div>

                          <div className="text-[11px] text-neutral-500">
                            Capacity: <strong>{tbl.capacity} seats</strong>
                          </div>

                          <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--adm-border)' }}>
                            <a
                              href={tableUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 font-mono text-[11px] hover:underline flex items-center gap-1"
                            >
                              <span>Test QR</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <button
                              type="button"
                              onClick={() =>
                                deleteTableMutation.mutate({
                                  branchId: inspectingTablesBranch.id,
                                  tableId: tbl.id,
                                })
                              }
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="Delete Table"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Provision Branch */}
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
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Provision New Physical Branch</h3>
                  <p className="text-[11px] text-neutral-500">Attach a physical location with unique QR slug</p>
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
                <label className="block font-semibold mb-1">Parent Restaurant Brand *</label>
                <select
                  value={createForm.restaurantId}
                  onChange={(e) => setCreateForm({ ...createForm, restaurantId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent cursor-pointer"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                >
                  <option value="">Select Restaurant Concept...</option>
                  {availableRestaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (/r/{r.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Branch / Outlet Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Downtown Outlet, Airport Terminal 2"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Custom Storefront URL Slug (Optional)</label>
                <div className="flex items-center">
                  <span className="px-2.5 py-2 border border-r-0 rounded-l-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                    /r/
                  </span>
                  <input
                    type="text"
                    placeholder="Auto-generated if left blank"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase() })}
                    className="flex-1 px-3 py-2 rounded-r-lg border bg-transparent font-mono"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="Street address, City, Landmark"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Outlet Phone</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono uppercase"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                </div>
              </div>

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
                  {createMutation.isPending ? 'Provisioning...' : 'Provision Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Branch */}
      {editingBranch && (
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
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Edit Branch: {editingBranch.name}</h3>
                  <p className="text-[11px] text-neutral-500">Update outlet contact, route, or operational status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingBranch.id,
                  payload: editForm,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">Outlet Name</label>
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
                <label className="block font-semibold mb-1">Storefront URL Slug</label>
                <div className="flex items-center">
                  <span className="px-2.5 py-2 border border-r-0 rounded-l-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                    /r/
                  </span>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toLowerCase() })}
                    className="flex-1 px-3 py-2 rounded-r-lg border bg-transparent font-mono"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Outlet Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono uppercase"
                    style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Active &amp; Open for Customer Orders</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
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
                  {updateMutation.isPending ? 'Saving...' : 'Save Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Branch Confirmation */}
      {deletingBranch && (
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
                <h3 className="text-base font-bold">Archive Outlet: {deletingBranch.name}?</h3>
                <p className="text-xs text-neutral-500">
                  This will archive the outlet and deactivate its QR code route (<strong className="font-mono">/r/{deletingBranch.slug}</strong>).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDeletingBranch(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingBranch.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                {deleteMutation.isPending ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
