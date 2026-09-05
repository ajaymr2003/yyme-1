import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import { Search, ShoppingCart, X } from 'lucide-react';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase.from('products').select('*, seller:sellers(business_name, whatsapp_number), category:categories(name)')
      .eq('is_active', true).ilike('name', `%${query.trim()}%`).order('created_at', { ascending: false });
    setResults(data ?? []);
    setLoading(false);
  }

  return (
    <div className="px-4 py-4">
      <div className="sticky top-14 z-20 bg-stone-100 pb-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Search products..." autoFocus />
          </div>
          <button onClick={doSearch} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No products found for "{query}"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(product => (
            <div key={product.product_id} className="bg-white border border-neutral-200 rounded-xl p-3 flex gap-3 shadow-sm">
              <div className="w-20 h-20 bg-neutral-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                {product.image_urls?.[0] ? (
                  <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : <span className="text-2xl">📦</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-emerald-600 uppercase">{product.category?.name}</p>
                <h4 className="text-sm font-semibold text-neutral-900 truncate">{product.name}</h4>
                <p className="text-[10px] text-neutral-500">{product.seller?.business_name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-bold text-neutral-900">{formatINR(product.base_price)}</span>
                  <button onClick={() => addItem(product)}
                    className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-sm">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
