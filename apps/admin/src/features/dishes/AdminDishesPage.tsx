import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Store,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Eye,
  Tag,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { AdminPagination } from '../../components/common/AdminPagination.tsx';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.ts';
import {
  adminDishesApi,
  type AdminDishItem,
  type CreateDishPayload,
  type UpdateDishPayload,
} from '../../api/adminDishesApi.ts';
import { adminRestaurantsApi } from '../../api/adminRestaurantsApi.ts';
import { useAdminScopeStore } from '../../store/useAdminScopeStore.ts';
import { useCurrencyConverter } from '../../utils/currencyConverter.ts';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

export function AdminDishesPage() {
  const queryClient = useQueryClient();
  const { selectedRestaurantId, selectedBranchId } = useAdminScopeStore();
  const { formatAmount } = useCurrencyConverter();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingDish, setViewingDish] = useState<AdminDishItem | null>(null);
  const [editingDish, setEditingDish] = useState<AdminDishItem | null>(null);
  const [deletingDish, setDeletingDish] = useState<AdminDishItem | null>(null);

  // Lock background scrolling when any modal dialog is open
  useBodyScrollLock(Boolean(isCreateModalOpen || viewingDish || editingDish || deletingDish));

  // Forms
  const [createForm, setCreateForm] = useState<CreateDishPayload>({
    restaurantId: '',
    categoryId: '',
    name: '',
    description: '',
    basePrice: 150,
    imageUrl: '',
  });

  const [editForm, setEditForm] = useState<UpdateDishPayload>({
    name: '',
    description: '',
    basePrice: 150,
    imageUrl: '',
  });

  // Query dishes
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-dishes', selectedRestaurantId, selectedBranchId, searchQuery],
    queryFn: () =>
      adminDishesApi.getDishes({
        restaurantId: selectedRestaurantId,
        branchId: selectedBranchId,
        search: searchQuery.trim() || undefined,
      }),
  });

  // Query active restaurants for creation & categories
  const { data: restaurantsData } = useQuery({
    queryKey: ['admin-restaurants-for-dishes'],
    queryFn: () => adminRestaurantsApi.getRestaurants({ status: 'ACTIVE' }),
  });

  // Target restaurant categories for create dish modal
  const targetRestaurantId =
    createForm.restaurantId || (selectedRestaurantId !== 'ALL' ? selectedRestaurantId : '');
  const { data: targetRestaurantDetail } = useQuery({
    queryKey: ['admin-restaurant-detail-for-categories', targetRestaurantId],
    queryFn: () => adminRestaurantsApi.getRestaurantById(targetRestaurantId),
    enabled: Boolean(targetRestaurantId),
  });

  const dishes = data?.dishes ?? [];
  const totalCount = data?.total ?? 0;
  const availableRestaurants = restaurantsData?.restaurants ?? [];
  const availableCategories = targetRestaurantDetail?.categories ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateDishPayload) => adminDishesApi.createDish(payload),
    onSuccess: () => {
      toast.success('Dish catalogued successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-dishes'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create dish.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDishPayload }) =>
      adminDishesApi.updateDish(id, payload),
    onSuccess: () => {
      toast.success('Dish updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-dishes'] });
      setEditingDish(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update dish.');
    },
  });

  const toggleStockMutation = useMutation({
    mutationFn: ({ id, inStock }: { id: string; inStock: boolean }) =>
      adminDishesApi.toggleStock(id, inStock, selectedBranchId),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-dishes'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to toggle dish availability.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDishesApi.deleteDish(id),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-dishes'] });
      setDeletingDish(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete dish.');
    },
  });

  const handleOpenCreate = () => {
    const initialRestId =
      selectedRestaurantId !== 'ALL'
        ? selectedRestaurantId
        : availableRestaurants[0]?.id || '';
    setCreateForm({
      restaurantId: initialRestId,
      categoryId: '',
      name: '',
      description: '',
      basePrice: 150,
      imageUrl: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (dish: AdminDishItem) => {
    setEditingDish(dish);
    setEditForm({
      name: dish.name,
      description: dish.description || '',
      basePrice: dish.basePrice,
      imageUrl: dish.imageUrl || '',
    });
  };

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (stockFilter === 'IN_STOCK') return dish.inStock;
      if (stockFilter === 'OUT_OF_STOCK') return !dish.inStock;
      return true;
    });
  }, [dishes, stockFilter]);

  // Paginated slice
  const paginatedDishes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDishes.slice(start, start + pageSize);
  }, [filteredDishes, page, pageSize]);

  const totalPages = Math.ceil(filteredDishes.length / pageSize) || 1;
  const inStockCount = dishes.filter((d) => d.inStock).length;
  const outOfStockCount = dishes.length - inStockCount;

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-16">
        {/* Modern Admin Page Header */}
        <AdminPageHeader
          title="Menu & Dish Catalog"
          description="Supervise all culinary items, adjust prices across brands, and toggle real-time stock availability."
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
            title="Refresh Catalog"
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
            <span>Add Dish</span>
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
              <span>Catalog Dishes</span>
              <UtensilsCrossed className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
              {totalCount}
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
              <span>In-Stock Dishes</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-80" />
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {inStockCount}
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
              <span>Sold Out / Inactive</span>
              <XCircle className="w-4 h-4 text-rose-500 opacity-80" />
            </div>
            <div className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {outOfStockCount}
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
              <span>Active Brands</span>
              <Store className="w-4 h-4 text-indigo-500 opacity-80" />
            </div>
            <div className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
              {availableRestaurants.length}
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
            {(['ALL', 'IN_STOCK', 'OUT_OF_STOCK'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setStockFilter(filter);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  stockFilter === filter
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {filter === 'ALL'
                  ? `All Stock (${dishes.length})`
                  : filter === 'IN_STOCK'
                  ? `In Stock (${inStockCount})`
                  : `Sold Out (${outOfStockCount})`}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dishes by name, category, or ingredients..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: 'var(--adm-surface-subtle)',
                borderColor: 'var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dishes Table */}
        <div
          className="rounded-xl border overflow-hidden shadow-xs flex flex-col"
          style={{
            backgroundColor: 'var(--adm-surface)',
            borderColor: 'var(--adm-border)',
          }}
        >
          {isLoading ? (
            <div className="p-12 text-center text-xs text-neutral-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
              <span>Loading master dish catalog...</span>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div
              className="p-12 text-center rounded-xl border border-dashed m-4"
              style={{ borderColor: 'var(--adm-border)' }}
            >
              <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                No Dishes Found
              </h3>
              <p className="text-xs mt-1 text-neutral-500">
                No dishes match your active filters or brand scope.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-3 px-3 py-1.5 text-xs font-bold text-white rounded-lg cursor-pointer"
                style={{ backgroundColor: 'var(--adm-primary)' }}
              >
                Add First Dish
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
                    <th className="py-3 px-4">Dish &amp; Details</th>
                    <th className="py-3 px-4">Brand / Concept</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Base Price</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4">Branches</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                  {paginatedDishes.map((dish) => {
                    const formattedPrice = formatAmount(dish.basePrice);

                    return (
                      <tr
                        key={dish.id}
                        className="hover:opacity-95 transition-colors cursor-pointer group"
                        style={{ backgroundColor: 'transparent' }}
                        onClick={() => setViewingDish(dish)}
                      >
                        {/* Dish & Details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {dish.imageUrl ? (
                              <img
                                src={dish.imageUrl}
                                alt={dish.name}
                                className="w-10 h-10 rounded-lg object-cover border shrink-0"
                                style={{ borderColor: 'var(--adm-border)' }}
                                onError={(e) => {
                                  // Fallback to initial box on load failure
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border uppercase text-neutral-400 bg-neutral-100 dark:bg-neutral-800"
                                style={{ borderColor: 'var(--adm-border)' }}
                              >
                                {dish.name.slice(0, 2)}
                              </div>
                            )}

                            <div className="min-w-0 max-w-xs">
                              <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                                {dish.name}
                              </h4>
                              <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                                {dish.description || 'No recipe description available.'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Brand Concept */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                            <Store className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>{dish.restaurant?.name || 'Brand'}</span>
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {dish.category?.name ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Tag className="w-2.5 h-2.5" />
                              {dish.category.name}
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic">Uncategorized</span>
                          )}
                        </td>

                        {/* Base Price */}
                        <td className="py-3 px-4 font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                          {formattedPrice.formatted}
                        </td>

                        {/* Availability / Stock Toggle */}
                        <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              toggleStockMutation.mutate({
                                id: dish.id,
                                inStock: !dish.inStock,
                              })
                            }
                            className="cursor-pointer"
                            title={
                              dish.inStock
                                ? 'In Stock (Click to toggle Sold Out)'
                                : 'Sold Out (Click to toggle In Stock)'
                            }
                          >
                            {dish.inStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> IN STOCK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> SOLD OUT
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Outlets Count */}
                        <td className="py-3 px-4 text-[11px] text-neutral-400 font-mono whitespace-nowrap">
                          {dish.branchProductsCount} {dish.branchProductsCount === 1 ? 'outlet' : 'outlets'}
                        </td>

                        {/* Actions: View, Edit, Delete */}
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            {/* View Button */}
                            <button
                              type="button"
                              onClick={() => setViewingDish(dish)}
                              className="px-2 py-1 text-xs font-semibold rounded-md border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer text-neutral-700 dark:text-neutral-300"
                              style={{ borderColor: 'var(--adm-border)' }}
                              title="View Dish Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-500" />
                              <span>View</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(dish)}
                              className="px-2 py-1 text-xs font-semibold rounded-md border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer text-neutral-700 dark:text-neutral-300"
                              style={{ borderColor: 'var(--adm-border)' }}
                              title="Edit Dish"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeletingDish(dish)}
                              className="p-1 rounded-md border text-rose-600 hover:bg-rose-500/10 border-rose-500/20 transition-colors cursor-pointer"
                              title="Archive Dish"
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

          {/* Pagination Component */}
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredDishes.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="dishes"
          />
        </div>
      </div>

      {/* Modal: View Dish Details */}
      {viewingDish && (
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
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{viewingDish.name}</h3>
                  <p className="text-[11px] text-neutral-500 font-mono">ID: {viewingDish.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDish(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Photo Banner if available */}
              {viewingDish.imageUrl && (
                <div className="w-full h-44 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--adm-border)' }}>
                  <img
                    src={viewingDish.imageUrl}
                    alt={viewingDish.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Grid Attributes */}
              <div
                className="p-3.5 rounded-xl border grid grid-cols-2 gap-3"
                style={{
                  backgroundColor: 'var(--adm-surface-subtle)',
                  borderColor: 'var(--adm-border)',
                }}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Brand Concept</span>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1 mt-0.5">
                    <Store className="w-3.5 h-3.5 text-indigo-500" />
                    {viewingDish.restaurant?.name}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Category</span>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {viewingDish.category?.name || 'Unassigned'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Base Price</span>
                  <p className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {formatAmount(viewingDish.basePrice).formatted}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Live Status</span>
                  <p className="mt-0.5">
                    {viewingDish.inStock ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                        ● IN STOCK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
                        ● SOLD OUT
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Description &amp; Ingredients
                </span>
                <p className="p-3 rounded-lg border leading-relaxed text-neutral-700 dark:text-neutral-300" style={{ borderColor: 'var(--adm-border)' }}>
                  {viewingDish.description || 'No detailed recipe description provided for this catalog dish.'}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-4 mt-4 border-t" style={{ borderColor: 'var(--adm-border)' }}>
              <span className="text-[10px] text-neutral-400 font-mono">
                Assigned to {viewingDish.branchProductsCount} branch outlet(s)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const dish = viewingDish;
                    setViewingDish(null);
                    handleOpenEdit(dish);
                  }}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
                  style={{ borderColor: 'var(--adm-border)' }}
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Edit Dish</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDish(null)}
                  className="px-4 py-1.5 rounded-lg text-white font-bold text-xs cursor-pointer"
                  style={{ backgroundColor: 'var(--adm-primary)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Dish */}
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
                  <h3 className="text-sm font-bold">Catalog New Dish</h3>
                  <p className="text-[11px] text-neutral-500">Create a dish across all or specific outlets</p>
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
                <label className="block font-semibold mb-1">Target Restaurant Brand *</label>
                <select
                  value={createForm.restaurantId}
                  onChange={(e) => setCreateForm({ ...createForm, restaurantId: e.target.value, categoryId: '' })}
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
                <label className="block font-semibold mb-1">Menu Category *</label>
                <select
                  value={createForm.categoryId}
                  onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent cursor-pointer"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                >
                  <option value="">Select Category...</option>
                  {availableCategories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Dish Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Special Chicken Dum Biryani"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Base Price *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="150"
                  value={createForm.basePrice}
                  onChange={(e) => setCreateForm({ ...createForm, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono font-bold"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Short description of ingredients or portion size"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
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
                  disabled={createMutation.isPending || !createForm.categoryId}
                  className="px-4 py-2 rounded-lg text-white font-bold cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--adm-primary)' }}
                >
                  {createMutation.isPending ? 'Cataloguing...' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Dish */}
      {editingDish && (
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
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Edit Dish: {editingDish.name}</h3>
                  <p className="text-[11px] text-neutral-500">Update pricing, description, or culinary photo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingDish.id,
                  payload: editForm,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">Dish Name</label>
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
                <label className="block font-semibold mb-1">Base Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.basePrice}
                  onChange={(e) => setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono font-bold"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Image URL</label>
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-transparent font-mono"
                  style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-text)' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--adm-border)' }}>
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
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
                  {updateMutation.isPending ? 'Saving...' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Dish */}
      {deletingDish && (
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
                <h3 className="text-base font-bold">Archive Dish: {deletingDish.name}?</h3>
                <p className="text-xs text-neutral-500">
                  This will remove this item from the active menu catalog and customer storefronts.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDeletingDish(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingDish.id)}
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
