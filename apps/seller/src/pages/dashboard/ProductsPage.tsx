import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { useQuota } from '../../core/contexts/QuotaContext';
import { formatINR } from '@ymenet/utils';
import { getCached, setCache, invalidateCachePrefix, CACHE_TTL } from '../../core/cache';
import { Plus, Search, Package, Edit2, Eye, EyeOff, Trash2, CheckCircle2, Clock, Ban } from 'lucide-react';

interface ProductRow {
  product_id: string;
  name: string;
  base_price: number;
  mrp: number;
  stock_quantity: boolean;
  moq?: number;
  is_active: boolean;
  qc_status?: 'submitted' | 'verified' | 'rejected';
  status?: 'active' | 'inactive' | 'revoked';
  publish_status?: string;
  have_variants: boolean;
  image_urls: string[];
  category: { name: string } | null;
  product_variants: {
    variant_id: string;
    variant_type: string;
    variant_value: string;
    selling_price: number;
    stock_quantity: boolean;
    sku?: string;
  }[];
}

type TabType = 'active' | 'pending' | 'blocked';

export function ProductsPage() {
  const { sellerProfile } = useSellerAuth();
  const { listingsRemaining, isListingFull } = useQuota();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const productsCacheKey = sellerProfile ? `seller:products:${sellerProfile.seller_id}` : '';

  async function fetchProducts() {
    if (!sellerProfile) return;
    const cached = getCached<ProductRow[]>(productsCacheKey, CACHE_TTL.MINUTE_1);
    if (cached) { setProducts(cached); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(name), product_variants(variant_id, variant_type, variant_value, selling_price, stock_quantity, sku)')
      .eq('seller_id', sellerProfile.seller_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      const rows = (data as any) ?? [];
      setProducts(rows);
      setCache(productsCacheKey, rows);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, [sellerProfile]);

  async function toggleActive(product: ProductRow) {
    if (product.status === 'revoked') {
      alert('This product listing has been revoked by platform administrators and cannot be activated.');
      return;
    }
    const isQcVerified = product.qc_status === 'verified' || (!product.qc_status && (product.publish_status === 'published' || product.publish_status === 'approved'));
    if (!isQcVerified) {
      alert('This product cannot be activated until it is QC Verified by administrators.');
      return;
    }
    const currentActive = product.status ? product.status === 'active' : product.is_active;
    const newStatus = currentActive ? 'inactive' : 'active';
    const newIsActive = !currentActive;

    const updatePayload: any = { is_active: newIsActive, status: newStatus };
    let { error } = await supabase.from('products').update(updatePayload).eq('product_id', product.product_id);
    if (error && error.message?.includes('status')) {
      await supabase.from('products').update({ is_active: newIsActive }).eq('product_id', product.product_id);
    }
    setProducts(products.map(p => p.product_id === product.product_id ? { ...p, is_active: newIsActive, status: newStatus } : p));
    invalidateCachePrefix(productsCacheKey);
  }

  async function handleDelete(productId: string) {
    if (!window.confirm('Are you sure you want to delete this product listing? This cannot be undone.')) return;
    const { error } = await supabase.from('products').delete().eq('product_id', productId);
    if (!error) {
      setProducts(products.filter(p => p.product_id !== productId));
      invalidateCachePrefix(productsCacheKey);
    } else {
      alert(`Failed to delete: ${error.message}`);
    }
  }

  const isProductActive = (p: ProductRow) => {
    // ONLY show as active when BOTH qc verified and common status active
    const isQcVerified = p.qc_status ? p.qc_status === 'verified' : (p.publish_status === 'published' || p.publish_status === 'approved');
    const isCommonActive = p.status ? p.status === 'active' : p.is_active;
    return Boolean(isQcVerified && isCommonActive);
  };

  const isProductPending = (p: ProductRow) => {
    if (p.qc_status) {
      return p.qc_status === 'submitted';
    }
    return p.publish_status === 'pending_qc';
  };

  const isProductBlocked = (p: ProductRow) => {
    if (p.status === 'revoked' || p.qc_status === 'rejected') {
      return true;
    }
    if (p.status === 'inactive') {
      return true;
    }
    if (p.publish_status === 'rejected' || p.publish_status === 'archived') {
      return true;
    }
    return !p.is_active && !isProductPending(p);
  };

  // Live counts
  const activeCount = products.filter(isProductActive).length;
  const pendingCount = products.filter(isProductPending).length;
  const blockedCount = products.filter(isProductBlocked).length;

  const filteredProducts = products.filter(p => {
    // 1. Tab filter
    if (activeTab === 'active' && !isProductActive(p)) return false;
    if (activeTab === 'pending' && !isProductPending(p)) return false;
    if (activeTab === 'blocked' && !isProductBlocked(p)) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = (p.name || '').toLowerCase().includes(q);
      const matchesId = (p.product_id || '').toLowerCase().includes(q);
      const matchesCat = (p.category?.name || '').toLowerCase().includes(q);
      const matchesVariant = p.product_variants?.some(v =>
        (v.sku || '').toLowerCase().includes(q) ||
        (v.variant_value || '').toLowerCase().includes(q)
      );
      if (!matchesName && !matchesId && !matchesCat && !matchesVariant) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {products.length} products total · {listingsRemaining} listing slots remaining
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Title, SKU, or ID"
              className="w-full pl-9 pr-8 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <Link
            to="/products/add"
            onClick={e => isListingFull && e.preventDefault()}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer ${
              isListingFull
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {isListingFull && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800 font-medium">
          ⚠️ Listing quota reached. <Link to="/subscription" className="underline font-bold">Upgrade your plan</Link> to add more products.
        </div>
      )}

      {/* 2. Tabs Navigation (Matches requested screenshot) */}
      <div className="border-b border-slate-200">
        <div className="flex overflow-x-auto whitespace-nowrap gap-8 pb-0.5 no-scrollbar">
          {[
            { id: 'active' as TabType, name: 'Active', count: activeCount },
            { id: 'pending' as TabType, name: 'QC Pending', count: pendingCount },
            { id: 'blocked' as TabType, name: 'Blocked / Inactive', count: blockedCount },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === tab.id
                  ? 'text-indigo-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.name} ({tab.count})</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-700" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Product List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Loading inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl p-8 space-y-3">
          <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto text-neutral-400">
            {activeTab === 'active' && <CheckCircle2 className="w-6 h-6 text-neutral-400" />}
            {activeTab === 'pending' && <Clock className="w-6 h-6 text-neutral-400" />}
            {activeTab === 'blocked' && <Ban className="w-6 h-6 text-neutral-400" />}
          </div>
          <h3 className="text-sm font-bold text-neutral-800">
            No {activeTab === 'active' ? 'active' : activeTab === 'pending' ? 'pending activation' : 'blocked'} products found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery
              ? `No products match "${searchQuery}" in this tab.`
              : activeTab === 'active'
              ? 'Add your first product to get started selling on YYME.'
              : 'There are currently no products in this status tab.'}
          </p>
          {activeTab === 'active' && !searchQuery && (
            <Link
              to="/products/add"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Product Listing</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => {
            const hasCover = product.image_urls && product.image_urls.length > 0 && product.image_urls[0];
            const isActive = isProductActive(product);

            return (
              <div
                key={product.product_id}
                className="bg-white border border-neutral-200 rounded-2xl p-4 md:p-5 shadow-2xs hover:border-neutral-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden shrink-0 flex items-center justify-center">
                    {hasCover ? (
                      <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-neutral-300" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {product.category?.name ?? 'General'}
                      </span>
                      {product.have_variants && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {product.product_variants?.length || 0} Variants
                        </span>
                      )}
                      {/* Common Status badge */}
                      {product.status === 'revoked' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded text-rose-700 bg-rose-50 border border-rose-200">
                          ✕ Revoked
                        </span>
                      ) : isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-emerald-800 bg-emerald-50 border-emerald-200">
                          ● Active
                        </span>
                      ) : (product.qc_status === 'submitted' || product.publish_status === 'pending_qc') ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-amber-800 bg-amber-50 border-amber-200">
                          ⏳ Pending QC
                        </span>
                      ) : product.qc_status === 'rejected' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-rose-800 bg-rose-50 border-rose-200">
                          ✕ QC Rejected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-neutral-500 bg-neutral-100 border-neutral-200">
                          ○ Inactive
                        </span>
                      )}

                      {/* QC Status badge */}
                      {(product.qc_status || product.publish_status === 'pending_qc') && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          product.qc_status === 'verified'
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                            : product.qc_status === 'rejected'
                            ? 'text-rose-800 bg-rose-50 border-rose-200'
                            : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}>
                          {product.qc_status === 'verified' ? 'QC: Verified' : product.qc_status === 'rejected' ? 'QC: Rejected' : 'QC: Submitted'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 truncate">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="font-extrabold text-neutral-900">
                        {formatINR(product.base_price)}
                      </span>
                      {product.mrp > product.base_price && (
                        <span className="text-neutral-400 line-through text-[11px]">
                          {formatINR(product.mrp)}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-neutral-500">
                        MOQ: {product.moq || 1}
                      </span>
                      {(() => {
                        const inStock = product.have_variants && product.product_variants?.length
                          ? product.product_variants.some(v => v.stock_quantity === true || (v.stock_quantity as any) > 0)
                          : (product.stock_quantity === true || (product.stock_quantity as any) > 0);
                        return (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${inStock ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-rose-800 bg-rose-50 border-rose-200'}`}>
                            {inStock ? '● In Stock' : '○ Out of Stock'}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Variant chips preview */}
                    {product.have_variants && product.product_variants && product.product_variants.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        {product.product_variants.slice(0, 3).map(v => (
                          <span
                            key={v.variant_id}
                            className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-medium rounded-md"
                          >
                            {v.variant_value}
                          </span>
                        ))}
                        {product.product_variants.length > 3 && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-400 text-[10px] rounded-md font-bold">
                            +{product.product_variants.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={product.status === 'revoked' || (product.qc_status ? product.qc_status !== 'verified' : product.publish_status === 'pending_qc')}
                    onClick={() => toggleActive(product)}
                    className={`p-2 rounded-xl transition-colors ${
                      product.status === 'revoked' || (product.qc_status ? product.qc_status !== 'verified' : product.publish_status === 'pending_qc')
                        ? 'opacity-40 cursor-not-allowed text-neutral-400 bg-neutral-100'
                        : 'cursor-pointer ' + (isActive
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200')
                    }`}
                    title={
                      product.status === 'revoked'
                        ? 'Revoked by Admin'
                        : (product.qc_status ? product.qc_status !== 'verified' : product.publish_status === 'pending_qc')
                        ? 'Cannot activate until QC is verified'
                        : isActive
                        ? 'Set as Inactive'
                        : 'Set as Active'
                    }
                  >
                    {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <Link
                    to={`/products/edit/${product.product_id}`}
                    className="p-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 hover:text-neutral-900 rounded-xl transition-colors cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(product.product_id)}
                    className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
