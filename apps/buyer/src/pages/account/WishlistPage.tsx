import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useAuth } from '../../core/contexts/AuthContext';
import { formatINR } from '@ymenet/utils';
import { Heart, Trash2, ShoppingCart, ExternalLink } from 'lucide-react';

interface WishlistItem {
  favorite_id: string;
  product_id: string;
  name: string;
  price: number;
  image_urls: string[];
  seller_name: string;
}

export function WishlistPage() {
  const { session, buyerProfile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    fetchWishlist();
  }, [session, authLoading]);

  async function fetchWishlist() {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: buyer } = await supabase
        .from('buyers')
        .select('buyer_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!buyer) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('favorites')
        .select('favorite_id, product_id, products(name, base_price, image_urls, sellers(business_name))')
        .eq('buyer_id', buyer.buyer_id);

      const wishlistItems = (data ?? []).map((f: any) => ({
        favorite_id: f.favorite_id,
        product_id: f.product_id,
        name: f.products?.name || 'Product',
        price: f.products?.base_price || 0,
        image_urls: f.products?.image_urls ?? [],
        seller_name: f.products?.sellers?.business_name || 'Seller',
      }));
      setItems(wishlistItems);
    } catch (e) {
      console.warn('Error fetching wishlist:', e);
    }
    setLoading(false);
  }

  async function removeItem(favoriteId: string) {
    await supabase.from('favorites').delete().eq('favorite_id', favoriteId);
    setItems(items.filter(i => i.favorite_id !== favoriteId));
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Your Wishlist</h2>
          <p className="text-sm text-neutral-500 mb-4">Sign in to save your favorite items</p>
          <Link to="/login" className="inline-block px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">My Wishlist</h1>
          <p className="text-xs text-neutral-500">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
          <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-neutral-800">Your wishlist is empty</p>
          <p className="text-xs text-neutral-400 mt-1 mb-4">Browse products and tap the heart icon to save them here</p>
          <Link to="/shop" className="inline-block px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const discount = 0;
            return (
              <div key={item.favorite_id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
                <Link to={`/product/${item.product_id}`} className="relative aspect-square bg-neutral-100 flex items-center justify-center">
                  {item.image_urls?.[0] ? (
                    <img src={item.image_urls[0]} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); removeItem(item.favorite_id); }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </Link>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase">{item.seller_name}</p>
                    <Link to={`/product/${item.product_id}`}>
                      <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 mt-0.5 hover:text-emerald-700 transition-colors">
                        {item.name}
                      </h4>
                    </Link>
                  </div>
                  <div className="pt-2 mt-2 border-t border-neutral-100">
                    <p className="text-sm font-black text-neutral-900">{formatINR(item.price)}</p>
                    <Link
                      to={`/product/${item.product_id}`}
                      className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" /> View Product
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
