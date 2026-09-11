import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, CartItemRow } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import { Trash2, Plus, Minus, ShoppingCart, MessageCircle, Store, ShieldCheck } from 'lucide-react';

export function CartPage() {
  const { items, summary, currentSeller, loading, fetchCart, removeItem, incrementQty, decrementQty, clearCart, handleWhatsAppOrderClick } = useCart();
  const navigate = useNavigate();

  useEffect(() => { fetchCart(); }, []);

  if (loading) return (
    <div className="py-20 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
    </div>
  );

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
      <ShoppingCart className="w-14 h-14 text-neutral-300 mx-auto mb-3" />
      <h2 className="text-lg font-bold text-neutral-900">Your cart is empty</h2>
      <p className="text-sm text-neutral-500 mt-1">Browse products and add items to your cart</p>
      <button
        onClick={() => navigate('/shop')}
        className="mt-5 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
      >
        Browse Shop
      </button>
    </div>
  );

  const sellerName = currentSeller?.business_name || summary.seller?.business_name || 'Verified Artisan';
  const isQuotaReached = summary.seller?.remaining_click_quota !== undefined && summary.seller.remaining_click_quota <= 0;

  return (
    <div className="px-4 py-6 pb-32 max-w-2xl mx-auto w-full">
      {/* Title & Clear All */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg sm:text-xl font-bold text-neutral-900">Cart ({items.length})</h1>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Seller Header Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-500">Ordering from:</span>
                <span className="text-xs font-bold text-neutral-900">{sellerName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[11px] text-neutral-400">Direct fulfillment with maker</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Single Seller
          </span>
        </div>
      </div>

      {/* Single seller enforcement notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          ⚡ <strong>Single-Seller Policy:</strong> Orders are coordinated directly via WhatsApp with this seller. Adding items from another maker will prompt you to replace this cart.
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
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Total</span>
            <span className="text-lg font-bold text-neutral-900">{formatINR(summary.displayPrice)}</span>
          </div>

          {isQuotaReached ? (
            <button
              disabled
              className="w-full bg-neutral-200 text-neutral-500 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed"
              title="Seller inquiry quota reached for this billing cycle"
            >
              <MessageCircle className="w-5 h-5" />
              Seller Inquiries Full
            </button>
          ) : (
            <a
              href={summary.whatsappLink}
              onClick={handleWhatsAppOrderClick}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              Order via WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CartItemCard({ item, onRemove, onInc, onDec }: { item: CartItemRow; onRemove: () => void; onInc: () => void; onDec: () => void }) {
  const price = item.variant?.selling_price ?? item.product?.base_price ?? 0;
  const name = item.product?.name ?? 'Product';
  const variantLabel = item.variant ? `${item.variant.variant_type}: ${item.variant.variant_value}` : null;
  const imageUrl = item.variant?.image_urls?.[0] ?? item.product?.image_urls?.[0];

  const isInStock = item.variant
    ? (item.variant.stock_quantity === true || (item.variant.stock_quantity as any) > 0 || item.variant.stock_quantity === undefined)
    : (item.product?.stock_quantity === true || (item.product?.stock_quantity as any) > 0 || item.product?.stock_quantity === undefined);

  return (
    <div className={`bg-white border border-neutral-200 rounded-xl p-3 flex gap-3 shadow-sm ${!isInStock ? 'opacity-80 bg-neutral-50/50' : ''}`}>
      <div className="w-20 h-20 bg-neutral-100 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden">
        {imageUrl ? <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-lg" /> : <span className="text-2xl">📦</span>}
        {!isInStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[8.5px] font-black text-white uppercase bg-rose-600 px-1 py-0.5 rounded">Sold Out</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 line-clamp-2">{name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              {variantLabel && <p className="text-[11px] text-neutral-500">{variantLabel}</p>}
              {!isInStock && <span className="text-[9.5px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">Out of Stock</span>}
            </div>
          </div>
          <button onClick={onRemove} className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
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
