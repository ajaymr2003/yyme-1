import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './AuthContext';
import { useAuth } from './AuthContext';
import { formatINR } from '@ymenet/utils';
import { CartConflictModal, CartConflictInfo } from '../../components/cart/CartConflictModal';
import { CheckCircle2 } from 'lucide-react';

export interface CartItemRow {
  cart_item_id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product?: {
    product_id: string;
    name: string;
    base_price: number;
    seller_id: string;
    image_urls: string[];
    moq: number;
    stock_quantity: boolean;
    seller?: {
      seller_id: string;
      business_name: string;
      whatsapp_number?: string;
      remaining_click_quota?: number;
    };
  };
  variant?: {
    variant_id: string;
    variant_type: string;
    variant_value: string;
    selling_price: number;
    image_urls: string[];
    stock_quantity: boolean;
  };
}

export interface CartSeller {
  seller_id: string;
  business_name: string;
  whatsapp_number: string;
  remaining_click_quota?: number;
}

export interface CartSummary {
  displayPrice: number;
  mrp: number;
  discountPercent: number;
  whatsappLink: string;
  seller?: CartSeller;
}

interface CartCtx {
  items: CartItemRow[];
  summary: CartSummary;
  loading: boolean;
  cartId: string | null;
  currentSeller: CartSeller | null;
  conflict: CartConflictInfo | null;
  addItem: (product: any, variant?: any, quantity?: number) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<void>;
  incrementQty: (cartItemId: string, currentQty: number) => Promise<void>;
  decrementQty: (cartItemId: string, currentQty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  cancelConflict: () => void;
  confirmReplaceCart: () => Promise<void>;
  handleWhatsAppOrderClick: () => Promise<void>;
}

const CartContext = createContext<CartCtx | undefined>(undefined);

const GUEST_CART_STORAGE_KEY = 'yyme_buyer_guest_cart';

function getGuestCart(): CartItemRow[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse guest cart from localStorage', e);
    return [];
  }
}

function saveGuestCart(items: CartItemRow[]) {
  try {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save guest cart to localStorage', e);
  }
}

