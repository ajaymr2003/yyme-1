import React from 'react';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import { MessageCircle, MapPin, Store, ShieldCheck } from 'lucide-react';

export function CheckoutPage() {
  const { items, summary, currentSeller, handleWhatsAppOrderClick } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-neutral-500 text-sm">Your cart is empty. Add items to proceed.</p>
      </div>
    );
  }

  const sellerName = currentSeller?.business_name || summary.seller?.business_name || 'Verified Artisan';
  const isQuotaReached = summary.seller?.remaining_click_quota !== undefined && summary.seller.remaining_click_quota <= 0;

  return (
    <div className="px-4 py-4 pb-32 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-neutral-900 mb-3">Order Summary</h1>

      {/* Seller Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500">Seller:</span>
              <span className="text-xs font-bold text-neutral-900">{sellerName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-[11px] text-neutral-400">Direct fulfillment with maker</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-4">
        {items.map((item, idx) => {
          const price = item.variant?.selling_price ?? item.product?.base_price ?? 0;
          return (
            <div key={item.cart_item_id} className={`p-3 flex gap-3 ${idx > 0 ? 'border-t border-neutral-100' : ''}`}>
              <div className="w-14 h-14 bg-neutral-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                {item.variant?.image_urls?.[0] ?? item.product?.image_urls?.[0] ? (
                  <img src={item.variant?.image_urls?.[0] ?? item.product?.image_urls?.[0]} className="w-full h-full object-cover rounded-lg" />
                ) : <span className="text-lg">📦</span>}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-neutral-900">{item.product?.name}</h4>
                {item.variant && <p className="text-[10px] text-neutral-500">{item.variant.variant_type}: {item.variant.variant_value}</p>}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-neutral-500">Qty: {item.quantity}</span>
                  <span className="text-xs font-bold text-neutral-900">{formatINR(price * item.quantity)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Summary */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-neutral-600">Subtotal ({items.length} items)</span><span className="font-semibold">{formatINR(summary.displayPrice)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-neutral-600">Shipping</span><span className="text-emerald-600 font-medium">Direct with Seller</span></div>
          <div className="flex justify-between text-sm"><span className="text-neutral-600">Payment</span><span className="text-emerald-600 font-medium">Offline (UPI/Cash)</span></div>
          <div className="border-t border-neutral-200 pt-2 mt-2">
            <div className="flex justify-between"><span className="text-sm font-bold text-neutral-900">Total</span><span className="text-lg font-bold text-neutral-900">{formatINR(summary.displayPrice)}</span></div>
          </div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Delivery is arranged directly with seller</h4>
            <p className="text-xs text-blue-700 mt-1">Shipping cost and delivery time will be discussed over WhatsApp.</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-4">
        <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3">How it works</h4>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Click "Order via WhatsApp" to open chat with seller' },
            { step: '2', text: 'Share this order summary and discuss delivery details' },
            { step: '3', text: 'Make payment directly via UPI or Cash on Delivery' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">{s.step}</div>
              <p className="text-xs text-neutral-600 mt-0.5">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-30">
        <div className="max-w-2xl mx-auto">
          {isQuotaReached ? (
            <button
              disabled
              className="w-full bg-neutral-200 text-neutral-500 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed"
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
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              Order via WhatsApp — {formatINR(summary.displayPrice)}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
