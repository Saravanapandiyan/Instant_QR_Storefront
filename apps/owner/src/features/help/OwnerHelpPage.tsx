import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  updatedAt: string;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Kitchen Display (KDS)': 'KDS setup, tablet mounting, station routing, and live cooking timers',
  'Staff & Roles': 'Role-based access, terminal PINs, cashier permissions, and shift management',
  'Menu & Dishes': 'AI menu translation, pricing, categories, out-of-stock toggles, and modifiers',
  'Ordering & Checkout': 'Table QR orders, takeaway pickup, cart customization, and status tracking',
  'Payments & Billing': 'Instant UPI QR, cash at counter, thermal receipts, and order credits',
  'Payments & Refunds': 'Instant UPI QR, cash at counter, verification, and payment troubleshooting',
  'QR & Tables': 'Digital table stands, print QR sheets, dining area layout, and scan troubleshooting',
  'General Queries': 'General operational queries, getting started, and account configurations',
  'General': 'General operational queries, getting started, and account configurations',
  'Troubleshooting': 'Common hardware, network, sync, and browser troubleshooting guides',
};

export const OwnerHelpPage: React.FC = () => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/api/v1/help?audience=RESTAURANT')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setArticles(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load restaurant help guides:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute all unique categories
  const categories = Array.from(
    new Set(articles.map((a) => a.category?.trim() || 'General Queries')),
  );

  // If user searched or selected a category, we show the View Page (Category & Submenus)
  const isDetailView = selectedCategory !== null || searchQuery.trim().length > 0;

  // Filter articles based on selected category and search query
  const displayedArticles = articles.filter((art) => {
    const artCat = art.category?.trim() || 'General Queries';
    const matchesCategory = !selectedCategory || artCat === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      art.title.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      artCat.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Current active article (big view)
  const activeArticle =
    displayedArticles.find((a) => a.id === activeArticleId) || displayedArticles[0] || null;

  const currentIndex = activeArticle
    ? displayedArticles.findIndex((a) => a.id === activeArticle.id)
    : -1;
  const prevArticle = currentIndex > 0 ? displayedArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < displayedArticles.length - 1
      ? displayedArticles[currentIndex + 1]
      : null;

  return (
    <DashboardLayout>
      <div className="pb-16 max-w-6xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-semibold text-muted">Loading Internal Wiki...</p>
          </div>
        ) : !isDetailView ? (
          /* ========================================================================= */
          /* IMAGE 4 LAYOUT: Internal Wiki Home (Category Cards Grid)                   */
          /* ========================================================================= */
          <div className="space-y-10 pt-4">
            {/* Centered Title */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
                Internal Wiki
              </h1>
              <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto">
                Step-by-step guides, operational procedures, and quick troubleshooting for restaurant staff.
              </p>
            </div>

            {/* Large Centered Search Box */}
            <div className="max-w-xl mx-auto relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search your question"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary shadow-xs transition-all"
              />
            </div>

            {/* Grid of Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const catArticles = articles.filter(
                  (a) => (a.category?.trim() || 'General Queries') === cat,
                );
                return (
                  <div
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (catArticles.length > 0) {
                        setActiveArticleId(catArticles[0].id);
                      }
                    }}
                    className="bg-surface border border-border rounded-xl p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer text-center flex flex-col justify-between group min-h-[160px]"
                  >
                    <div>
                      <h3 className="text-base font-bold text-text group-hover:text-primary transition-colors">
                        {cat}
                      </h3>
                      <p className="text-xs text-muted mt-2 leading-relaxed">
                        {CATEGORY_DESCRIPTIONS[cat] || `Operational guides, procedures, and setup for ${cat}`}
                      </p>
                    </div>
                    <div className="mt-5 text-xs font-semibold text-primary/80">
                      {catArticles.length} {catArticles.length === 1 ? 'article' : 'articles'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* BIG VIEW PAGE: Top Submenus + Large Document Reader (No Open/Close)       */
          /* ========================================================================= */
          <div className="space-y-6 pt-2">
            {/* Top Navigation: Back to All Categories */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
                setActiveArticleId(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to All Categories</span>
            </button>

            {/* Two-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Search & Categories List */}
              <div className="md:col-span-4 lg:col-span-3 space-y-5">
                {/* Search Box in Sidebar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search your question"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-surface border border-border rounded-lg text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary shadow-2xs"
                  />
                </div>

                {/* Categories List */}
                <div>
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5">
                    Categories
                  </h4>
                  <div className="space-y-1">
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat;
                      const count = articles.filter(
                        (a) => (a.category?.trim() || 'General Queries') === cat,
                      ).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            const firstArt = articles.find(
                              (a) => (a.category?.trim() || 'General Queries') === cat,
                            );
                            if (firstArt) setActiveArticleId(firstArt.id);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                            isActive
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-text hover:bg-surface-2'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className="text-[10px] opacity-70">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Top Sub-menus + Big Help Page View */}
              <div className="md:col-span-8 lg:col-span-9 space-y-5">
                {/* Category Header */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text">
                    {selectedCategory || 'Search Results'}
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    {selectedCategory
                      ? CATEGORY_DESCRIPTIONS[selectedCategory] || `Operational guides and walk-throughs for ${selectedCategory}`
                      : `Showing results matching "${searchQuery}"`}
                  </p>
                </div>

                {/* Sleek Submenu Tabs (shown if more than 1 guide in topic) */}
                {displayedArticles.length > 1 && (
                  <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-none pt-1">
                    {displayedArticles.map((art) => {
                      const isCurrent = activeArticle?.id === art.id;
                      return (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => setActiveArticleId(art.id)}
                          className={`pb-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            isCurrent
                              ? 'border-primary text-primary font-bold'
                              : 'border-transparent text-muted hover:text-text hover:border-border'
                          }`}
                        >
                          <span>{art.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* BIG HELP PAGE DISPLAY (No accordion / No collapse) */}
                {activeArticle ? (
                  <div className="bg-surface border border-border rounded-2xl p-6 sm:p-9 shadow-xs space-y-6">
                    {/* Header */}
                    <div className="border-b border-border pb-4 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {activeArticle.category || 'General'}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          /help/{activeArticle.slug}
                        </span>
                      </div>
                      <h1 className="text-base sm:text-lg font-bold text-text leading-snug">
                        {activeArticle.title}
                      </h1>
                    </div>

                    {/* Rich Content Body (Summernote standard rendering) */}
                    <div
                      dangerouslySetInnerHTML={{ __html: activeArticle.content }}
                      className="rich-text-rendered text-text"
                    />

                    {/* Bottom Next/Prev Pagination */}
                    <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
                      {prevArticle ? (
                        <button
                          type="button"
                          onClick={() => setActiveArticleId(prevArticle.id)}
                          className="px-4 py-2.5 rounded-xl border border-border bg-surface-2 hover:bg-surface-2/80 text-xs font-bold text-text flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-primary" />
                          <span className="truncate max-w-[150px] sm:max-w-xs">
                            {prevArticle.title}
                          </span>
                        </button>
                      ) : (
                        <div />
                      )}

                      {nextArticle ? (
                        <button
                          type="button"
                          onClick={() => setActiveArticleId(nextArticle.id)}
                          className="px-4 py-2.5 rounded-xl border border-border bg-primary text-on-primary hover:bg-primary-hover text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ml-auto shadow-xs"
                        >
                          <span className="truncate max-w-[150px] sm:max-w-xs">
                            {nextArticle.title}
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface border border-border rounded-2xl py-12 text-center space-y-3">
                    <FileQuestion className="w-10 h-10 text-muted mx-auto" />
                    <h3 className="text-sm font-bold text-text">No Articles Found</h3>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      No guides found matching your query. Try different keywords or browse another category.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