export function formatWhatsAppUrl(rawPhone: string | undefined | null, message: string): string {
  if (!rawPhone) return '';
  // Remove all non-digits
  let clean = rawPhone.replace(/\D/g, '');
  if (!clean) return '';
  // If starts with 0, strip leading 0
  if (clean.startsWith('0')) clean = clean.slice(1);
  // If standard 10-digit Indian phone number, prepend 91
  if (clean.length === 10) {
    clean = `91${clean}`;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function generateWaMessageText(seller: { business_name?: string }, items: CartItemRow[]): string {
  const lines: string[] = [];
  lines.push(`Hi ${seller.business_name || 'Seller'} 👋`);
  lines.push(`I'd like to order the following from your YYME store:\n`);
  let totalDisplay = 0;
  items.forEach((item, idx) => {
    const price = item.variant?.selling_price ?? item.product?.base_price ?? 0;
    const name = item.product?.name ?? 'Item';
    const variant = item.variant ? ` (${item.variant.variant_type}: ${item.variant.variant_value})` : '';
    totalDisplay += price * item.quantity;
    lines.push(`${idx + 1}. ${name}${variant} x ${item.quantity} — ${formatINR(price * item.quantity)}`);
  });
  lines.push(`\n💰 Total: ${formatINR(totalDisplay)}`);
  lines.push(`\nPlease share payment details & delivery info. Thank you!`);
  return lines.join('\n');
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { buyerProfile } = useAuth();
  const [items, setItems] = useState<CartItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);
  const [currentSeller, setCurrentSeller] = useState<CartSeller | null>(null);
  const [conflict, setConflict] = useState<CartConflictInfo | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const [summary, setSummary] = useState<CartSummary>({
    displayPrice: 0,
    mrp: 0,
    discountPercent: 0,
    whatsappLink: '',
    seller: undefined,
  });

  const showToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3000);
  };

  // Helper to fetch full seller details (business_name, whatsapp_number, remaining_click_quota)
  const fetchSellerDetails = useCallback(async (sellerId: string): Promise<CartSeller | null> => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('seller_id, business_name, whatsapp_number, remaining_click_quota')
        .eq('seller_id', sellerId)
        .maybeSingle();

      if (error || !data) return null;
      return {
        seller_id: data.seller_id,
        business_name: data.business_name,
        whatsapp_number: data.whatsapp_number,
        remaining_click_quota: data.remaining_click_quota,
      };
    } catch (e) {
      console.warn('Error fetching seller details:', e);
      return null;
    }
  }, []);

  const computeSummary = useCallback(async (cartItems: CartItemRow[]) => {
    let displayPrice = 0;
    cartItems.forEach(item => {
      const price = item.variant?.selling_price ?? item.product?.base_price ?? 0;
      displayPrice += price * item.quantity;
    });

    const firstProduct = cartItems.find(i => i.product?.seller_id);
    let sellerInfo: CartSeller | undefined = undefined;

    if (firstProduct?.product?.seller_id) {
      const sellerId = firstProduct.product.seller_id;
      // Fetch latest seller details directly from sellers table
      const fetched = await fetchSellerDetails(sellerId);
      if (fetched) {
        sellerInfo = fetched;
      } else if (firstProduct.product.seller?.business_name && firstProduct.product.seller?.whatsapp_number) {
        sellerInfo = {
          seller_id: sellerId,
          business_name: firstProduct.product.seller.business_name,
          whatsapp_number: firstProduct.product.seller.whatsapp_number,
          remaining_click_quota: firstProduct.product.seller.remaining_click_quota,
        };
      }
    }

    setCurrentSeller(sellerInfo ?? null);

    const waLink = sellerInfo?.whatsapp_number
      ? formatWhatsAppUrl(sellerInfo.whatsapp_number, generateWaMessageText(sellerInfo, cartItems))
      : '';

    setSummary({
      displayPrice,
      mrp: displayPrice,
      discountPercent: 0,
      whatsappLink: waLink,
      seller: sellerInfo,
    });
  }, [fetchSellerDetails]);

  // Fetch Cart (supports logged in Supabase cart + guest localStorage)
  const fetchCart = useCallback(async () => {
    setLoading(true);

    if (buyerProfile) {
      try {
        let { data: cart } = await supabase
          .from('cart')
          .select('cart_id, seller_id')
          .eq('buyer_id', buyerProfile.buyer_id)
          .maybeSingle();

        if (!cart) {
          const { data: newCart, error: cartErr } = await supabase
            .from('cart')
            .insert([{ buyer_id: buyerProfile.buyer_id }])
            .select('cart_id, seller_id')
            .maybeSingle();

          if (cartErr) {
            console.warn('Cart table access error (RLS):', cartErr.message);
          }
          cart = newCart;
        }

        if (!cart?.cart_id) {
          // Fallback to local cart so UI stays active and functional even before RLS script is executed
          const guestRows = getGuestCart();
          setCartId('guest_cart');
          setItems(guestRows);
          await computeSummary(guestRows);
          setLoading(false);
          return;
        }

        setCartId(cart.cart_id);

        const { data: cartItems } = await supabase
          .from('cart_items')
          .select(`
            *,
            product:products(
              product_id, name, base_price, seller_id, image_urls, moq, stock_quantity,
              seller:sellers(seller_id, business_name, whatsapp_number, remaining_click_quota)
            ),
            variant:product_variants(
              variant_id, variant_type, variant_value, selling_price, image_urls, stock_quantity
            )
          `)
          .eq('cart_id', cart.cart_id);

        const rows = (cartItems ?? []) as CartItemRow[];
        setItems(rows);
        await computeSummary(rows);
      } catch (err) {
        console.error('Error fetching cart:', err);
      }
    } else {
      // Guest cart
      const guestRows = getGuestCart();
      setCartId('guest_cart');
      setItems(guestRows);
      await computeSummary(guestRows);
    }

    setLoading(false);
  }, [buyerProfile, computeSummary]);

  // Initial load & when buyerProfile changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add Item with Single-Seller Conflict Interception
  async function addItem(product: any, variant?: any, quantity: number = 1): Promise<boolean> {
    const incomingSellerId = product.seller_id;
    if (!incomingSellerId) {
      console.warn('Product missing seller_id', product);
      return false;
    }

    // Determine current seller ID in cart
    const currentSellerId = items.length > 0 ? (items[0].product?.seller_id || currentSeller?.seller_id) : null;

    // CONFLICT CHECK: Cart has items and incoming product belongs to a DIFFERENT seller
    if (currentSellerId && currentSellerId !== incomingSellerId) {
      let currentSellerName = currentSeller?.business_name || items[0].product?.seller?.business_name || 'Current Seller';
      let newSellerName = product.seller?.business_name;

      if (!newSellerName) {
        const fetched = await fetchSellerDetails(incomingSellerId);
        newSellerName = fetched?.business_name || 'New Seller';
      }

      const totalExistingCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

      setConflict({
        currentSeller: {
          seller_id: currentSellerId,
          business_name: currentSellerName,
        },
        newSeller: {
          seller_id: incomingSellerId,
          business_name: newSellerName,
        },
        newProduct: {
          product_id: product.product_id,
          name: product.name,
          base_price: product.base_price,
          image_urls: product.image_urls,
        },
        newVariant: variant ? {
          variant_id: variant.variant_id,
          variant_type: variant.variant_type,
          variant_value: variant.variant_value,
          selling_price: variant.selling_price,
        } : undefined,
        newQuantity: quantity,
        currentItemsCount: totalExistingCount,
      });

      return false; // Intercepted due to conflict
    }

    // SAME SELLER OR EMPTY CART -> PROCEED TO ADD
    if (buyerProfile && cartId && cartId !== 'guest_cart') {
      // Update cart table seller_id
      await supabase.from('cart').update({ seller_id: incomingSellerId }).eq('cart_id', cartId);

      // Check if item with this product + variant already exists
      const existing = items.find(
        i => i.product_id === product.product_id && (i.variant_id ?? null) === (variant?.variant_id ?? null)
      );

      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('cart_item_id', existing.cart_item_id);
      } else {
        await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: product.product_id,
          variant_id: variant?.variant_id ?? null,
          quantity: quantity,
        });
      }

      await fetchCart();
      return true;
    } else {
      // GUEST CART in localStorage
      const guestRows = [...getGuestCart()];
      const existingIdx = guestRows.findIndex(
        i => i.product_id === product.product_id && (i.variant_id ?? null) === (variant?.variant_id ?? null)
      );

      if (existingIdx >= 0) {
        guestRows[existingIdx].quantity += quantity;
      } else {
        const newRow: CartItemRow = {
          cart_item_id: 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          cart_id: 'guest_cart',
          product_id: product.product_id,
          variant_id: variant?.variant_id ?? null,
          quantity: quantity,
          product: {
            product_id: product.product_id,
            name: product.name,
            base_price: product.base_price,
            seller_id: incomingSellerId,
            image_urls: product.image_urls ?? [],
            moq: product.moq ?? 1,
            stock_quantity: typeof product.stock_quantity === 'boolean' ? product.stock_quantity : (product.stock_quantity ?? 1) > 0,
            seller: product.seller ?? { seller_id: incomingSellerId, business_name: 'Seller' },
          },
          variant: variant ? {
            variant_id: variant.variant_id,
            variant_type: variant.variant_type,
            variant_value: variant.variant_value,
            selling_price: variant.selling_price,
            image_urls: variant.image_urls ?? [],
            stock_quantity: typeof variant.stock_quantity === 'boolean' ? variant.stock_quantity : (variant.stock_quantity ?? 1) > 0,
          } : undefined,
        };
        guestRows.push(newRow);
      }

      saveGuestCart(guestRows);
      setItems(guestRows);
      await computeSummary(guestRows);
      return true;
    }
  }

  // Cancel Conflict Modal (Keep Existing Cart)
  const cancelConflict = () => {
    setConflict(null);
  };

  // Confirm Replace Cart (Discard Old Cart & Add New Seller's Item)
  const confirmReplaceCart = async () => {
    if (!conflict) return;
    setIsReplacing(true);

    try {
      if (buyerProfile && cartId && cartId !== 'guest_cart') {
        // 1. Delete all old items
        await supabase.from('cart_items').delete().eq('cart_id', cartId);
        // 2. Set new seller_id
        await supabase.from('cart').update({ seller_id: conflict.newSeller.seller_id }).eq('cart_id', cartId);
        // 3. Insert new item
        await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: conflict.newProduct.product_id,
          variant_id: conflict.newVariant?.variant_id ?? null,
          quantity: conflict.newQuantity,
        });
        await fetchCart();
      } else {
        // GUEST CART: Clear and replace
        const newGuestRow: CartItemRow = {
          cart_item_id: 'guest_' + Date.now(),
          cart_id: 'guest_cart',
          product_id: conflict.newProduct.product_id,
          variant_id: conflict.newVariant?.variant_id ?? null,
          quantity: conflict.newQuantity,
          product: {
            product_id: conflict.newProduct.product_id,
            name: conflict.newProduct.name,
            base_price: conflict.newProduct.base_price,
            seller_id: conflict.newSeller.seller_id,
            image_urls: conflict.newProduct.image_urls ?? [],
            moq: 1,
            stock_quantity: true,
            seller: {
              seller_id: conflict.newSeller.seller_id,
              business_name: conflict.newSeller.business_name,
            },
          },
          variant: conflict.newVariant ? {
            variant_id: conflict.newVariant.variant_id,
            variant_type: conflict.newVariant.variant_type,
            variant_value: conflict.newVariant.variant_value,
            selling_price: conflict.newVariant.selling_price,
            image_urls: [],
            stock_quantity: true,
          } : undefined,
        };

        const replacementItems = [newGuestRow];
        saveGuestCart(replacementItems);
        setItems(replacementItems);
        await computeSummary(replacementItems);
      }

      showToast(`Cart replaced with items from ${conflict.newSeller.business_name}!`);
      setConflict(null);
    } catch (err) {
      console.error('Failed to replace cart:', err);
    } finally {
      setIsReplacing(false);
    }
  };

  async function removeItem(cartItemId: string) {
    if (buyerProfile && cartId && cartId !== 'guest_cart') {
      await supabase.from('cart_items').delete().eq('cart_item_id', cartItemId);
      await fetchCart();
    } else {
      const remaining = items.filter(i => i.cart_item_id !== cartItemId);
      saveGuestCart(remaining);
      setItems(remaining);
      await computeSummary(remaining);
    }
  }

  async function incrementQty(cartItemId: string, currentQty: number) {
    if (buyerProfile && cartId && cartId !== 'guest_cart') {
      await supabase.from('cart_items').update({ quantity: currentQty + 1 }).eq('cart_item_id', cartItemId);
      await fetchCart();
    } else {
      const updated = items.map(i => i.cart_item_id === cartItemId ? { ...i, quantity: currentQty + 1 } : i);
      saveGuestCart(updated);
      setItems(updated);
      await computeSummary(updated);
    }
  }

  async function decrementQty(cartItemId: string, currentQty: number) {
    if (currentQty <= 1) {
      await removeItem(cartItemId);
      return;
    }
    if (buyerProfile && cartId && cartId !== 'guest_cart') {
      await supabase.from('cart_items').update({ quantity: currentQty - 1 }).eq('cart_item_id', cartItemId);
      await fetchCart();
    } else {
      const updated = items.map(i => i.cart_item_id === cartItemId ? { ...i, quantity: currentQty - 1 } : i);
      saveGuestCart(updated);
      setItems(updated);
      await computeSummary(updated);
    }
  }

  async function clearCart() {
    if (buyerProfile && cartId && cartId !== 'guest_cart') {
      await supabase.from('cart_items').delete().eq('cart_id', cartId);
      await supabase.from('cart').update({ seller_id: null }).eq('cart_id', cartId);
      await fetchCart();
    } else {
      saveGuestCart([]);
      setItems([]);
      setCurrentSeller(null);
      setSummary({
        displayPrice: 0,
        mrp: 0,
        discountPercent: 0,
        whatsappLink: '',
        seller: undefined,
      });
    }
  }

  // Deduct click quota when ordering via WhatsApp
  async function handleWhatsAppOrderClick() {
    if (!currentSeller?.seller_id) return;
    try {
      // 1. Decrement quota via RPC
      await supabase.rpc('decrement_click_quota', { sid: currentSeller.seller_id });

      // 2. Insert into whatsapp_click_logs
      await supabase.from('whatsapp_click_logs').insert([{
        seller_id: currentSeller.seller_id,
        buyer_id: buyerProfile?.buyer_id ?? null,
        item_price: summary.displayPrice,
      }]);

      // 3. Insert into orders table with product images and status 'initiated'
      if (buyerProfile?.buyer_id && items.length > 0) {
        const orderRecords = items.map(item => ({
          buyer_id: buyerProfile.buyer_id,
          seller_id: currentSeller.seller_id,
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          item_price: (item.variant?.selling_price ?? item.product?.base_price ?? 0) * item.quantity,
          product_images: item.variant?.image_urls?.length ? item.variant.image_urls : (item.product?.image_urls ?? []),
          status: 'initiated',
          clicked_at: new Date().toISOString()
        }));

        await supabase.from('orders').insert(orderRecords);
      }
    } catch (e) {
      console.warn('Error handling WhatsApp order click tracking:', e);
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        loading,
        cartId,
        currentSeller,
        conflict,
        addItem,
        removeItem,
        incrementQty,
        decrementQty,
        clearCart,
        fetchCart,
        cancelConflict,
        confirmReplaceCart,
        handleWhatsAppOrderClick,
      }}
    >
      {children}

      {/* Global Conflict Modal */}
      {conflict && (
        <CartConflictModal
          conflict={conflict}
          onCancel={cancelConflict}
          onConfirmReplace={confirmReplaceCart}
          isReplacing={isReplacing}
        />
      )}

      {/* Global Toast Notification */}
      {globalToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 backdrop-blur-xs text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{globalToast}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
