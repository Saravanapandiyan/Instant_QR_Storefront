import React, { useState, useEffect } from 'react';
import {
  Globe,
  Languages,
  Check,
  Sparkles,
  Loader2,
  X,
  Edit2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  getSupportedLanguages,
  translateMenu,
  updateProductTranslation,
  updateCategoryTranslation,
  addCustomLanguage,
  deleteCustomLanguage,
  type SupportedLanguage,
  type Category,
  type Product,
} from '../api/menu-api';
import { toast } from '../../../components/ui';

interface TranslateMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  categories: Category[];
  products: Product[];
  onTranslationComplete: () => void;
}

export const TranslateMenuModal: React.FC<TranslateMenuModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  categories,
  products,
  onTranslationComplete,
}) => {
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'translate' | 'review'>('translate');

  // Review / Edit state
  const [reviewLang, setReviewLang] = useState<string>('hi');
  const [editingItem, setEditingItem] = useState<{
    id: string;
    type: 'product' | 'category';
    name: string;
    description: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Add Custom Language state
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [selectedLanguageCodeToAdd, setSelectedLanguageCodeToAdd] = useState('');
  const [isAddingLang, setIsAddingLang] = useState(false);

  const AVAILABLE_PRESET_LANGUAGES = [
    // Indian Regional Languages
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
    // International / Global Languages
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
    { code: 'zh-tw', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
    { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
    { code: 'fa', name: 'Persian / Farsi', nativeName: 'فارسی', flag: '🇮🇷' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  ];

  const handleAddLanguage = async () => {
    const selected = AVAILABLE_PRESET_LANGUAGES.find((l) => l.code === selectedLanguageCodeToAdd);
    if (!selected) {
      toast.error('Please select a language from the dropdown.');
      return;
    }
    setIsAddingLang(true);
    try {
      await addCustomLanguage({
        code: selected.code,
        name: selected.name,
        nativeName: selected.nativeName,
        flag: selected.flag,
      });
      toast.success(`${selected.name} (${selected.nativeName}) added successfully!`);
      const updated = await getSupportedLanguages();
      setLanguages(updated);
      setSelectedLangs((prev) => [...prev, selected.code]);
      setIsAddLanguageOpen(false);
      setSelectedLanguageCodeToAdd('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add language');
    } finally {
      setIsAddingLang(false);
    }
  };

  const handleDeleteCustomLanguage = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteCustomLanguage(code);
      toast.success('Custom language removed');
      const updated = await getSupportedLanguages();
      setLanguages(updated);
      setSelectedLangs((prev) => prev.filter((c) => c !== code));
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove language');
    }
  };

  // Helper to count how many dishes have translations for a given language
  const getLanguageStats = (langCode: string) => {
    const translatedCount = products.filter(
      (p) => Boolean((p.translations as any)?.[langCode]?.name),
    ).length;
    return {
      translatedCount,
      total: products.length,
      isComplete: translatedCount === products.length && products.length > 0,
    };
  };

  useEffect(() => {
    if (isOpen) {
      getSupportedLanguages()
        .then((res) => {
          setLanguages(res);
          // Only select languages that are not already fully translated!
          const uncompleted = res
            .filter((l) => {
              if (products.length === 0) return true;
              const translatedCount = products.filter(
                (p) => Boolean((p.translations as any)?.[l.code]?.name),
              ).length;
              return translatedCount < products.length;
            })
            .map((l) => l.code);
          setSelectedLangs(uncompleted);

          // For review tab, default to first language that already has translations
          const firstWithTrans = res.find((l) =>
            products.some((p) => Boolean((p.translations as any)?.[l.code]?.name)),
          );
          setReviewLang(firstWithTrans ? firstWithTrans.code : res[0]?.code || 'hi');
        })
        .catch((err) => {
          console.error('Failed to load supported languages', err);
        });
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const toggleLanguage = (code: string) => {
    if (selectedLangs.includes(code)) {
      setSelectedLangs(selectedLangs.filter((c) => c !== code));
    } else {
      setSelectedLangs([...selectedLangs, code]);
    }
  };

  const handleSelectAll = () => {
    if (selectedLangs.length === languages.length) {
      setSelectedLangs([]);
    } else {
      setSelectedLangs(languages.map((l) => l.code));
    }
  };

  const handleRunTranslation = async () => {
    if (selectedLangs.length === 0) {
      toast.error('Please select at least one target language.');
      return;
    }

    setIsTranslating(true);
    try {
      const res = await translateMenu(restaurantId, selectedLangs);
      toast.success(res.message || 'Menu successfully translated!');
      onTranslationComplete();
      setReviewLang(selectedLangs[0]);
      setActiveTab('review');
    } catch (err: any) {
      toast.error(err.message || 'Failed to translate menu. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    try {
      if (editingItem.type === 'product') {
        await updateProductTranslation(editingItem.id, {
          langCode: reviewLang,
          name: editingItem.name,
          description: editingItem.description,
        });
      } else {
        await updateCategoryTranslation(editingItem.id, {
          langCode: reviewLang,
          name: editingItem.name,
          description: editingItem.description,
        });
      }
      toast.success('Translation updated successfully!');
      setEditingItem(null);
      onTranslationComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save translation override');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface-2/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-text">
                  Multilingual Menu Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  AI FLASH
                </span>
              </div>
              <p className="text-xs text-muted">
                1-click instant menu localization for regional customer storefronts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex border-b border-border bg-surface">
          <button
            type="button"
            onClick={() => setActiveTab('translate')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'translate'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Translation Setup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'review'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Review & Edit Translations</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'translate' ? (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-xs text-text">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-primary">
                    Smart Culinary Translation
                  </p>
                  <p className="text-muted leading-relaxed">
                    Dishes like Biryani, Dosa, Tikka, Shawarma, and Chai are intelligently
                    transliterated into regional scripts, while mouth-watering descriptions are
                    crafted in authentic localized dining language.
                  </p>
                </div>
              </div>

              {/* Languages Selection Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted">
                    Target Languages ({selectedLangs.length} selected)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddLanguageOpen(true)}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Language</span>
                    </button>
                    <span className="text-muted text-xs">•</span>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      {selectedLangs.length === languages.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Inline Add Language Drawer */}
                {isAddLanguageOpen && (
                  <div className="p-4 rounded-2xl bg-surface-2 border border-primary/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-text flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" />
                        <span>Add New Language for Menu Translation</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddLanguageOpen(false)}
                        className="p-1 rounded-md text-muted hover:text-text cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Predefined Language Dropdown Selector (No Manual Typing) */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-text mb-1.5">
                          Choose Language to Add:
                        </label>
                        <select
                          value={selectedLanguageCodeToAdd}
                          onChange={(e) => setSelectedLanguageCodeToAdd(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-text font-medium text-xs sm:text-sm focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
                        >
                          <option value="">-- Select from 30+ World & Regional Languages --</option>
                          {AVAILABLE_PRESET_LANGUAGES.filter(
                            (p) => !languages.some((l) => l.code === p.code),
                          ).map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name} ({lang.nativeName}) — [{lang.code.toUpperCase()}]
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Selected Language Details & Confirmation */}
                      {(() => {
                        const selectedLangObj = AVAILABLE_PRESET_LANGUAGES.find(
                          (l) => l.code === selectedLanguageCodeToAdd,
                        );
                        if (!selectedLangObj) return null;

                        return (
                          <div className="p-3.5 rounded-xl bg-surface border border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{selectedLangObj.flag}</span>
                              <div>
                                <div className="font-bold text-sm text-text">
                                  {selectedLangObj.name}
                                </div>
                                <div className="text-xs text-muted mt-0.5">
                                  Native Script: <strong className="text-text">{selectedLangObj.nativeName}</strong> • ISO Code: <code className="font-mono text-primary font-bold">{selectedLangObj.code}</code>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => setSelectedLanguageCodeToAdd('')}
                                className="px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-muted hover:text-text cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isAddingLang}
                                onClick={handleAddLanguage}
                                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                              >
                                {isAddingLang ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                                <span>Add {selectedLangObj.name}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {languages.map((lang) => {
                    const isSelected = selectedLangs.includes(lang.code);
                    return (
                      <div
                        key={lang.code}
                        onClick={() => toggleLanguage(lang.code)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-xs'
                            : 'border-border bg-surface-2/40 hover:border-border-2'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{lang.flag}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-text">
                                {lang.name}
                              </p>
                              {lang.isCustom && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCustomLanguage(lang.code, e)}
                                  className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                  title="Remove custom language"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {(() => {
                                const stats = getLanguageStats(lang.code);
                                if (stats.translatedCount > 0) {
                                  return (
                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                      {stats.translatedCount}/{stats.total}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <p className="text-[11px] font-medium text-muted font-sans">
                              {lang.nativeName}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary border-primary text-on-primary'
                              : 'border-border bg-surface'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats Preview */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border flex items-center justify-between text-xs text-muted">
                <span>Menu Content:</span>
                <span className="font-bold text-text">
                  {categories.length} Categories • {products.length} Dishes
                </span>
              </div>
            </div>
          ) : (
            /* Review & Edit Translations Tab */
            <div className="space-y-6">
              {/* Language Selector Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-muted uppercase tracking-wider shrink-0 mr-1">
                  Language:
                </span>
                {languages.map((lang) => {
                  const stats = getLanguageStats(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setReviewLang(lang.code);
                        setEditingItem(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                        reviewLang === lang.code
                          ? 'bg-primary text-on-primary border-primary shadow-xs'
                          : 'border-border bg-surface-2 text-muted hover:text-text'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          reviewLang === lang.code
                            ? 'bg-black/20 text-on-primary'
                            : stats.translatedCount > 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-surface-3 text-muted'
                        }`}
                      >
                        {stats.translatedCount}/{stats.total}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Edit Modal / Inline Form if active */}
              {editingItem && (
                <div className="p-4 rounded-2xl border-2 border-primary bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">
                      Editing {editingItem.type === 'product' ? 'Dish' : 'Category'} Translation
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="text-xs text-muted hover:text-text cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted">
                        Translated Name
                      </label>
                      <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, name: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    {editingItem.type === 'product' && (
                      <div>
                        <label className="text-[11px] font-bold text-muted">
                          Translated Description
                        </label>
                        <textarea
                          rows={2}
                          value={editingItem.description}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, description: e.target.value })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-muted hover:text-text cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit}
                      className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingEdit ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Translation</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Menu Items in {languages.find((l) => l.code === reviewLang)?.name || reviewLang}
                </h3>

                <div className="space-y-2.5">
                  {products.map((p) => {
                    const trans = (p.translations as any)?.[reviewLang];
                    const translatedName = trans?.name || p.name;
                    const translatedDesc = trans?.description || p.description;
                    const hasTranslation = Boolean(trans?.name);

                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl border border-border bg-surface flex items-center justify-between gap-3 hover:border-border-2 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text truncate">
                              {translatedName}
                            </span>
                            {hasTranslation ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Translated
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                Untranslated
                              </span>
                            )}
                          </div>
                          {p.name !== translatedName && (
                            <p className="text-[11px] text-muted italic mt-0.5 truncate">
                              Original: {p.name}
                            </p>
                          )}
                          {translatedDesc && (
                            <p className="text-xs text-muted mt-1 line-clamp-1">
                              {translatedDesc}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingItem({
                              id: p.id,
                              type: 'product',
                              name: translatedName,
                              description: translatedDesc || '',
                            })
                          }
                          className="p-2 rounded-xl border border-border bg-surface-2 text-muted hover:text-text transition-colors cursor-pointer shrink-0"
                          title="Edit Translation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-2/40 flex items-center justify-between">
          <p className="text-xs text-muted">
            {activeTab === 'translate'
              ? 'Translating replaces or updates regional texts in the database.'
              : 'Overrides are immediately visible on customer QR scans.'}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-bold text-muted hover:text-text cursor-pointer"
            >
              Close
            </button>

            {activeTab === 'translate' && (
              <button
                type="button"
                onClick={handleRunTranslation}
                disabled={isTranslating || selectedLangs.length === 0}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-2 shadow-sm hover:opacity-90 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Translating Menu with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Translate ({selectedLangs.length} Languages)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
