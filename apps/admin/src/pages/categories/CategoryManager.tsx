import React, { useState, useEffect } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { getCached, setCached, invalidateCache } from '../../core/cache';
import { Category } from '../../core/types';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit3,
  Trash2,
  Check,
  RefreshCw,
  AlertCircle,
  Search,
} from 'lucide-react';

interface CategoryFormData {
  category_id: string;
  name: string;
  parent_category_id: string | null;
  level: number;
}

const CACHE_KEY = 'yyme_categories';
const CACHE_TTL_MS = 10 * 60 * 1000;

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Form state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    category_id: '',
    name: '',
    parent_category_id: null,
    level: 1,
  });

  // Expanded categories map (catId -> boolean)
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const applyExpandedDefaults = (cats: Category[]) => {
    setExpandedCats((prev) => {
      const updated: Record<string, boolean> = { ...prev };
      cats.forEach((c) => {
        if (updated[c.category_id] === undefined) {
          updated[c.category_id] = false;
        }
      });
      return updated;
    });
  };

  const hasAnyExpanded = Object.values(expandedCats).some(Boolean);

  const toggleExpandAll = () => {
    const nextState = !hasAnyExpanded;
    setExpandedCats(() => {
      const updated: Record<string, boolean> = {};
      categories.forEach((c) => {
        updated[c.category_id] = nextState;
      });
      return updated;
    });
  };

  const fetchCategories = async (forceRefresh = false) => {
    // 1. Instant Cache Hit Check
    if (!forceRefresh) {
      const cached = getCached<Category[]>(CACHE_KEY, CACHE_TTL_MS);
      if (cached && cached.length > 0) {
        setCategories(cached);
        setIsFromCache(true);
        setLoading(false);
        applyExpandedDefaults(cached);
        // Stale-While-Revalidate: fetch in background silently
        revalidateInBackground();
        return;
      }
    }

    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('display_order', { ascending: true });

      if (fetchErr) throw fetchErr;

      const fetchedCats = (data as Category[]) || [];
      setCategories(fetchedCats);
      setCached(CACHE_KEY, fetchedCats);
      setIsFromCache(false);
      applyExpandedDefaults(fetchedCats);

      if (forceRefresh) {
        showToast('Categories cache refreshed from database.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Background silent revalidation
  const revalidateInBackground = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('display_order', { ascending: true });

      if (!fetchErr && data) {
        const fetchedCats = data as Category[];
        setCategories(fetchedCats);
        setCached(CACHE_KEY, fetchedCats);
        applyExpandedDefaults(fetchedCats);
      }
    } catch (e) {
      // background silent fail
    }
  };

  useEffect(() => {
    fetchCategories(false);
  }, []);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Add Main Category (Level 1)
  const handleAddMain = () => {
    setIsEditing(false);
    setFormData({
      category_id: '',
      name: '',
      parent_category_id: null,
      level: 1,
    });
    setShowModal(true);
  };

  // Add Subcategory (Level 2 or 3)
  const handleAddSub = (parentCat: Category) => {
    const nextLevel = parentCat.level + 1;
    if (nextLevel > 3) {
      alert('Maximum category depth is 3 levels.');
      return;
    }
    setIsEditing(false);
    setFormData({
      category_id: '',
      name: '',
      parent_category_id: parentCat.category_id,
      level: nextLevel,
    });
    setShowModal(true);
  };

  // Edit Category Name
  const handleEdit = (category: Category) => {
    setIsEditing(true);
    setFormData({
      category_id: category.category_id,
      name: category.name,
      parent_category_id: category.parent_category_id,
      level: category.level,
    });
    setShowModal(true);
  };

  // Submit Category Form
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);

    const generatedId = isEditing
      ? formData.category_id
      : `CAT-${formData.name.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            parent_category_id: formData.parent_category_id,
            level: formData.level,
          })
          .eq('category_id', formData.category_id);

        if (updateError) throw updateError;
      } else {
        const siblings = categories.filter(
          (c) => c.level === formData.level && c.parent_category_id === formData.parent_category_id
        );
        const maxOrder = siblings.reduce((max, c) => Math.max(max, c.display_order || 0), 0);

        const { error: insertError } = await supabase.from('categories').insert([
          {
            category_id: generatedId,
            name: formData.name.trim(),
            parent_category_id: formData.parent_category_id,
            level: formData.level,
            display_order: maxOrder + 1,
          },
        ]);

        if (insertError) throw insertError;
      }

      if (formData.parent_category_id) {
        setExpandedCats((prev) => ({
          ...prev,
          [formData.parent_category_id!]: true,
        }));
      }

      setShowModal(false);
      showToast(isEditing ? 'Category updated successfully!' : 'Category created successfully!');
      invalidateCache(CACHE_KEY);
      await fetchCategories(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  // Delete Category
  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Deleting this category will remove its sub-categories. Proceed?')) return;

    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('category_id', categoryId);

      if (deleteError) {
        if (deleteError.message?.includes('foreign key') || deleteError.message?.includes('violates foreign key')) {
          throw new Error('Cannot delete this category because products are assigned to it.');
        }
        throw deleteError;
      }

      showToast('Category deleted successfully.');
      invalidateCache(CACHE_KEY);
      await fetchCategories(true);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const level1Categories = categories.filter((c) => c.level === 1);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_category_id === parentId);

  // Filter if user types in search bar
  const isSearching = searchQuery.trim().length > 0;
  const filteredLevel1 = isSearching
    ? level1Categories.filter((l1) => {
        const matchL1 = l1.name.toLowerCase().includes(searchQuery.toLowerCase()) || l1.category_id.toLowerCase().includes(searchQuery.toLowerCase());
        const l2Children = getChildren(l1.category_id);
        const matchL2 = l2Children.some((l2) => {
          const matchThisL2 = l2.name.toLowerCase().includes(searchQuery.toLowerCase()) || l2.category_id.toLowerCase().includes(searchQuery.toLowerCase());
          const l3Children = getChildren(l2.category_id);
          const matchL3 = l3Children.some((l3) => l3.name.toLowerCase().includes(searchQuery.toLowerCase()) || l3.category_id.toLowerCase().includes(searchQuery.toLowerCase()));
          return matchThisL2 || matchL3;
        });
        return matchL1 || matchL2;
      })
    : level1Categories;

  return (
    <div className="min-h-screen text-neutral-800 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-3">
            Category Hierarchy
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              3 Levels
            </span>
            {isFromCache && (
              <span className="bg-neutral-100 text-neutral-500 text-[10px] font-medium px-2 py-0.5 rounded-full border border-neutral-200">
                Cached
              </span>
            )}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Organize products across Main Categories, Sub-categories, and Leaf Product Types
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#f3722c]"
            />
          </div>
          <button
            onClick={toggleExpandAll}
            className="px-3 py-2 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-xl text-neutral-600 text-xs font-bold transition-colors"
            title={hasAnyExpanded ? 'Collapse all categories' : 'Expand all categories'}
          >
            {hasAnyExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          <button
            onClick={() => fetchCategories(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-xl text-neutral-600 transition-colors disabled:opacity-50"
            title="Refresh from database (busts cache)"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#f3722c]' : ''}`} />
          </button>
          <button
            onClick={handleAddMain}
            className="bg-[#f3722c] hover:bg-[#d95c1a] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Main Category
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* CATEGORY HIERARCHY TREE */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-neutral-500 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f3722c] mx-auto mb-3" />
            Loading category tree...
          </div>
        ) : filteredLevel1.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-neutral-500 shadow-sm">
            {isSearching
              ? `No categories found matching "${searchQuery}".`
              : 'No categories added yet. Click "+ Add Main Category" to begin.'}
          </div>
        ) : (
          filteredLevel1.map((l1) => {
            const level2Children = getChildren(l1.category_id);
            const isL1Expanded = isSearching ? true : !!expandedCats[l1.category_id];

            return (
              <div key={l1.category_id} className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
                {/* LEVEL 1 ITEM ROW */}
                <div
                  onClick={() => toggleExpand(l1.category_id)}
                  className="flex items-center justify-between p-4 border-b border-neutral-200 hover:bg-neutral-50/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 border border-orange-100 text-[#f3722c] font-black text-lg rounded-xl flex items-center justify-center shrink-0">
                      {l1.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                        {l1.name}
                        <span className="text-[10px] text-neutral-400 font-mono">({l1.category_id})</span>
                      </h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {level2Children.length} sub-categories
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleAddSub(l1)}
                      className="text-neutral-600 hover:text-[#f3722c] font-bold text-xs px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      + Sub
                    </button>
                    <button
                      onClick={() => handleEdit(l1)}
                      className="text-neutral-600 hover:text-neutral-900 font-bold text-xs px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(l1.category_id)}
                      className="text-neutral-400 hover:text-red-600 font-bold text-xs px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => toggleExpand(l1.category_id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100 text-neutral-400 transition-colors"
                    >
                      {isL1Expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* LEVEL 2 CHILDREN */}
                {isL1Expanded && (
                  <div className="bg-white border-b border-neutral-200 divide-y divide-neutral-200/30">
                    {level2Children.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-3 px-6 italic">No sub-categories defined.</p>
                    ) : (
                      level2Children.map((l2) => {
                        const level3Children = getChildren(l2.category_id);
                        const isL2Expanded = isSearching ? true : !!expandedCats[l2.category_id];

                        return (
                          <div key={l2.category_id} className="bg-white">
                            <div
                              onClick={() => toggleExpand(l2.category_id)}
                              className="flex items-center justify-between py-3 px-6 hover:bg-neutral-50/50 transition-colors cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 shrink-0">
                                  L2
                                </span>
                                <div>
                                  <h4 className="font-bold text-neutral-800 text-xs flex items-center gap-2">
                                    {l2.name}
                                    <span className="text-[10px] text-neutral-400 font-mono">({l2.category_id})</span>
                                  </h4>
                                  <p className="text-[10px] text-neutral-400">{level3Children.length} item types</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleAddSub(l2)}
                                  className="text-neutral-500 hover:text-[#f3722c] font-bold text-xs px-2 py-1 transition-colors"
                                >
                                  + Sub
                                </button>
                                <button
                                  onClick={() => handleEdit(l2)}
                                  className="text-neutral-500 hover:text-neutral-900 font-bold text-xs px-2 py-1 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(l2.category_id)}
                                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-all"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => toggleExpand(l2.category_id)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100 text-neutral-400 transition-colors"
                                >
                                  {isL2Expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* LEVEL 3 ITEM TYPES */}
                            {isL2Expanded && (
                              <div className="bg-neutral-50/40 pl-16 pr-6 divide-y divide-neutral-100 border-t border-b border-neutral-200/20">
                                {level3Children.length === 0 ? (
                                  <p className="text-xs text-neutral-400 py-2 italic">No product types defined.</p>
                                ) : (
                                  level3Children.map((l3) => (
                                    <div
                                      key={l3.category_id}
                                      className="flex items-center justify-between py-2 px-3 text-xs hover:bg-neutral-50 rounded-lg transition-colors border border-transparent"
                                    >
                                      <span className="text-neutral-700 font-medium flex items-center gap-2">
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 shrink-0">
                                          L3
                                        </span>
                                        {l3.name}
                                        <span className="text-[10px] text-neutral-400 font-mono">({l3.category_id})</span>
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(l3);
                                          }}
                                          className="text-neutral-500 hover:text-neutral-900 font-bold text-xs px-2 py-1 transition-colors"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(l3.category_id);
                                          }}
                                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-all"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD / EDIT CATEGORY */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              {isEditing
                ? 'Edit Category Name'
                : formData.parent_category_id
                ? `Add Sub-category (Level ${formData.level})`
                : 'Add Main Category'}
            </h2>

            <form onSubmit={handleSubmitCategory} className="space-y-4">
              {formData.parent_category_id && (
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                  <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Parent Category
                  </span>
                  <span className="text-sm font-semibold text-neutral-800">
                    {categories.find((c) => c.category_id === formData.parent_category_id)?.name ||
                      formData.parent_category_id}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Women's Clothing"
                  required
                  autoFocus
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#f3722c]"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="flex-1 bg-[#45b058] hover:bg-[#389448] disabled:opacity-50 text-white font-bold py-2.5 text-sm rounded-xl transition-all"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save Name' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 text-sm rounded-xl transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
