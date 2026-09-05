import React, { useEffect, useState } from 'react';
import { supabase } from '../../core/contexts/AuthContext';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import { ShoppingCart, Star, TrendingUp } from 'lucide-react';

export function HomePage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    supabase.from('banners').select('*').eq('is_active', true).order('display_order').then(({ data }) => setBanners(data ?? []));
    supabase.from('categories').select('*').eq('level', 1).order('display_order').then(({ data }) => setCategories(data ?? []));
    supabase.from('products').select('*, seller:sellers(business_name), category:categories(name)').eq('is_active', true).order('created_at', { ascending: false }).limit(10).then(({ data }) => setFeaturedProducts(data ?? []));
  }, []);

  return (
    <div className="space-y-6 pb-4">
      {/* Hero Banner */}
      {banners.length > 0 && (
        <div className="px-4">
          <div className="relative rounded-2xl overflow-hidden bg-emerald-600 h-40">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-700/90 to-emerald-500/60 z-10" />
            <div className="relative z-20 p-6 flex flex-col justify-center h-full">
              <h2 className="text-white text-xl font-black mb-1">{banners[0].title}</h2>
              <p className="text-emerald-100 text-sm">Discover handcrafted treasures from local artisans</p>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="px-4">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">Shop by Category</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <a key={cat.category_id} href={`/shop/category/${cat.category_id}`}
                className="flex-shrink-0 w-20 flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-2xl">📦</span>
                </div>
                <span className="text-[11px] font-medium text-neutral-700 text-center leading-tight">{cat.name}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">New Arrivals</h3>
          <a href="/shop" className="text-xs font-semibold text-emerald-600 hover:underline">View All</a>
        </div>
        {featuredProducts.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Products coming soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {featuredProducts.map(product => (
              <div key={product.product_id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                  {product.image_urls?.[0] ? (
                    <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-medium text-emerald-600 uppercase">{product.category?.name ?? 'Product'}</p>
                  <h4 className="text-sm font-semibold text-neutral-900 mt-0.5 line-clamp-2">{product.name}</h4>
                  <p className="text-[10px] text-neutral-500 mt-0.5">by {product.seller?.business_name ?? 'Seller'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-base font-bold text-neutral-900">{formatINR(product.base_price)}</span>
                      {product.mrp > product.base_price && (
                        <span className="text-[10px] text-neutral-400 line-through ml-1">{formatINR(product.mrp)}</span>
                      )}
                    </div>
                    <button onClick={() => addItem(product)}
                      className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-sm">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {product.moq > 1 && (
                    <p className="text-[10px] text-amber-600 font-medium mt-1">MOQ: {product.moq} pcs</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
