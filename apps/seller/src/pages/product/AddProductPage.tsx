import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { useQuota } from '../../core/contexts/QuotaContext';
import { ArrowLeft, Plus, Trash2, Upload, Package } from 'lucide-react';

interface VariantDraft {
  id: string;
  variant_type: string;
  variant_value: string;
  selling_price: string;
  mrp: string;
  stock_quantity: string;
  weight_override: string;
}

export function AddProductPage() {
  const { sellerProfile } = useSellerAuth();
  const { isListingFull } = useQuota();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    supabase.from('categories').select('*').eq('level', 1).order('display_order').then(({ data }) => setCategories(data ?? []));
  }, []);

  function addVariant() {
    setVariants([...variants, {
      id: crypto.randomUUID(), variant_type: '', variant_value: '',
      selling_price: '', mrp: '', stock_quantity: '0', weight_override: '',
    }]);
  }

  function removeVariant(id: string) {
    setVariants(variants.filter(v => v.id !== id));
  }

  function updateVariant(id: string, field: keyof VariantDraft, value: string) {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sellerProfile || !name.trim() || !categoryId || !basePrice) {
      setError('Please fill all required fields'); return;
    }
    setLoading(true);
    setError('');

    const { data: product, error: prodErr } = await supabase.from('products').insert([{
      seller_id: sellerProfile.seller_id,
      category_id: categoryId,
      name: name.trim(),
      description: description.trim() || null,
      material: material.trim() || null,
      weight_kg: parseFloat(weightKg) || 0.5,
      moq: parseInt(moq) || 1,
      base_price: parseFloat(basePrice),
      mrp: parseFloat(mrp) || parseFloat(basePrice),
      stock_quantity: parseInt(stockQuantity) || 0,
      have_variants: haveVariants,
      image_urls: imageUrl ? [imageUrl] : [],
      is_active: true,
    }]).select('product_id').single();

    if (prodErr) { setError(prodErr.message); setLoading(false); return; }

    if (haveVariants && variants.length > 0 && product) {
      const validVariants = variants.filter(v => v.variant_type && v.variant_value && v.selling_price);
      if (validVariants.length > 0) {
        await supabase.from('product_variants').insert(validVariants.map(v => ({
          product_id: product.product_id,
          variant_type: v.variant_type,
          variant_value: v.variant_value,
          selling_price: parseFloat(v.selling_price),
          mrp: parseFloat(v.mrp) || 0,
          stock_quantity: parseInt(v.stock_quantity) || 0,
          weight_override: v.weight_override ? parseFloat(v.weight_override) : null,
        })));
      }
    }

    await supabase.rpc('increment_listing_count', { sid: sellerProfile.seller_id });
    navigate('/products');
  }

  if (isListingFull) return (
    <div className="text-center py-12">
      <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-neutral-600">Listing quota reached. Upgrade to add more products.</p>
      <button onClick={() => navigate('/subscription')} className="mt-3 text-xs text-emerald-600 font-semibold hover:underline">Upgrade Plan</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold text-neutral-900">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900">Basic Information</h3>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Product Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Handwoven Cotton Dupatta" />
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
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Describe your product..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Material</label>
              <input type="text" value={material} onChange={e => setMaterial(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Pure Cotton" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Weight (kg)</label>
              <input type="number" step="0.1" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900">Pricing & Stock</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Selling Price (₹) *</label>
              <input type="number" step="0.01" value={basePrice} onChange={e => setBasePrice(e.target.value)} required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="499" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">MRP (₹)</label>
              <input type="number" step="0.01" value={mrp} onChange={e => setMrp(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="999" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Stock Quantity</label>
              <input type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">MOQ (min order)</label>
              <input type="number" value={moq} onChange={e => setMoq(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900">Product Image</h3>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Image URL</label>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="https://example.com/image.jpg" />
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Variants (SKU Matrix)</h3>
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
                    <button type="button" onClick={() => removeVariant(variant.id)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={variant.variant_type} onChange={e => updateVariant(variant.id, 'variant_type', e.target.value)}
                      className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Type (e.g., Color)" />
                    <input type="text" value={variant.variant_value} onChange={e => updateVariant(variant.id, 'variant_value', e.target.value)}
                      className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Value (e.g., Red)" />
                    <input type="number" step="0.01" value={variant.selling_price} onChange={e => updateVariant(variant.id, 'selling_price', e.target.value)}
                      className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Price (₹)" />
                    <input type="number" value={variant.stock_quantity} onChange={e => updateVariant(variant.id, 'stock_quantity', e.target.value)}
                      className="px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Stock" />
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

        <button type="submit" disabled={loading}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg">
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </form>
    </div>
  );
}
