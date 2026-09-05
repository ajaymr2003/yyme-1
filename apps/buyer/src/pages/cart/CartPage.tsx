import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, CartItemRow } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import { Trash2, Plus, Minus, ShoppingCart, MessageCircle } from 'lucide-react';

export function CartPage() {
  const { items, summary, loading, fetchCart, removeItem, incrementQty, decrementQty, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => { fetchCart(); }, []);

  if (loading) return (
    <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
  );

  if (items.length === 0) return (
    <div className="text-center py-16 px-4">
      <ShoppingCart className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
      <h2 className="text-lg font-bold text-neutral-900">Your cart is empty</h2>
      <p className="text-sm text-neutral-500 mt-1">Browse products and add items to your cart</p>
      <button onClick={() => navigate('/shop')}
        className="mt-4 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
        Browse Shop
      </button>
    </div>
  );

  return (
    <div className="px-4 py-4 pb-32">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-neutral-900">Cart ({items.length})</h1>
        <button onClick={clearCart} className="text-xs text-red-600 font-medium hover:underline">Clear All</button>
      </div>

      {/* Single seller enforcement notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
        <p className="text-xs text-amber-700 font-medium">
          ⚠️ Cart supports items from <strong>one seller at a time</strong>. Adding from a different seller will replace current items.
        </p>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <CartItemCard key={item.cart_item_id} item={item}
            onRemove={() => removeItem(item.cart_item_id)}
            onInc={() => incrementQty(item.cart_item_id, item.quantity)}
            onDec={() => decrementQty(item.cart_item_id, item.quantity)} />
        ))}
      </div>

      {/* Sticky Checkout Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-600">Total</span>
          <span className="text-lg font-bold text-neutral-900">{formatINR(summary.displayPrice)}</span>
        </div>
        <a href={summary.whatsappLink} target="_blank" rel="noopener noreferrer"
          className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg">
          <MessageCircle className="w-5 h-5" />
          Order via WhatsApp
        </a>
      </div>
    </div>
  );
}

function CartItemCard({ item, onRemove, onInc, onDec }: { item: CartItemRow; onRemove: () => void; onInc: () => void; onDec: () => void }) {
  const price = item.variant?.selling_price ?? item.product?.base_price ?? 0;
  const name = item.product?.name ?? 'Product';
  const variantLabel = item.variant ? `${item.variant.variant_type}: ${item.variant.variant_value}` : null;
  const imageUrl = item.variant?.image_urls?.[0] ?? item.product?.image_urls?.[0];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-3 flex gap-3 shadow-sm">
      <div className="w-20 h-20 bg-neutral-100 rounded-lg flex-shrink-0 flex items-center justify-center">
        {imageUrl ? <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-lg" /> : <span className="text-2xl">📦</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 line-clamp-2">{name}</h4>
            {variantLabel && <p className="text-[11px] text-neutral-500 mt-0.5">{variantLabel}</p>}
          </div>
          <button onClick={onRemove} className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-neutral-900">{formatINR(price * item.quantity)}</span>
          <div className="flex items-center gap-2 bg-neutral-100 rounded-lg px-1">
            <button onClick={onDec} className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-neutral-900">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
            <button onClick={onInc} className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-neutral-900">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-neutral-400 mt-1">{formatINR(price)} x {item.quantity}</p>
      </div>
    </div>
  );
}
