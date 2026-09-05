import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { useQuota } from '../../core/contexts/QuotaContext';
import { formatINR } from '@ymenet/utils';
import { Plus, Search, Package, Edit2, Eye, EyeOff, Trash2 } from 'lucide-react';

interface ProductRow {
  product_id: string;
  name: string;
  base_price: number;
  mrp: number;
  stock_quantity: number;
  is_active: boolean;
  have_variants: boolean;
  image_urls: string[];
  category: { name: string } | null;
  product_variants: { variant_id: string; variant_type: string; variant_value: string; selling_price: number; stock_quantity: number }[];
}

export function ProductsPage() {
  const { sellerProfile } = useSellerAuth();
  const { listingsRemaining, isListingFull } = useQuota();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  async function fetchProducts() {
    if (!sellerProfile) return;
    setLoading(true);
    let query = supabase.from('products').select('*, category:categories(name), product_variants(variant_id, variant_type, variant_value, selling_price, stock_quantity)')
      .eq('seller_id', sellerProfile.seller_id).order('created_at', { ascending: false });
    const { data } = await query;
    setProducts((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, [sellerProfile]);

  async function toggleActive(product: ProductRow) {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('product_id', product.product_id);
    fetchProducts();
  }

  const filtered = products.filter(p => {
    if (filter === 'active' && !p.is_active) return false;
    if (filter === 'inactive' && p.is_active) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Products</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{products.length} products · {listingsRemaining} slots remaining</p>
        </div>
        <Link to="/products/add"
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors shadow-sm ${isListingFull ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          onClick={e => isListingFull && e.preventDefault()}>
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {isListingFull && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <p className="text-xs text-amber-700 font-medium">⚠️ Listing quota reached. <Link to="/subscription" className="underline">Upgrade your plan</Link> to add more products.</p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search products..." />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          className="px-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-600">No products found</p>
          <Link to="/products/add" className="inline-flex items-center gap-2 mt-3 text-xs font-semibold text-emerald-600 hover:underline">
            <Plus className="w-4 h-4" /> Add your first product
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => (
            <div key={product.product_id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-neutral-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                  {product.image_urls?.[0] ? (
                    <img src={product.image_urls[0]} className="w-full h-full object-cover rounded-lg" />
                  ) : <Package className="w-6 h-6 text-neutral-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-emerald-600 uppercase">{product.category?.name ?? 'Uncategorized'}</p>
                      <h4 className="text-sm font-semibold text-neutral-900 truncate">{product.name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive(product)}
                        className={`p-1.5 rounded-lg transition-colors ${product.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-neutral-400 hover:bg-neutral-100'}`}>
                        {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <Link to={`/products/edit/${product.product_id}`}
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-bold text-neutral-900">{formatINR(product.base_price)}</span>
                    {product.mrp > product.base_price && (
                      <span className="text-[10px] text-neutral-400 line-through">{formatINR(product.mrp)}</span>
                    )}
                    <span className="text-[10px] text-neutral-500">Stock: {product.stock_quantity}</span>
                  </div>
                  {product.have_variants && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {product.product_variants?.slice(0, 4).map(v => (
                        <span key={v.variant_id} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-medium rounded-full">
                          {v.variant_type}: {v.variant_value}
                        </span>
                      ))}
                      {(product.product_variants?.length ?? 0) > 4 && (
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] rounded-full">+{(product.product_variants?.length ?? 0) - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
