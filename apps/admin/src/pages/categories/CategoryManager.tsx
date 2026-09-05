import React, { useEffect, useState } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { Plus, Edit2, Trash2, GripVertical, Save, FolderTree } from 'lucide-react';
import { Category } from '../../core/types';

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState<string>('');
  const [newLevel, setNewLevel] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  async function fetchCategories() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('level').order('display_order');
    setCategories((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  const level1 = categories.filter(c => c.level === 1);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_category_id === parentId);

  async function handleSave() {
    if (!newName.trim()) return;
    setSaving(true);

    if (editingId) {
      await supabase.from('categories').update({ name: newName.trim() }).eq('category_id', editingId);
    } else {
      const maxOrder = categories.filter(c => c.level === newLevel && c.parent_category_id === (newParentId || null))
        .reduce((max, c) => Math.max(max, c.display_order), 0);

      await supabase.from('categories').insert([{
        category_id: newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        parent_category_id: newParentId || null,
        level: newLevel,
        name: newName.trim(),
        display_order: maxOrder + 1,
      }]);
    }

    setShowAddModal(false);
    setEditingId(null);
    setNewName('');
    setNewParentId('');
    setNewLevel(1);
    fetchCategories();
    setSaving(false);
  }

  async function handleDelete(categoryId: string) {
    if (!confirm('Delete this category? Sub-categories will also be deleted.')) return;
    await supabase.from('categories').delete().eq('category_id', categoryId);
    fetchCategories();
  }

  function startEdit(cat: Category) {
    setEditingId(cat.category_id);
    setNewName(cat.name);
    setNewLevel(cat.level as 1 | 2 | 3);
    setNewParentId(cat.parent_category_id ?? '');
    setShowAddModal(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Category Manager</h1>
        <button onClick={() => { setShowAddModal(true); setEditingId(null); setNewName(''); setNewParentId(''); setNewLevel(1); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <FolderTree className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-600">No categories yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {level1.map(cat => (
            <div key={cat.category_id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900">{cat.name}</span>
                  <span className="text-[10px] text-neutral-400">Level 1</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(cat)} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(cat.category_id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="p-3">
                {getChildren(cat.category_id).length === 0 ? (
                  <p className="text-xs text-neutral-400 py-2">No sub-categories</p>
                ) : (
                  <div className="space-y-2">
                    {getChildren(cat.category_id).map(sub => (
                      <div key={sub.category_id} className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-neutral-700">{sub.name}</span>
                          <span className="text-[10px] text-neutral-400">Level 2</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(sub)} className="p-1 text-neutral-400 hover:text-blue-600"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(sub.category_id)} className="p-1 text-neutral-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full z-10 p-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-4">{editingId ? 'Edit Category' : 'Add Category'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Category Name *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Handloom & Textiles" autoFocus />
              </div>
              {!editingId && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Level</label>
                    <select value={newLevel} onChange={e => { setNewLevel(Number(e.target.value) as 1 | 2 | 3); setNewParentId(''); }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                      <option value={1}>Level 1 (Main Category)</option>
                      <option value={2}>Level 2 (Sub-Category)</option>
                    </select>
                  </div>
                  {newLevel === 2 && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Parent Category</label>
                      <select value={newParentId} onChange={e => setNewParentId(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                        <option value="">Select parent</option>
                        {level1.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving || !newName.trim()}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
