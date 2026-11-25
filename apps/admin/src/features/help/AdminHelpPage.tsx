import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  FileText,
  Filter,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout.tsx';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader.tsx';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.ts';
import { adminHelpApi, type HelpArticle } from '../../api/adminHelpApi.ts';
import { RichTextEditor } from './components/RichTextEditor.tsx';
import { toast } from '../../components/ui/toast/useAdminToastStore.ts';

const CATEGORIES = [
  'General',
  'Ordering & Checkout',
  'Payments & Refunds',
  'Menu & Dishes',
  'Kitchen Display (KDS)',
  'Staff & Roles',
  'QR & Tables',
  'Troubleshooting',
];

export function AdminHelpPage() {
  const queryClient = useQueryClient();
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'CUSTOMER' | 'RESTAURANT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [deleteConfirmArticle, setDeleteConfirmArticle] = useState<HelpArticle | null>(null);
  const [previewArticle, setPreviewArticle] = useState<HelpArticle | null>(null);

  useBodyScrollLock(Boolean(isModalOpen || deleteConfirmArticle || previewArticle));

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    audience: 'CUSTOMER' as 'CUSTOMER' | 'RESTAURANT' | 'ALL',
    category: 'General',
    sortOrder: 0,
    isPublished: true,
  });

  // Query articles
  const { data: articles = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-help-articles', audienceFilter],
    queryFn: () => adminHelpApi.getAll(audienceFilter),
  });

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData & { id?: string }) => {
      if (payload.id) {
        return adminHelpApi.update(payload.id, payload);
      }
      return adminHelpApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-articles'] });
      toast.success(editingArticle ? 'Article updated successfully!' : 'Help article created!');
      handleCloseModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save help article');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminHelpApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-articles'] });
      toast.success('Help article deleted');
      setDeleteConfirmArticle(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete article');
    },
  });

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      audience: audienceFilter === 'RESTAURANT' ? 'RESTAURANT' : 'CUSTOMER',
      category: 'General',
      sortOrder: (articles?.length || 0) + 1,
      isPublished: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (article: HelpArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      audience: article.audience,
      category: article.category,
      sortOrder: article.sortOrder,
      isPublished: article.isPublished,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
  };

  // Helper to auto-generate slug from title
  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug === '' || !editingArticle ? slug : prev.slug,
    }));
  };

  // Filtered list
  const filteredArticles = articles.filter((art) => {
    const matchesAudience = audienceFilter === 'ALL' || art.audience === audienceFilter || art.audience === 'ALL';
    const matchesCategory = categoryFilter === 'ALL' || art.category === categoryFilter;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAudience && matchesCategory && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-20">
        {/* Modern Admin Page Header */}
        <AdminPageHeader
          title="Help & Knowledge Base"
          description="Author, publish, and organize customer FAQs and restaurant guide articles with visual rich text editing."
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
            className="px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm text-white cursor-pointer bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Help Article
          </button>
        </AdminPageHeader>

        {/* Toolbar: Audience Tabs, Search, and Category Filter */}
        <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] p-3.5 rounded-xl space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Audience Segmented Controls */}
            <div className="flex bg-[var(--adm-bg)] border border-[var(--adm-border)] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setAudienceFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  audienceFilter === 'ALL'
                    ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs'
                    : 'text-[var(--adm-muted)] hover:text-[var(--adm-text)]'
                }`}
              >
                All ({articles.length})
              </button>
              <button
                type="button"
                onClick={() => setAudienceFilter('CUSTOMER')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  audienceFilter === 'CUSTOMER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[var(--adm-muted)] hover:text-[var(--adm-text)]'
                }`}
              >
                <span>🧑 Customer FAQs</span>
              </button>
              <button
                type="button"
                onClick={() => setAudienceFilter('RESTAURANT')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  audienceFilter === 'RESTAURANT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[var(--adm-muted)] hover:text-[var(--adm-text)]'
                }`}
              >
                <span>🏪 Restaurant Guides</span>
              </button>
            </div>

            {/* Right side: Search, Category, and Quick Add */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--adm-bg)] border border-[var(--adm-border)] rounded-lg text-[var(--adm-text)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-[var(--adm-bg)] border border-[var(--adm-border)] rounded-lg text-[var(--adm-text)] px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean Articles Table */}
        <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-16 text-center text-[var(--adm-muted)] text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
              <span>Loading help articles...</span>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--adm-bg)] border border-[var(--adm-border)] flex items-center justify-center mx-auto text-[var(--adm-muted)]">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[var(--adm-text)]">No Help Articles Found</h3>
              <p className="text-xs text-[var(--adm-muted)] max-w-sm mx-auto">
                No articles match your current filter. Click "New Help Article" to add one.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Article
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--adm-border)] bg-[var(--adm-bg)] text-[var(--adm-muted)] font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Article Title & Route</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Order</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--adm-border)] text-[var(--adm-text)]">
                  {filteredArticles.map((article) => (
                    <tr
                      key={article.id}
                      className="hover:bg-neutral-500/5 transition-colors"
                    >
                      {/* Title & Slug */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-sm text-[var(--adm-text)] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span
                            onClick={() => setPreviewArticle(article)}
                            className="cursor-pointer hover:underline"
                          >
                            {article.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--adm-muted)] font-mono mt-0.5 pl-6">
                          /help/{article.slug}
                        </div>
                      </td>

                      {/* Audience */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            article.audience === 'CUSTOMER'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : article.audience === 'RESTAURANT'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                          }`}
                        >
                          {article.audience === 'CUSTOMER'
                            ? '🧑 Customer'
                            : article.audience === 'RESTAURANT'
                            ? '🏪 Restaurant'
                            : '🌐 All'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--adm-bg)] border border-[var(--adm-border)] text-[11px] font-medium text-[var(--adm-text)]">
                          <Tag className="w-3 h-3 text-[var(--adm-muted)]" />
                          {article.category || 'General'}
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-[var(--adm-muted)] whitespace-nowrap">
                        #{article.sortOrder}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {article.isPublished ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[11px] text-[var(--adm-muted)] whitespace-nowrap">
                        {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewArticle(article)}
                            className="p-1.5 rounded-lg border border-transparent hover:border-[var(--adm-border)] hover:bg-[var(--adm-bg)] text-[var(--adm-muted)] hover:text-[var(--adm-text)] transition-all cursor-pointer"
                            title="Preview Article"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(article)}
                            className="p-1.5 rounded-lg border border-transparent hover:border-[var(--adm-border)] hover:bg-[var(--adm-bg)] text-blue-500 hover:text-blue-400 transition-all cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmArticle(article)}
                            className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 transition-all cursor-pointer"
                            title="Delete Article"
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
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--adm-border)] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--adm-text)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  {editingArticle ? 'Edit Help Article' : 'Create New Help Article'}
                </h2>
                <p className="text-xs text-[var(--adm-muted)] mt-0.5">
                  Compose guidance for customers or restaurant teams with Summernote-style rich text.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-[var(--adm-muted)] hover:text-[var(--adm-text)] hover:bg-[var(--adm-border)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--adm-text)]">
                    Article Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. How to track your live order status"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--adm-bg)] border border-[var(--adm-border)] rounded-lg text-[var(--adm-text)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--adm-text)]">
                    URL Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. how-to-track-live-order-status"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--adm-bg)] border border-[var(--adm-border)] rounded-lg text-[var(--adm-text)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Target Audience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--adm-text)]">Target Audience</label>
                  <select
                    value={formData.audience}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        audience: e.target.value as 'CUSTOMER' | 'RESTAURANT' | 'ALL',
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-[var(--adm-bg)] border border-[var(--adm-border)] rounded-lg text-[var(--adm-text)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="CUSTOMER">🧑 Customer Storefront</option>
                    <option value="RESTAURANT">🏪 Restaurant Owner & Staff</option>
                    <option value="ALL">🌐 Shared / All Audiences</option>
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--adm-text)]">Category</label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-[var(--adm-bg)] border border-[var(--adm-border)] rounded-lg text-[var(--adm-text)] focus:outline-none focus:border-emerald-500"
                    placeholder="Category name"
                  />
                  <datalist id="category-suggestions">
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* Sort Order & Published */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--adm-text)]">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 text-xs bg-[var(--adm-bg)] border border-[var(--adm-border)] rounded-lg text-[var(--adm-text)] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--adm-text)]">Status</label>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, isPublished: !prev.isPublished }))}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.isPublished
                          ? 'bg-emerald-600/20 text-emerald-500 border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      {formData.isPublished ? 'Live' : 'Draft'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Summernote-Style Rich Text Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--adm-text)] flex items-center justify-between">
                  <span>
                    Article Content <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-[var(--adm-muted)]">
                    Summernote visual formatting with HTML source mode
                  </span>
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                  placeholder="Type the full article content here with formatting, headings, bullet points, links, etc..."
                  minHeight="320px"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--adm-border)] flex items-center justify-end gap-3 bg-[var(--adm-bg)]">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--adm-muted)] hover:text-[var(--adm-text)] hover:bg-[var(--adm-border)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!formData.title.trim() || !formData.slug.trim() || saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    ...formData,
                    ...(editingArticle ? { id: editingArticle.id } : {}),
                  })
                }
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                {saveMutation.isPending ? 'Saving...' : editingArticle ? 'Update Article' : 'Publish Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE PREVIEW MODAL */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--adm-border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                  {previewArticle.category} • {previewArticle.audience}
                </span>
                <h3 className="text-base font-bold text-[var(--adm-text)]">{previewArticle.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="p-1.5 rounded-lg text-[var(--adm-muted)] hover:text-[var(--adm-text)] hover:bg-[var(--adm-border)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-[var(--adm-text)]">
              <div
                dangerouslySetInnerHTML={{ __html: previewArticle.content }}
                className="rich-text-rendered"
              />
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Help Article?
            </h3>
            <p className="text-xs text-[var(--adm-muted)]">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[var(--adm-text)]">"{deleteConfirmArticle.title}"</strong>? This will remove it from both client help portals.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmArticle(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--adm-muted)] hover:bg-[var(--adm-border)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteConfirmArticle.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
