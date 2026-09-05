import React, { useEffect, useState } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, GripVertical, Image } from 'lucide-react';
import { Banner } from '../../core/types';

export function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [saving, setSaving] = useState(false);

  async function fetchBanners() {
    setLoading(true);
    const { data } = await supabase.from('banners').select('*').order('display_order');
    setBanners((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchBanners(); }, []);

  function openAdd() {
    setEditingBanner(null);
    setTitle(''); setImageUrl(''); setLinkUrl(''); setDisplayOrder(String(banners.length));
    setShowAddModal(true);
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);
    setTitle(banner.title);
    setImageUrl(banner.image_url);
    setLinkUrl(banner.link_url ?? '');
    setDisplayOrder(String(banner.display_order));
    setShowAddModal(true);
  }

  async function handleSave() {
    if (!title.trim() || !imageUrl.trim()) return;
    setSaving(true);

    if (editingBanner) {
      await supabase.from('banners').update({
        title: title.trim(), image_url: imageUrl.trim(),
        link_url: linkUrl.trim() || null, display_order: parseInt(displayOrder) || 0,
      }).eq('banner_id', editingBanner.banner_id);
    } else {
      await supabase.from('banners').insert([{
        title: title.trim(), image_url: imageUrl.trim(),
        link_url: linkUrl.trim() || null, display_order: parseInt(displayOrder) || 0,
        is_active: true,
      }]);
    }

    setShowAddModal(false);
    fetchBanners();
    setSaving(false);
  }

  async function toggleActive(banner: Banner) {
    await supabase.from('banners').update({ is_active: !banner.is_active }).eq('banner_id', banner.banner_id);
    fetchBanners();
  }

  async function handleDelete(bannerId: string) {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('banners').delete().eq('banner_id', bannerId);
    fetchBanners();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Promotional Banners</h1>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12">
          <Image className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-600">No banners yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(banner => (
            <div key={banner.banner_id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="w-32 h-20 bg-neutral-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {banner.image_url ? (
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                  ) : <Image className="w-6 h-6 text-neutral-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">{banner.title}</h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Order: {banner.display_order} · {banner.is_active ? 'Active' : 'Inactive'}</p>
                      {banner.link_url && (
                        <p className="text-[10px] text-blue-600 mt-0.5 truncate">{banner.link_url}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive(banner)}
                        className={`p-1.5 rounded-lg transition-colors ${banner.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-neutral-400 hover:bg-neutral-100'}`}>
                        {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(banner)}
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(banner.banner_id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full z-10 p-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-4">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Summer Collection Sale" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Image URL *</label>
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://example.com/banner.jpg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Link URL (optional)</label>
                <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://yymee.com/sale" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Display Order</label>
                <input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} disabled={saving || !title.trim() || !imageUrl.trim()}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : editingBanner ? 'Save Changes' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
