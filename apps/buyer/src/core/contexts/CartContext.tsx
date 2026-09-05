import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './AuthContext';
import { useAuth } from './AuthContext';
import { formatINR } from '@ymenet/utils';

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
    stock_quantity: number;
  };
  variant?: {
    variant_id: string;
    variant_type: string;
    variant_value: string;
    selling_price: number;
    image_urls: string[];
    stock_quantity: number;
  };
}

export interface CartSummary {
  displayPrice: number;
  mrp: number;
  discountPercent: number;
  whatsappLink: string;
  seller?: { seller_id: string; business_name: string; whatsapp_number: string };
}

interface CartCtx {
  items: CartItemRow[];
  summary: CartSummary;
  loading: boolean;
  hasConflict: boolean;
  cartId: string | null;
  addItem: (product: any, variant?: any) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  incrementQty: (cartItemId: string, currentQty: number) => Promise<void>;
  decrementQty: (cartItemId: string, currentQty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartCtx | undefined>(undefined);

function generateWaMessage(seller: any, items: CartItemRow[]): string {
  const lines: string[] = [];
  lines.push(`Hi ${seller.business_name} 👋`);
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
  return encodeURIComponent(lines.join('\n'));
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { buyerProfile } = useAuth();
  const [items, setItems] = useState<CartItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);
  const [summary, setSummary] = useState<CartSummary>({
    displayPrice: 0, mrp: 0, discountPercent: 0,
    whatsappLink: '', seller: undefined,
  });

  const computeSummary = useCallback((cartItems: CartItemRow[]) => {
    const productItem = cartItems.find(i => i.product);
    const seller = productItem?.product
      ? { seller_id: productItem.product.seller_id, business_name: 'Seller', whatsapp_number: '' }
      : undefined;

    let displayPrice = 0;
    cartItems.forEach(item => {
      const price = item.variant?.selling_price ?? item.product?.base_price ?? 0;
      displayPrice += price * item.quantity;
    });

    setSummary({
      displayPrice, mrp: displayPrice, discountPercent: 0,
      whatsappLink: seller ? `https://wa.me/91${seller.whatsapp_number}?text=${generateWaMessage(seller, cartItems)}` : '',
      seller,
    });
  }, []);

  async function fetchCart() {
    if (!buyerProfile) return;
    setLoading(true);

    let { data: cart } = await supabase.from('cart').select('cart_id').eq('buyer_id', buyerProfile.buyer_id).maybeSingle();

    if (!cart) {
      const { data: newCart } = await supabase.from('cart').insert([{ buyer_id: buyerProfile.buyer_id }]).select('cart_id').single();
      cart = newCart;
    }
    if (!cart) { setLoading(false); return; }
    setCartId(cart.cart_id);

    const { data: cartItems } = await supabase
      .from('cart_items').select('*, product:products(product_id, name, base_price, seller_id, image_urls, moq, stock_quantity), variant:product_variants(variant_id, variant_type, variant_value, selling_price, image_urls, stock_quantity)')
      .eq('cart_id', cart.cart_id);

    const rows = (cartItems ?? []) as CartItemRow[];
    setItems(rows);
    computeSummary(rows);
    setLoading(false);
  }

  async function addItem(product: any, variant?: any) {
    if (!buyerProfile || !cartId) return;

    const { data: existingCart } = await supabase.from('cart').select('seller_id').eq('cart_id', cartId).maybeSingle();
    if (existingCart?.seller_id && existingCart.seller_id !== product.seller_id) {
      return;
    }

    const { error } = await supabase.from('cart_items').upsert({
      cart_id: cartId, product_id: product.product_id,
      variant_id: variant?.variant_id ?? null, quantity: 1,
    }, { onConflict: 'cart_item_id' });

    if (!error) await fetchCart();
  }

  async function removeItem(cartItemId: string) {
    await supabase.from('cart_items').delete().eq('cart_item_id', cartItemId);
    await fetchCart();
  }

  async function incrementQty(cartItemId: string, currentQty: number) {
    await supabase.from('cart_items').update({ quantity: currentQty + 1 }).eq('cart_item_id', cartItemId);
    await fetchCart();
  }

  async function decrementQty(cartItemId: string, currentQty: number) {
    if (currentQty <= 1) { await removeItem(cartItemId); return; }
    await supabase.from('cart_items').update({ quantity: currentQty - 1 }).eq('cart_item_id', cartItemId);
    await fetchCart();
  }

  async function clearCart() {
    if (!cartId) return;
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
    await supabase.from('cart').update({ seller_id: null }).eq('cart_id', cartId);
    await fetchCart();
  }

  return (
    <CartContext.Provider value={{ items, summary, loading, hasConflict: false, cartId, addItem, removeItem, incrementQty, decrementQty, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
