import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  X,
  Search,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
}

interface CustomerHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branchSlug: string;
  brandName?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Ordering & Checkout': '🛒',
  'Payments & Refunds': '💳',
  'Menu & Dishes': '🍽️',
  'QR & Tables': '📱',
  'General Queries': '💡',
  'Troubleshooting': '🔧',
};

export const CustomerHelpDrawer: React.FC<CustomerHelpDrawerProps> = ({
  isOpen,
  onClose,
  branchSlug,
  brandName = 'InstaDine',
}) => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetch('/api/v1/help?audience=CUSTOMER')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setArticles(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load customer help articles:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Extract unique categories
  const categories = Array.from(
    new Set(articles.map((a) => a.category?.trim() || 'General Queries')),
  );

  const filteredArticles = articles.filter((art) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      art.title.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      (art.category && art.category.toLowerCase().includes(q))
    );
  });

  const goToHelpPage = (category?: string, articleId?: string) => {
    onClose();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (articleId) params.set('article', articleId);
    const queryString = params.toString();
    navigate(`/r/${branchSlug}/help${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div
          className="w-screen max-w-sm sm:max-w-md pointer-events-auto flex flex-col shadow-2xl overflow-hidden border-l animate-in slide-in-from-right duration-200"
          style={{
            backgroundColor: 'var(--sf-surface, #ffffff)',
            borderColor: 'var(--sf-border, #e4e4e7)',
            color: 'var(--sf-text, #18181b)',
          }}
        >
          {/* Drawer Header */}
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--sf-border, #e4e4e7)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                style={{
                  backgroundColor: 'var(--sf-primary, #ea580c)',
                  color: 'var(--sf-primary-contrast, #ffffff)',
                }}
              >
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">Help & FAQs</h3>
                <p className="text-xs opacity-70">{brandName} Support Guide</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                placeholder="Search dining, payment, QR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all shadow-2xs"
                style={{
                  backgroundColor: 'var(--sf-surface-alt, #f4f4f5)',
                  borderColor: 'var(--sf-border, #e4e4e7)',
                  color: 'inherit',
                }}
              />
            </div>

            {/* Link to Full Knowledge Base */}
            <button
              type="button"
              onClick={() => goToHelpPage()}
              className="w-full p-3.5 rounded-xl border flex items-center justify-between gap-3 text-left transition-all hover:shadow-xs group cursor-pointer"
              style={{
                backgroundColor: 'var(--sf-surface-alt, #f4f4f5)',
                borderColor: 'var(--sf-border, #e4e4e7)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--sf-primary, #ea580c)',
                    color: 'var(--sf-primary-contrast, #ffffff)',
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm">Visit Full Help Center</div>
                  <div className="text-[11px] opacity-70">Read complete step-by-step wiki</div>
                </div>
              </div>
              <ArrowRight
                className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform"
                style={{ color: 'var(--sf-primary, #ea580c)' }}
              />
            </button>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2
                  className="w-6 h-6 animate-spin"
                  style={{ color: 'var(--sf-primary, #ea580c)' }}
                />
                <span className="text-xs opacity-70">Loading help topics...</span>
              </div>
            ) : (
              <>
                {/* Help Topics / Categories Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Help Topics
                    </h4>
                    <span className="text-[11px] opacity-60">
                      {categories.length} categories
                    </span>
                  </div>

                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const count = articles.filter(
                        (a) => (a.category?.trim() || 'General Queries') === cat,
                      ).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => goToHelpPage(cat)}
                          className="w-full p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all hover:scale-[1.01] cursor-pointer"
                          style={{
                            backgroundColor: 'var(--sf-surface-alt, #f4f4f5)',
                            borderColor: 'var(--sf-border, #e4e4e7)',
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">
                              {CATEGORY_ICONS[cat] || '📋'}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold">{cat}</span>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: 'rgba(0,0,0,0.06)',
                              color: 'inherit',
                            }}
                          >
                            {count} {count === 1 ? 'guide' : 'guides'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FAQ Quick Questions Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">
                    Frequently Asked Questions
                  </h4>

                  <div className="space-y-1.5">
                    {filteredArticles.slice(0, 5).map((art) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => goToHelpPage(art.category, art.id)}
                        className="w-full p-3 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors hover:opacity-80 cursor-pointer"
                        style={{
                          backgroundColor: 'var(--sf-surface, #ffffff)',
                          borderColor: 'var(--sf-border, #e4e4e7)',
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="font-bold text-sm shrink-0"
                            style={{ color: 'var(--sf-primary, #ea580c)' }}
                          >
                            ›
                          </span>
                          <span className="text-xs font-medium truncate">
                            {art.title}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 opacity-50 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Note */}
          <div
            className="p-4 border-t text-center text-[11px] opacity-70"
            style={{
              borderColor: 'var(--sf-border, #e4e4e7)',
              backgroundColor: 'var(--sf-surface-alt, #f4f4f5)',
            }}
          >
            Need immediate table assistance? Please inform your waiter or cashier desk.
          </div>
        </div>
      </div>
    </div>
  );
};
