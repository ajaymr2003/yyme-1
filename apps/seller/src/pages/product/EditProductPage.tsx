import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

interface VariantDraft {
  variant_id?: string;
  id: string;
  variant_type: string;
  variant_value: string;
  selling_price: string;
  mrp: string;
  stock_quantity: string;
}

export function EditProductPage() {
  const { productId } = useParams();
  const { sellerProfile } = useSellerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('');
  const [weightKg, setWeightKg] = useState('0.5');
  const [moq, setMoq] = useState('1');
  const [basePrice, setBasePrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [haveVariants, setHaveVariants] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    supabase.from('categories').select('*').eq('level', 1).order('display_order').then(({ data }) => setCategories(data ?? []));

    if (!productId) return;
    supabase.from('products').select('*, product_variants(*)').eq('product_id', productId).single()
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        setName(data.name);
        setCategoryId(data.category_id);
        setDescription(data.description ?? '');
        setMaterial(data.material ?? '');
        setWeightKg(String(data.weight_kg ?? 0.5));
        setMoq(String(data.moq ?? 1));
        setBasePrice(String(data.base_price));
        setMrp(String(data.mrp ?? ''));
        setStockQuantity(String(data.stock_quantity ?? 0));
        setHaveVariants(data.have_variants);
        setImageUrl(data.image_urls?.[0] ?? '');
        setIsActive(data.is_active);
        setVariants((data.product_variants ?? []).map((v: any) => ({
          variant_id: v.variant_id, id: v.variant_id,
          variant_type: v.variant_type, variant_value: v.variant_value,
          selling_price: String(v.selling_price), mrp: String(v.mrp ?? ''),
          stock_quantity: String(v.stock_quantity ?? 0),
        })));
        setLoading(false);
      });
  }, [productId]);

  function addVariant() {
    setVariants([...variants, {
      id: crypto.randomUUID(), variant_type: '', variant_value: '',
      selling_price: '', mrp: '', stock_quantity: '0',
    }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setSaving(true);
    setError('');

    const { error: prodErr } = await supabase.from('products').update({
      name: name.trim(), category_id: categoryId, description: description.trim() || null,
      material: material.trim() || null, weight_kg: parseFloat(weightKg) || 0.5,
      moq: parseInt(moq) || 1, base_price: parseFloat(basePrice),
      mrp: parseFloat(mrp) || parseFloat(basePrice),
      stock_quantity: parseInt(stockQuantity) || 0, have_variants: haveVariants,
      image_urls: imageUrl ? [imageUrl] : [], is_active: isActive,
    }).eq('product_id', productId);

    if (prodErr) { setError(prodErr.message); setSaving(false); return; }

    // Sync variants
    const existingIds = variants.filter(v => v.variant_id).map(v => v.variant_id);
    // Delete removed variants
    await supabase.from('product_variants').delete().eq('product_id', productId).not('variant_id', 'in', `(${existingIds.join(',')})`);

    // Upsert current variants
    for (const v of variants) {
      if (v.variant_type && v.variant_value && v.selling_price) {
        const payload: any = {
          product_id: productId, variant_type: v.variant_type, variant_value: v.variant_value,
          selling_price: parseFloat(v.selling_price), mrp: parseFloat(v.mrp) || 0,
          stock_quantity: parseInt(v.stock_quantity) || 0,
        };
        if (v.variant_id) {
          await supabase.from('product_variants').update(payload).eq('variant_id', v.variant_id);
        } else {
          await supabase.from('product_variants').insert([payload]);
        }
      }
    }

    navigate('/products');
  }

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold text-neutral-900">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900">Basic Information</h3>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Product Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Category *</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">Select category</option>
              {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Material</label>
              <input type="text" value={material} onChange={e => setMaterial(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Weight (kg)</label>
              <input type="number" step="0.1" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900">Pricing & Stock</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Price (₹) *</label>
              <input type="number" step="0.01" value={basePrice} onChange={e => setBasePrice(e.target.value)} required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">MRP (₹)</label>
              <input type="number" step="0.01" value={mrp} onChange={e => setMrp(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Stock</label>
              <input type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">MOQ</label>
              <input type="number" value={moq} onChange={e => setMoq(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500" />
            <span className="text-xs font-medium text-neutral-600">Product is active (visible to buyers)</span>
          </label>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900">Product Image</h3>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="https://example.com/image.jpg" />
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Variants</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={haveVariants} onChange={e => { setHaveVariants(e.target.checked); if (!e.target.checked) setVariants([]); }}
                className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500" />
              <span className="text-xs font-medium text-neutral-600">Enable variants</span>
            </label>
          </div>
          {haveVariants && (
            <>
              {variants.map((variant, idx) => (
                <div key={variant.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500">Variant {idx + 1}</span>
                    <button type="button" onClick={() => setVariants(variants.filter(v => v.id !== variant.id))}
                      className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={variant.variant_type} onChange={e => setVariants(variants.map(v => v.id === variant.id ? { ...v, variant_type: e.target.value } : v))}
                      className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Type" />
                    <input type="text" value={variant.variant_value} onChange={e => setVariants(variants.map(v => v.id === variant.id ? { ...v, variant_value: e.target.value } : v))}
                      className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Value" />
                    <input type="number" step="0.01" value={variant.selling_price} onChange={e => setVariants(variants.map(v => v.id === variant.id ? { ...v, selling_price: e.target.value } : v))}
                      className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Price (₹)" />
                    <input type="number" value={variant.stock_quantity} onChange={e => setVariants(variants.map(v => v.id === variant.id ? { ...v, stock_quantity: e.target.value } : v))}
                      className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Stock" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addVariant}
                className="w-full py-2 border-2 border-dashed border-neutral-300 rounded-lg text-xs font-medium text-neutral-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Variant
              </button>
            </>
          )}
        </div>

        {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
