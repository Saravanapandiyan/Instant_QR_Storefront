import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Loader2,
  UtensilsCrossed,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { fetchStorefrontBySlug } from '../../api/storefrontApi.ts';
import { useStorefrontTheme } from '../../store/useStorefrontTheme.ts';
import type { StorefrontMenuData } from '../../types/storefront.ts';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  updatedAt: string;
}

const CUSTOMER_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Ordering & Checkout': 'How to browse dishes, add dietary notes, select portion sizes, and track order status',
  'Payments & Refunds': 'Paying with Instant UPI (GPay, PhonePe, Paytm) vs paying cash at the billing counter',
  'Menu & Dishes': 'Understanding menu badges, spicy levels, allergens, and regional script translations',
  'QR & Tables': 'Scanning table QR codes, switching tables, and placing group or split dining orders',
  'General Queries': 'General storefront questions, operating hours, and customer ordering assistance',
  'General': 'General storefront questions, operating hours, and customer ordering assistance',
  'Troubleshooting': 'Solving camera QR scan issues, network reconnection, and order receipt questions',
};

export const CustomerHelpPage: React.FC = () => {
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [menuData, setMenuData] = useState<StorefrontMenuData | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // URL query params
  const initialCat = searchParams.get('category') || null;
  const initialArtId = searchParams.get('article') || null;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState<string | null>(initialArtId);

  // Apply theme styling dynamically based on restaurant config
  useStorefrontTheme(menuData?.restaurant?.themeConfig);

  useEffect(() => {
    let isMounted = true;

    // 1. Load restaurant info & theme
    if (branchSlug) {
      fetchStorefrontBySlug(branchSlug)
        .then((data) => {
          if (isMounted) setMenuData(data);
        })
        .catch((err) => {
          console.error('Failed to load restaurant details:', err);
        });
    }

    // 2. Load customer help articles
    fetch('/api/v1/help?audience=CUSTOMER')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setArticles(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load customer help guides:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchSlug]);

  // Sync category selection with URL
  const handleSelectCategory = (cat: string | null) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat) {
      newParams.set('category', cat);
    } else {
      newParams.delete('category');
    }
    newParams.delete('article');
    setSearchParams(newParams, { replace: true });

    if (cat) {
      const firstArt = articles.find(
        (a) => (a.category?.trim() || 'General Queries') === cat,
      );
      if (firstArt) setActiveArticleId(firstArt.id);
    } else {
      setActiveArticleId(null);
    }
  };

  const handleSelectArticle = (artId: string) => {
    setActiveArticleId(artId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('article', artId);
    setSearchParams(newParams, { replace: true });
  };

  // Compute all unique categories
  const categories = Array.from(
    new Set(articles.map((a) => a.category?.trim() || 'General Queries')),
  );

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

  const restaurantName = menuData?.restaurant?.name || 'Restaurant';
  const branchName = menuData?.branch?.name || '';

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--sf-surface, #fbfbfb)',
        color: 'var(--sf-text, #18181b)',
      }}
    >
      {/* Top Storefront Navigation Header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs"
        style={{
          backgroundColor: 'var(--sf-surface, #ffffff)',
          borderColor: 'var(--sf-border, #e4e4e7)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/r/${branchSlug || ''}`)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>

        <div className="flex items-center gap-2">
          {menuData?.restaurant?.logoUrl ? (
            <img
              src={menuData.restaurant.logoUrl}
              alt={restaurantName}
              className="w-7 h-7 rounded-lg object-cover"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: 'var(--sf-primary, #ea580c)',
                color: 'var(--sf-primary-contrast, #ffffff)',
              }}
            >
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          )}
          <span className="font-bold text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">
            {restaurantName} {branchName ? `• ${branchName}` : ''}
          </span>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{
            backgroundColor: 'var(--sf-primary, #ea580c)',
            color: 'var(--sf-primary-contrast, #ffffff)',
          }}
        >
          Help Wiki
        </span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: 'var(--sf-primary, #ea580c)' }}
            />
            <p className="text-xs font-semibold opacity-70">Loading Customer Help Wiki...</p>
          </div>
        ) : !isDetailView ? (
          /* ========================================================================= */
          /* IMAGE 4 LAYOUT: Customer Wiki Home (Category Cards Grid)                   */
          /* ========================================================================= */
          <div className="space-y-10 pt-4">
            {/* Centered Title */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Customer Help & Knowledge Base
              </h1>
              <p className="text-xs sm:text-sm opacity-70 max-w-lg mx-auto">
                Everything you need to know about table ordering, online UPI payments, and tracking live meals.
              </p>
            </div>

            {/* Large Centered Search Box */}
            <div className="max-w-xl mx-auto relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                placeholder="Search your question"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border rounded-xl text-sm placeholder:opacity-50 focus:outline-none shadow-xs transition-all"
                style={{
                  backgroundColor: 'var(--sf-surface, #ffffff)',
                  borderColor: 'var(--sf-border, #e4e4e7)',
                  color: 'inherit',
                }}
              />
            </div>

            {/* Grid of Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const count = articles.filter(
                  (a) => (a.category?.trim() || 'General Queries') === cat,
                ).length;
                return (
                  <div
                    key={cat}
                    onClick={() => handleSelectCategory(cat)}
                    className="border rounded-xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all cursor-pointer text-center flex flex-col justify-between group min-h-[160px]"
                    style={{
                      backgroundColor: 'var(--sf-surface, #ffffff)',
                      borderColor: 'var(--sf-border, #e4e4e7)',
                    }}
                  >
                    <div>
                      <h3
                        className="text-base font-bold transition-colors group-hover:opacity-80"
                        style={{ color: 'var(--sf-text, #18181b)' }}
                      >
                        {cat}
                      </h3>
                      <p className="text-xs opacity-70 mt-2 leading-relaxed">
                        {CUSTOMER_CATEGORY_DESCRIPTIONS[cat] || `Answers, tips, and step-by-step guides for ${cat}`}
                      </p>
                    </div>
                    <div
                      className="mt-5 text-xs font-semibold"
                      style={{ color: 'var(--sf-primary, #ea580c)' }}
                    >
                      {count} {count === 1 ? 'article' : 'articles'}
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
                handleSelectCategory(null);
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
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
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search your question"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg text-xs sm:text-sm placeholder:opacity-50 focus:outline-none shadow-2xs"
                    style={{
                      backgroundColor: 'var(--sf-surface, #ffffff)',
                      borderColor: 'var(--sf-border, #e4e4e7)',
                      color: 'inherit',
                    }}
                  />
                </div>

                {/* Categories List */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2.5">
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
                          onClick={() => handleSelectCategory(cat)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                            isActive ? 'font-bold shadow-2xs' : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: isActive
                              ? 'var(--sf-primary, #ea580c)'
                              : 'var(--sf-surface-alt, rgba(0,0,0,0.03))',
                            color: isActive
                              ? 'var(--sf-primary-contrast, #ffffff)'
                              : 'inherit',
                          }}
                        >
                          <span>{cat}</span>
                          <span className="text-[10px] opacity-75">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Top Submenus + Big Help Page Reader */}
              <div className="md:col-span-8 lg:col-span-9 space-y-5">
                {/* Category Header */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {selectedCategory || 'Search Results'}
                  </h2>
                  <p className="text-xs opacity-70 mt-1">
                    {selectedCategory
                      ? CUSTOMER_CATEGORY_DESCRIPTIONS[selectedCategory] || `Help articles and customer FAQs for ${selectedCategory}`
                      : `Showing results matching "${searchQuery}"`}
                  </p>
                </div>

                {/* Sleek Submenu Tabs (shown if more than 1 guide in topic) */}
                {displayedArticles.length > 1 && (
                  <div
                    className="flex items-center gap-1 border-b overflow-x-auto scrollbar-none pt-1"
                    style={{ borderColor: 'var(--sf-border, #e4e4e7)' }}
                  >
                    {displayedArticles.map((art) => {
                      const isCurrent = activeArticle?.id === art.id;
                      return (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => handleSelectArticle(art.id)}
                          className={`pb-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            isCurrent ? 'font-bold' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{
                            borderColor: isCurrent
                              ? 'var(--sf-primary, #ea580c)'
                              : 'transparent',
                            color: isCurrent
                              ? 'var(--sf-primary, #ea580c)'
                              : 'inherit',
                          }}
                        >
                          <span>{art.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* BIG HELP PAGE DISPLAY (No accordion / No collapse) */}
                {activeArticle ? (
                  <div
                    className="border rounded-2xl p-6 sm:p-9 shadow-xs space-y-6"
                    style={{
                      backgroundColor: 'var(--sf-surface, #ffffff)',
                      borderColor: 'var(--sf-border, #e4e4e7)',
                    }}
                  >
                    {/* Header */}
                    <div
                      className="border-b pb-4 space-y-1.5"
                      style={{ borderColor: 'var(--sf-border, #e4e4e7)' }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            color: 'var(--sf-primary, #ea580c)',
                          }}
                        >
                          {activeArticle.category || 'General'}
                        </span>
                        <span className="font-mono text-[10px] opacity-60">
                          /help/{activeArticle.slug}
                        </span>
                      </div>
                      <h1 className="text-base sm:text-lg font-bold leading-snug">
                        {activeArticle.title}
                      </h1>
                    </div>

                    {/* Rich Content Body (Summernote standard rendering) */}
                    <div
                      dangerouslySetInnerHTML={{ __html: activeArticle.content }}
                      className="rich-text-rendered"
                    />

                    {/* Bottom Next/Prev Pagination */}
                    <div
                      className="pt-6 border-t flex items-center justify-between gap-4"
                      style={{ borderColor: 'var(--sf-border, #e4e4e7)' }}
                    >
                      {prevArticle ? (
                        <button
                          type="button"
                          onClick={() => handleSelectArticle(prevArticle.id)}
                          className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                          style={{
                            backgroundColor: 'var(--sf-surface-alt, rgba(0,0,0,0.04))',
                            borderColor: 'var(--sf-border, #e4e4e7)',
                          }}
                        >
                          <ChevronLeft
                            className="w-4 h-4"
                            style={{ color: 'var(--sf-primary, #ea580c)' }}
                          />
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
                          onClick={() => handleSelectArticle(nextArticle.id)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ml-auto shadow-xs"
                          style={{
                            backgroundColor: 'var(--sf-primary, #ea580c)',
                            color: 'var(--sf-primary-contrast, #ffffff)',
                          }}
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
                  <div
                    className="border rounded-2xl py-12 text-center space-y-3"
                    style={{
                      backgroundColor: 'var(--sf-surface, #ffffff)',
                      borderColor: 'var(--sf-border, #e4e4e7)',
                    }}
                  >
                    <FileQuestion className="w-10 h-10 opacity-40 mx-auto" />
                    <h3 className="text-sm font-bold">No Articles Found</h3>
                    <p className="text-xs opacity-70 max-w-sm mx-auto">
                      No guides found matching your query. Try different keywords or select another topic.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
