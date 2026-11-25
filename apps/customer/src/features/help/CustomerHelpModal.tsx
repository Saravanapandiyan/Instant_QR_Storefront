import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
}

interface CustomerHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName?: string;
}

export const CustomerHelpModal: React.FC<CustomerHelpModalProps> = ({
  isOpen,
  onClose,
  brandName = 'InstaDine',
}) => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetch('/api/v1/help?audience=CUSTOMER')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setArticles(data);
          if (data.length > 0 && !expandedId) {
            setExpandedId(data[0].id);
          }
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
  const categories = Array.from(new Set(articles.map((a) => a.category || 'General')));

  // Filter articles
  const filteredArticles = articles.filter((art) => {
    const matchesCat = selectedCategory === 'ALL' || (art.category || 'General') === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[88vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden border"
        style={{
          backgroundColor: 'var(--sf-surface)',
          borderColor: 'var(--sf-border)',
          color: 'var(--sf-text)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--sf-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--sf-primary)',
                color: 'var(--sf-primary-contrast)',
              }}
            >
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Help & FAQs</h2>
              <p className="text-xs opacity-70">Guides and quick answers for your order at {brandName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Help"
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Categories */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--sf-border)' }}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              placeholder="Search help questions, payment, order status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--sf-bg)',
                borderColor: 'var(--sf-border)',
                color: 'var(--sf-text)',
              }}
            />
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === 'ALL'
                    ? 'shadow-sm font-bold'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={
                  selectedCategory === 'ALL'
                    ? {
                        backgroundColor: 'var(--sf-primary)',
                        color: 'var(--sf-primary-contrast)',
                      }
                    : {
                        backgroundColor: 'var(--sf-bg)',
                      }
                }
              >
                All FAQs
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                    selectedCategory === cat
                      ? 'shadow-sm font-bold'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={
                    selectedCategory === cat
                      ? {
                          backgroundColor: 'var(--sf-primary)',
                          color: 'var(--sf-primary-contrast)',
                        }
                      : {
                          backgroundColor: 'var(--sf-bg)',
                        }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {loading ? (
            <div className="py-12 text-center text-xs opacity-60 animate-pulse">
              Loading help articles...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <BookOpen className="w-8 h-8 opacity-40 mx-auto" />
              <p className="text-xs font-semibold">No questions found</p>
              <p className="text-[11px] opacity-60">
                Please ask your server or counter staff for assistance.
              </p>
            </div>
          ) : (
            filteredArticles.map((art) => {
              const isExpanded = expandedId === art.id;
              return (
                <div
                  key={art.id}
                  className="rounded-xl border transition-all overflow-hidden"
                  style={{
                    backgroundColor: 'var(--sf-bg)',
                    borderColor: isExpanded ? 'var(--sf-primary)' : 'var(--sf-border)',
                  }}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : art.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3"
                  >
                    <span className="text-xs sm:text-sm font-bold">{art.title}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 shrink-0 opacity-60" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
                    )}
                  </button>

                  {isExpanded && (
                    <div
                      className="px-4 pb-4 pt-1 text-xs leading-relaxed border-t border-dashed"
                      style={{ borderColor: 'var(--sf-border)' }}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: art.content }}
                        className="space-y-2 prose prose-sm dark:prose-invert max-w-none text-[12px]"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="p-3 border-t text-center text-[11px] opacity-70 flex items-center justify-center gap-1.5"
          style={{ borderColor: 'var(--sf-border)', backgroundColor: 'var(--sf-bg)' }}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
          <span>Need immediate assistance? Please let your server or counter staff know!</span>
        </div>
      </div>
    </div>
  );
};
