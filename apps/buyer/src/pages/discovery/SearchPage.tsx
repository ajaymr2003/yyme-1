import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase, useAuth } from '../../core/contexts/AuthContext';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import { ShoppingCart, Store, Search, X, Package } from 'lucide-react';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { addItem } = useCart();
  const [searchQuery, setSearchQuery] = useState(query);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) { setProducts([]); return; }
    setLoading(true);
    const q = searchQuery.toLowerCase();
    supabase.from('products')
      .select('*, seller:sellers(seller_id, business_name, whatsapp_number), category:categories(name)')
      .eq('is_active', true).eq('qc_status', 'verified')
      .then(({ data }) => {
        const all = data ?? [];
        const filtered = all.filter((p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
        setProducts(filtered);
        setLoading(false);
      });
  }, [searchQuery]);

  const showAddedToast = (name: string) => { setAddedToast(`Added "${name}" to cart!`); setTimeout(() => setAddedToast(null), 2500); };

  return (
    <div className="min-h-screen bg-surface-page text-neutral-900 pb-12">
      {addedToast && (
        <div className="fixed bottom-20 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center gap-2">
          <span>{addedToast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pt-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); navigate(`/search?q=${encodeURIComponent(e.target.value)}`, { replace: true }); }}
              placeholder="Search products..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
            />
            {searchQuery && <button onClick={() => { setSearchQuery(''); navigate('/search'); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-neutral-400" /></button>}
          </div>
          {searchQuery && <p className="text-xs text-neutral-500 mt-2">{products.length} results for "{searchQuery}"</p>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-neutral-500 text-sm">Searching...</div>
        ) : products.length === 0 && searchQuery ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-800">No products found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p) => {
              const discount = p.mrp && p.mrp > p.base_price ? Math.round(((p.mrp - p.base_price) / p.mrp) * 100) : 0;
              const isInStock = p.stock_quantity === true || (p.stock_quantity as any) > 0 || p.stock_quantity === undefined;

              return (
                <div key={p.product_id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
                  <div onClick={() => navigate(`/product/${p.product_id}`, { state: { product: p } })} className="relative aspect-square bg-neutral-100 overflow-hidden cursor-pointer">
                    {p.image_urls?.[0] ? (
                      <img
                        src={p.image_urls[0]}
                        alt={p.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                          !isInStock ? 'opacity-70' : ''
                        }`}
                      />
                    ) : (
                      <span className="text-3xl flex items-center justify-center h-full">📦</span>
                    )}

                    {/* Stock & Discount Badges */}
                    {!isInStock ? (
                      <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                        Out of Stock
                      </span>
                    ) : discount > 0 ? (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                        {discount}% OFF
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase">{p.category?.name || 'Handicraft'}</span>
                      <h3 onClick={() => navigate(`/product/${p.product_id}`, { state: { product: p } })} className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 mt-0.5 cursor-pointer hover:text-emerald-700">{p.name}</h3>
                      <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1"><Store className="w-3 h-3" />{p.seller?.business_name || 'Verified Artisan'}</p>
                    </div>
                    <div className="pt-2 border-t border-neutral-100 mt-2">
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black">{formatINR(p.base_price)}</span>
                          {discount > 0 && <span className="text-[10px] text-neutral-400 line-through">{formatINR(p.mrp)}</span>}
                        </div>
                        {!isInStock && (
                          <span className="text-[10px] font-bold text-rose-600">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          if (!isInStock) return;
                          if (!session) {
                            navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
                            return;
                          }
                          await addItem(p);
                          showAddedToast(p.name);
                        }}
                        disabled={!isInStock}
                        className={`w-full py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                          isInStock
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs'
                            : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                        }`}
                      >
                        {isInStock ? (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />Add to Cart
                          </>
                        ) : (
                          'Out of Stock'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
