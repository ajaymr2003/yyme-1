import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import { ShoppingCart, Store, CheckCircle } from 'lucide-react';

import { cacheService, CACHE_KEYS, CACHE_TTL } from '../../core/services/cacheService';

export function ShopPage() {
  const { categoryId } = useParams();
  const { addItem } = useCart();
  const [categories, setCategories] = useState<any[]>(() => {
    return cacheService.get<any[]>(CACHE_KEYS.CATEGORIES_ALL, true)?.data || [];
  });
  const [products, setProducts] = useState<any[]>(() => {
    const key = CACHE_KEYS.SHOP_PRODUCTS(categoryId || 'all');
    return cacheService.get<any[]>(key, true)?.data || [];
  });
  const [curatedFallback, setCuratedFallback] = useState<any[]>([]);
  const [loading, setLoading] = useState(() => {
    const key = CACHE_KEYS.SHOP_PRODUCTS(categoryId || 'all');
    return !cacheService.get<any[]>(key, true);
  });
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Fetch all categories with 15-min cache
  useEffect(() => {
    cacheService
      .fetchWithCache(
        CACHE_KEYS.CATEGORIES_ALL,
        async () => {
          const { data } = await supabase.from('categories').select('*').order('display_order');
          return data ?? [];
        },
        { ttl: CACHE_TTL.LONG, onBackgroundUpdate: (fresh) => setCategories(fresh) }
      )
      .then((data) => setCategories(data));
  }, []);

  // Recursively collect all descendant category IDs (L1, L2, L3)
  const getDescendantIds = (rootId: string): string[] => {
    const result: string[] = [rootId];
    const findChildren = (parentId: string) => {
      const children = categories.filter((c) => c.parent_category_id === parentId);
      for (const child of children) {
        result.push(child.category_id);
        findChildren(child.category_id);
      }
    };
    findChildren(rootId);
    return result;
  };

  // Fetch verified products for the selected category with SWR caching
  useEffect(() => {
    if (categories.length === 0) return;

    const cacheKey = CACHE_KEYS.SHOP_PRODUCTS(categoryId || 'all');
    const cached = cacheService.get<any[]>(cacheKey, true);
    if (!cached) {
      setLoading(true);
    }

    cacheService
      .fetchWithCache(
        cacheKey,
        async () => {
          let query = supabase
            .from('products')
            .select('*, seller:sellers(seller_id, business_name, whatsapp_number), category:categories(name)')
            .eq('is_active', true)
            .eq('qc_status', 'verified');

          if (categoryId) {
            const allTargetIds = getDescendantIds(categoryId);
            query = query.in('category_id', allTargetIds);
          }

          const { data } = await query.order('created_at', { ascending: false }).limit(40);
          return data ?? [];
        },
        {
          ttl: CACHE_TTL.DYNAMIC,
          onBackgroundUpdate: (fresh) => {
            setProducts(fresh);
            setLoading(false);
          },
        }
      )
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });

    // Curated fallback cached
    cacheService
      .fetchWithCache(
        'yyme_buyer_curated_fallback',
        async () => {
          const { data } = await supabase
            .from('products')
            .select('*, seller:sellers(seller_id, business_name, whatsapp_number), category:categories(name)')
            .eq('is_active', true)
            .eq('qc_status', 'verified')
            .order('created_at', { ascending: false })
            .limit(12);
          return data ?? [];
        },
        { ttl: CACHE_TTL.SHORT }
      )
      .then((data) => setCuratedFallback(data));
  }, [categoryId, categories]);

  const showAddedToast = (name: string) => {
    setAddedToast(`Added "${name}" to cart!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const displayProducts = products.length > 0 ? products : curatedFallback;

  return (
    <div className="min-h-screen bg-surface-page text-neutral-900 pb-16">
      {/* Add to Cart Toast */}
      {addedToast && (
        <div className="fixed bottom-20 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Main Content Area - Clean Product Grid */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-3">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 py-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-neutral-100 p-2.5 animate-pulse space-y-2">
                <div className="aspect-[4/5] bg-neutral-200 rounded-lg" />
                <div className="h-2.5 bg-neutral-200 rounded w-2/3" />
                <div className="h-3.5 bg-neutral-200 rounded w-full" />
                <div className="h-4 bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
            {displayProducts.map((p) => {
              const hasImage = p.image_urls && p.image_urls.length > 0;
              const brandOrSeller = p.seller?.business_name || p.brand || 'Artisan';
              const isInStock = p.stock_quantity === true || (p.stock_quantity as any) > 0 || p.stock_quantity === undefined;
              // Deterministic rating calculation based on product ID
              const sum = (p.product_id || 'default').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
              const rating = (4.0 + (sum % 8) / 10).toFixed(1);
              const ratingCount = (1200 + (sum * 9) % 3500).toLocaleString();

              return (
                <Link
                  key={p.product_id}
                  to={`/product/${p.product_id}`}
                  className="flex flex-col group cursor-pointer"
                >
                  {/* Portrait aspect ratio container with rating badge */}
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100 shadow-2xs">
                    {hasImage ? (
                      <img
                        src={p.image_urls[0]}
                        alt={p.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                          !isInStock ? 'opacity-70' : ''
                        }`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-neutral-100">
                        📦
                      </div>
                    )}

                    {/* Out of Stock badge */}
                    {!isInStock && (
                      <div className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs tracking-wider z-10">
                        Out of Stock
                      </div>
                    )}

                    {/* Bottom-left Rating Badge: 4.2 ★ (3,486) */}
                    <div className="absolute bottom-1.5 left-1.5 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-bold text-neutral-800 flex items-center gap-0.5 shadow-2xs">
                      <span>{rating}</span>
                      <span className="text-icon-accent text-[9px]">★</span>
                      <span className="text-neutral-400 text-[9px] font-normal border-l border-neutral-300 pl-1">
                        ({ratingCount})
                      </span>
                    </div>
                  </div>

                  {/* Details below image */}
                  <div className="pt-1.5 px-0.5">
                    {/* Line 1: Brand/Seller bold + Product title lighter */}
                    <div className="flex items-baseline gap-1 text-[11px] sm:text-xs leading-tight">
                      <span className="font-bold text-neutral-900 shrink-0">
                        {brandOrSeller}
                      </span>
                      <span className="text-neutral-500 font-normal truncate">
                        {p.name}
                      </span>
                    </div>

                    {/* Line 2: Prices: strikethrough MRP first, then bold final price */}
                    <div className="mt-0.5 flex items-baseline justify-between gap-1 text-[11.5px] sm:text-xs">
                      <div className="flex items-baseline gap-1">
                        {p.mrp && p.mrp > p.base_price && (
                          <span className="text-neutral-400 line-through text-[10px] font-normal">
                            {formatINR(p.mrp)}
                          </span>
                        )}
                        <span className="font-bold text-neutral-900">
                          {formatINR(p.base_price)}
                        </span>
                      </div>
                      {!isInStock && (
                        <span className="text-[9.5px] font-bold text-rose-600">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
