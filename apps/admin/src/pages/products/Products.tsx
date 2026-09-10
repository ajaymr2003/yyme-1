import React, { useEffect, useState } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { formatINR } from '@ymenet/utils';
import { Package, Search, Eye, EyeOff, Trash2, CheckCircle2, Clock, Ban, ShieldCheck } from 'lucide-react';

interface ProductRow {
  product_id: string;
  name: string;
  base_price: number;
  mrp: number;
  stock_quantity: boolean;
  moq: number;
  is_active: boolean;
  qc_status: 'submitted' | 'verified' | 'rejected';
  status: 'active' | 'inactive' | 'revoked';
  have_variants: boolean;
  image_urls: string[];
  created_at: string;
  category: { name: string } | null;
  seller: { business_name: string; owner_name: string } | null;
  product_variants: {
    variant_id: string;
    variant_type: string;
    variant_value: string;
    selling_price: number;
    stock_quantity: boolean;
    sku?: string;
  }[];
}

type TabType = 'all' | 'active' | 'pending' | 'rejected';

export function Products() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name),
        seller:sellers(business_name, owner_name),
        product_variants(variant_id, variant_type, variant_value, selling_price, stock_quantity, sku)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts((data as any) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, []);

  async function toggleActive(product: ProductRow) {
    if (product.status === 'revoked') return;
    if (product.qc_status !== 'verified') return;

    const isActive = product.status === 'active';
    const newStatus = isActive ? 'inactive' : 'active';
    const newIsActive = !isActive;

    const { error } = await supabase
      .from('products')
      .update({ is_active: newIsActive, status: newStatus })
      .eq('product_id', product.product_id);

    if (!error) {
      setProducts(products.map(p =>
        p.product_id === product.product_id
          ? { ...p, is_active: newIsActive, status: newStatus }
          : p
      ));
    }
  }

  async function handleDelete(productId: string) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    const { error } = await supabase.from('products').delete().eq('product_id', productId);
    if (!error) {
      setProducts(products.filter(p => p.product_id !== productId));
    }
  }

  const isProductActive = (p: ProductRow) => p.qc_status === 'verified' && p.status === 'active';
  const isProductPending = (p: ProductRow) => p.qc_status === 'submitted';
  const isProductRejected = (p: ProductRow) => p.qc_status === 'rejected';

  const activeCount = products.filter(isProductActive).length;
  const pendingCount = products.filter(isProductPending).length;
  const rejectedCount = products.filter(isProductRejected).length;

  const filteredProducts = products.filter(p => {
    if (activeTab === 'active' && !isProductActive(p)) return false;
    if (activeTab === 'pending' && !isProductPending(p)) return false;
    if (activeTab === 'rejected' && !isProductRejected(p)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.product_id || '').toLowerCase().includes(q) ||
        (p.category?.name || '').toLowerCase().includes(q) ||
        (p.seller?.business_name || '').toLowerCase().includes(q) ||
        p.product_variants?.some(v =>
          (v.sku || '').toLowerCase().includes(q) ||
          (v.variant_value || '').toLowerCase().includes(q)
        )
      );
    }
    return true;
  });

  const tabs = [
    { id: 'all' as TabType, label: 'All', count: products.length },
    { id: 'active' as TabType, label: 'Active', count: activeCount },
    { id: 'pending' as TabType, label: 'QC Pending', count: pendingCount },
    { id: 'rejected' as TabType, label: 'Rejected', count: rejectedCount },
  ];

  const getStatusBadge = (p: ProductRow) => {
    if (p.status === 'revoked') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-red-700 bg-red-50 border-red-200">Revoked</span>;
    if (isProductActive(p)) return <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200">Active</span>;
    if (p.qc_status === 'submitted') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-amber-700 bg-amber-50 border-amber-200">Pending QC</span>;
    if (p.qc_status === 'rejected') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-red-700 bg-red-50 border-red-200">QC Rejected</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-neutral-500 bg-neutral-100 border-neutral-200">Inactive</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Products</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {products.length} products total
          </p>
        </div>
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, seller, SKU, or ID..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex overflow-x-auto whitespace-nowrap gap-6 pb-0.5">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-emerald-600' : 'text-neutral-500 hover:text-neutral-800'
              }`}>
              {tab.label} ({tab.count})
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl p-8 space-y-3">
          <Package className="w-10 h-10 text-neutral-300 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-800">
            No {activeTab === 'all' ? '' : activeTab} products found
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery ? `No products match "${searchQuery}"` : 'No products in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => {
            const hasCover = product.image_urls?.length > 0 && product.image_urls[0];
            const isInStock = product.have_variants && product.product_variants?.length
              ? product.product_variants.some(v => v.stock_quantity === true || (v.stock_quantity as any) > 0)
              : (product.stock_quantity === true || (product.stock_quantity as any) > 0);

            return (
              <div key={product.product_id}
                className="bg-white border border-neutral-200 rounded-xl p-4 md:p-5 shadow-sm hover:border-neutral-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden shrink-0 flex items-center justify-center">
                    {hasCover ? (
                      <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-neutral-300" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                        {product.category?.name ?? 'Uncategorized'}
                      </span>
                      {getStatusBadge(product)}
                      {product.have_variants && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {product.product_variants?.length || 0} Variants
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 truncate">{product.name}</h3>

                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="font-extrabold text-neutral-900">{formatINR(product.base_price)}</span>
                      {product.mrp > product.base_price && (
                        <span className="text-neutral-400 line-through text-[11px]">{formatINR(product.mrp)}</span>
                      )}
                      <span className="text-[11px] text-neutral-500">MOQ: {product.moq}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${isInStock ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-rose-800 bg-rose-50 border-rose-200'}`}>
                        {isInStock ? '● In Stock' : '○ Out of Stock'}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400">
                      {product.seller?.business_name || 'Unknown seller'}
                      {' · '}
                      {new Date(product.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>

                    {/* Variant chips */}
                    {product.have_variants && product.product_variants?.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        {product.product_variants.slice(0, 4).map(v => (
                          <span key={v.variant_id} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-medium rounded-md">
                            {v.variant_value}
                          </span>
                        ))}
                        {product.product_variants.length > 4 && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-400 text-[10px] rounded-md font-bold">
                            +{product.product_variants.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                  <button onClick={() => toggleActive(product)}
                    disabled={product.status === 'revoked' || product.qc_status !== 'verified'}
                    className={`p-2 rounded-xl transition-colors ${
                      product.status === 'revoked' || product.qc_status !== 'verified'
                        ? 'opacity-40 cursor-not-allowed text-neutral-400 bg-neutral-100'
                        : isProductActive(product)
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer'
                          : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200 cursor-pointer'
                    }`}
                    title={product.qc_status !== 'verified' ? 'QC not verified' : isProductActive(product) ? 'Deactivate' : 'Activate'}>
                    {isProductActive(product) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button onClick={() => handleDelete(product.product_id)}
                    className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                    title="Delete Product">
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
