import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { getCached, setCached, invalidateCache } from '../../core/cache';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, Image, X, Upload } from 'lucide-react';
import { Banner } from '../../core/types';

const CACHE_KEY = 'yyme_banners';
const CACHE_TTL_MS = 10 * 60 * 1000;

async function fetchFromDB(): Promise<Banner[]> {
  const { data } = await supabase.from('banners').select('*').order('display_order');
  return (data as any) ?? [];
}

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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchBanners(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = getCached<Banner[]>(CACHE_KEY, CACHE_TTL_MS);
      if (cached) {
        setBanners(cached);
        setLoading(false);
        fetchFromDB().then(fresh => {
          setCached(CACHE_KEY, fresh);
          setBanners(fresh);
        });
        return;
      }
    }

    setLoading(true);
    const data = await fetchFromDB();
    setCached(CACHE_KEY, data);
    setBanners(data);
    setLoading(false);
  }

  useEffect(() => { fetchBanners(); }, []);

  function openAdd() {
    setEditingBanner(null);
    setTitle(''); setImageUrl(''); setLinkUrl(''); setDisplayOrder(String(banners.length));
    setUploadFile(null); setUploadPreview(null);
    setShowAddModal(true);
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);
    setTitle(banner.title);
    setImageUrl(banner.image_url);
    setLinkUrl(banner.link_url ?? '');
    setDisplayOrder(String(banner.display_order));
    setUploadFile(null); setUploadPreview(null);
    setShowAddModal(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadImage(): Promise<string | null> {
    if (!uploadFile) return imageUrl.trim() || null;
    const ext = uploadFile.name.split('.').pop() || 'jpg';
    const filePath = `banners/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('payment-receipts').upload(filePath, uploadFile);
    if (error || !data) return null;
    const { data: urlData } = supabase.storage.from('payment-receipts').getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const finalImageUrl = await uploadImage();
    if (!finalImageUrl) {
      setSaving(false);
      return;
    }

    if (editingBanner) {
      await supabase.from('banners').update({
        title: title.trim(), image_url: finalImageUrl,
        link_url: linkUrl.trim() || null, display_order: parseInt(displayOrder) || 0,
      }).eq('banner_id', editingBanner.banner_id);
    } else {
      await supabase.from('banners').insert([{
        title: title.trim(), image_url: finalImageUrl,
        link_url: linkUrl.trim() || null, display_order: parseInt(displayOrder) || 0,
        is_active: true,
      }]);
    }

    setShowAddModal(false);
    invalidateCache(CACHE_KEY);
    fetchBanners(true);
    setSaving(false);
  }

  async function toggleActive(banner: Banner) {
    await supabase.from('banners').update({ is_active: !banner.is_active }).eq('banner_id', banner.banner_id);
    invalidateCache(CACHE_KEY);
    fetchBanners(true);
  }

  async function handleDelete(bannerId: string) {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('banners').delete().eq('banner_id', bannerId);
    invalidateCache(CACHE_KEY);
    fetchBanners(true);
  }

  const hasChanges = editingBanner
    ? title.trim() !== editingBanner.title || linkUrl.trim() !== (editingBanner.link_url ?? '') || String(displayOrder) !== String(editingBanner.display_order) || uploadFile !== null
    : title.trim() !== '' || uploadFile !== null;

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
          <p className="text-xs text-neutral-400 mt-1">Click "Add Banner" to create your first promotional banner</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Banner</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map(banner => (
                <tr key={banner.banner_id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => banner.image_url && setViewImage(banner.image_url)}
                        className="w-24 h-14 bg-neutral-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-emerald-400 transition-all cursor-pointer">
                        {banner.image_url ? (
                          <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                        ) : <Image className="w-5 h-5 text-neutral-300" />}
                      </button>
                      <p className="text-sm font-semibold text-neutral-900">{banner.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{banner.display_order}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(banner)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                        banner.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-200 hover:bg-neutral-200'
                      }`}>
                      {banner.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(banner)}
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(banner.banner_id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => !saving && setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full z-10 p-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-4">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Summer Collection Sale" autoFocus />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Banner Image *</label>
                {uploadPreview ? (
                  <div className="relative border border-neutral-200 rounded-lg overflow-hidden">
                    <img src={uploadPreview} alt="Banner preview" className="w-full h-40 object-cover" />
                    <button type="button" onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                      className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow hover:bg-red-50 text-neutral-500 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                    <label className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                      <Upload className="w-8 h-8 text-neutral-400" />
                      <span className="text-xs font-medium text-neutral-500">Click to upload banner image</span>
                      <span className="text-[10px] text-neutral-400">JPG, PNG up to 5MB</span>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Display Order</label>
                <input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} disabled={saving}
                className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !title.trim() || (!uploadFile && !editingBanner)}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : editingBanner ? 'Save Changes' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Image Lightbox */}
      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm" />
          <div className="relative z-10 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <img src={viewImage} alt="Banner full view" className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
