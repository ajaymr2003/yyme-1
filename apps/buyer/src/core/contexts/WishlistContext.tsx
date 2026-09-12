import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, useAuth } from './AuthContext';
import { Heart, Check, X, ArrowRight } from 'lucide-react';

export interface WishlistProductData {
  product_id: string;
  name: string;
  base_price: number;
  mrp?: number;
  image_urls?: string[];
  seller_name?: string;
}

export interface WishlistItem {
  favorite_id: string;
  product_id: string;
  name: string;
  price: number;
  mrp?: number;
  image_urls: string[];
  seller_name: string;
}

interface ToastInfo {
  id: number;
  message: string;
  action?: 'added' | 'removed';
}

interface WishlistCtx {
  items: WishlistItem[];
  wishlistIds: Set<string>;
  wishlistCount: number;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string, productData?: Partial<WishlistProductData>) => Promise<boolean>;
  addToWishlist: (productId: string, productData?: Partial<WishlistProductData>) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistCtx | undefined>(undefined);

const GUEST_WISHLIST_STORAGE_KEY = 'yyme_buyer_guest_wishlist';

function getGuestWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestWishlist(items: WishlistItem[]) {
  try {
    localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save guest wishlist:', e);
  }
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, buyerProfile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const wishlistIds = useMemo(() => {
    return new Set(items.map((i) => i.product_id));
  }, [items]);

  const showToast = useCallback((message: string, action: 'added' | 'removed') => {
    const toastId = Date.now();
    setToast({ id: toastId, message, action });
    setTimeout(() => {
      setToast((prev) => (prev?.id === toastId ? null : prev));
    }, 3000);
  }, []);

  // Fetch wishlist items from Supabase or guest localStorage
  const fetchWishlist = useCallback(async () => {
    if (authLoading) return;

    // Guest Mode
    if (!session?.user?.id) {
      const guestItems = getGuestWishlist();
      setItems(guestItems);
      setLoading(false);
      return;
    }

    // Logged-in Mode
    try {
      let buyerId = buyerProfile?.buyer_id;

      if (!buyerId) {
        const { data: buyer } = await supabase
          .from('buyers')
          .select('buyer_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        buyerId = buyer?.buyer_id;
      }

      if (!buyerId) {
        setItems([]);
        setLoading(false);
        return;
      }

      // If guest wishlist had items, sync them to Supabase favorites
      const guestItems = getGuestWishlist();
      if (guestItems.length > 0) {
        for (const gItem of guestItems) {
          try {
            await supabase
              .from('favorites')
              .upsert(
                { buyer_id: buyerId, product_id: gItem.product_id },
                { onConflict: 'buyer_id,product_id', ignoreDuplicates: true }
              );
          } catch {
            // fallback: insert ignoring duplicate error
            await supabase
              .from('favorites')
              .insert({ buyer_id: buyerId, product_id: gItem.product_id });
          }
        }
        localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
      }

      // Fetch from Supabase
      const { data, error } = await supabase
        .from('favorites')
        .select('favorite_id, product_id, products(name, base_price, mrp, image_urls, sellers(business_name))')
        .eq('buyer_id', buyerId);

      if (!error && data) {
        const formatted: WishlistItem[] = data.map((f: any) => ({
          favorite_id: f.favorite_id,
          product_id: f.product_id,
          name: f.products?.name || 'Product',
          price: f.products?.base_price || 0,
          mrp: f.products?.mrp || undefined,
          image_urls: f.products?.image_urls ?? [],
          seller_name: f.products?.sellers?.business_name || 'Verified Seller',
        }));
        setItems(formatted);
      }
    } catch (err) {
      console.warn('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [session, buyerProfile, authLoading]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isWishlisted = useCallback((productId: string): boolean => {
    return wishlistIds.has(productId);
  }, [wishlistIds]);

  const addToWishlist = useCallback(async (
    productId: string,
    productData?: Partial<WishlistProductData>
  ): Promise<boolean> => {
    if (isWishlisted(productId)) return true;

    const newItem: WishlistItem = {
      favorite_id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      product_id: productId,
      name: productData?.name || 'Product',
      price: productData?.base_price || 0,
      mrp: productData?.mrp,
      image_urls: productData?.image_urls || [],
      seller_name: productData?.seller_name || 'Verified Seller',
    };

    // Optimistic state update
    setItems((prev) => [newItem, ...prev]);
    showToast(productData?.name ? `Saved "${productData.name}" to Wishlist` : 'Saved to Wishlist', 'added');

    if (!session?.user?.id) {
      // Guest
      const guestItems = getGuestWishlist();
      saveGuestWishlist([newItem, ...guestItems.filter((i) => i.product_id !== productId)]);
      return true;
    }

    // Logged in
    try {
      let buyerId = buyerProfile?.buyer_id;
      if (!buyerId) {
        const { data: buyer } = await supabase
          .from('buyers')
          .select('buyer_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        buyerId = buyer?.buyer_id;
      }

      if (buyerId) {
        const { data, error } = await supabase
          .from('favorites')
          .insert({ buyer_id: buyerId, product_id: productId })
          .select('favorite_id')
          .single();

        if (!error && data?.favorite_id) {
          setItems((prev) =>
            prev.map((it) => (it.product_id === productId ? { ...it, favorite_id: data.favorite_id } : it))
          );
        }
      }
    } catch (err) {
      console.warn('Error saving to wishlist:', err);
    }
    return true;
  }, [isWishlisted, session, buyerProfile, showToast]);

  const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
    // Find item name for toast
    const existing = items.find((i) => i.product_id === productId);
    const itemName = existing?.name;

    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    showToast(itemName ? `Removed "${itemName}" from Wishlist` : 'Removed from Wishlist', 'removed');

    if (!session?.user?.id) {
      const guestItems = getGuestWishlist();
      saveGuestWishlist(guestItems.filter((i) => i.product_id !== productId));
      return true;
    }

    try {
      let buyerId = buyerProfile?.buyer_id;
      if (!buyerId) {
        const { data: buyer } = await supabase
          .from('buyers')
          .select('buyer_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        buyerId = buyer?.buyer_id;
      }

      if (buyerId) {
        await supabase
          .from('favorites')
          .delete()
          .eq('buyer_id', buyerId)
          .eq('product_id', productId);
      }
    } catch (err) {
      console.warn('Error removing from wishlist:', err);
    }
    return true;
  }, [items, session, buyerProfile, showToast]);

  const toggleWishlist = useCallback(async (
    productId: string,
    productData?: Partial<WishlistProductData>
  ): Promise<boolean> => {
    if (isWishlisted(productId)) {
      await removeFromWishlist(productId);
      return false;
    } else {
      await addToWishlist(productId, productData);
      return true;
    }
  }, [isWishlisted, removeFromWishlist, addToWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistIds,
        wishlistCount: items.length,
        loading,
        isWishlisted,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}

      {/* Global Interactive Wishlist Toast Notification */}
      {toast && (
        <div className="fixed bottom-18 md:bottom-6 right-4 left-4 md:left-auto md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-neutral-900/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  toast.action === 'added' ? 'bg-rose-500/20 text-rose-400' : 'bg-neutral-700 text-neutral-300'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${toast.action === 'added' ? 'fill-rose-500 text-rose-500' : ''}`}
                />
              </div>
              <p className="text-xs font-semibold text-neutral-100 truncate">{toast.message}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.action === 'added' && (
                <Link
                  to="/wishlist"
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
};
