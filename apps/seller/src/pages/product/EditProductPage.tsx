import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { ArrowLeft, Plus, Trash2, Save, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';

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
  const [moq, setMoq] = useState('1');
  const [basePrice, setBasePrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [haveVariants, setHaveVariants] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState<'active' | 'inactive' | 'revoked'>('active');
  const [qcStatus, setQcStatus] = useState<'submitted' | 'verified' | 'rejected'>('submitted');

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
        setMoq(String(data.moq ?? 1));
        setBasePrice(String(data.base_price));
        setMrp(String(data.mrp ?? ''));
        setStockQuantity(String(data.stock_quantity ?? 0));
        setHaveVariants(data.have_variants);
        setImageUrl(data.image_urls?.[0] ?? '');
        setIsActive(data.is_active);
        setStatus(data.status || (data.is_active ? 'active' : 'inactive'));
        setQcStatus(data.qc_status || 'submitted');
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

    const updatePayload: any = {
      name: name.trim(), category_id: categoryId, description: description.trim() || null,
      material: material.trim() || null, weight_kg: 0.5,
      moq: parseInt(moq) || 1, base_price: parseFloat(basePrice),
      mrp: parseFloat(mrp) || parseFloat(basePrice),
      stock_quantity: parseInt(stockQuantity) || 0, have_variants: haveVariants,
      image_urls: imageUrl ? [imageUrl] : [],
      is_active: status === 'active',
      status: status
    };

    let { error: prodErr } = await supabase.from('products').update(updatePayload).eq('product_id', productId);
    if (prodErr && prodErr.message?.includes('status')) {
      delete updatePayload.status;
      const retry = await supabase.from('products').update(updatePayload).eq('product_id', productId);
      prodErr = retry.error;
    }

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate('/products')}
          className="p-2 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Edit Product Listing</h1>
          <p className="text-xs text-neutral-500">Update product specifications, inventory status, and variants</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status & QC Verification Box */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <span className="text-xs font-bold text-neutral-800 block">Product Status</span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Manage inventory visibility and publication status.
              </p>
            </div>

            {status === 'revoked' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-black">
                <XCircle className="w-4 h-4" />
                <span>Revoked by Admin</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setStatus('active'); setIsActive(true); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    status === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => { setStatus('inactive'); setIsActive(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    status === 'inactive'
                      ? 'bg-neutral-700 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Inactive
                </button>
              </div>
            )}
          </div>

          {/* QC Status banner */}
          <div className={`flex items-start gap-3 rounded-xl p-3 text-xs border ${
            qcStatus === 'verified'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : qcStatus === 'rejected'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {qcStatus === 'verified' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : qcStatus === 'rejected' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Quality Check (QC) Status:</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                  qcStatus === 'verified'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : qcStatus === 'rejected'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {qcStatus}
                </span>
              </div>
              <p className="text-[11px] mt-1 opacity-90">
                {qcStatus === 'verified' && 'This product has been verified by quality administrators and is approved for sale.'}
                {qcStatus === 'rejected' && 'Quality administrators rejected this listing. Please review the details, update accordingly, and contact admin.'}
                {qcStatus === 'submitted' && 'This product is submitted and waiting for administrator quality verification.'}
              </p>
            </div>
          </div>
        </div>

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
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Material</label>
            <input type="text" value={material} onChange={e => setMaterial(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
