import React from 'react';
import { AlertTriangle, ArrowRight, Store, Trash2, X } from 'lucide-react';
import { formatINR } from '@ymenet/utils';

export interface CartConflictInfo {
  currentSeller: {
    seller_id: string;
    business_name: string;
  };
  newSeller: {
    seller_id: string;
    business_name: string;
  };
  newProduct: {
    product_id: string;
    name: string;
    base_price: number;
    image_urls?: string[];
  };
  newVariant?: {
    variant_id: string;
    variant_type: string;
    variant_value: string;
    selling_price: number;
  };
  newQuantity: number;
  currentItemsCount: number;
}

interface CartConflictModalProps {
  conflict: CartConflictInfo;
  onCancel: () => void;
  onConfirmReplace: () => void;
  isReplacing?: boolean;
}

export const CartConflictModal: React.FC<CartConflictModalProps> = ({
  conflict,
  onCancel,
  onConfirmReplace,
  isReplacing = false,
}) => {
  const newPrice = conflict.newVariant?.selling_price ?? conflict.newProduct.base_price ?? 0;
  const newImg = conflict.newProduct.image_urls?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog" 
        aria-modal="true" 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 leading-tight">Replace items in cart?</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Different seller detected</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCancel}
            disabled={isReplacing}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 py-3 space-y-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Your cart already contains <strong className="text-neutral-900">{conflict.currentItemsCount} item{conflict.currentItemsCount > 1 ? 's' : ''}</strong> from <strong className="text-neutral-900">{conflict.currentSeller.business_name}</strong>. Because orders are fulfilled directly by artisans, each cart can only hold items from <strong>one seller at a time</strong>.
          </p>

          {/* Conflict Switch Visual Card */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-neutral-500 pb-1 border-b border-neutral-200">
              <span className="flex items-center gap-1.5 font-medium">
                <Store className="w-3.5 h-3.5 text-neutral-400" /> Current Cart
              </span>
              <span className="font-semibold text-neutral-700 truncate max-w-[180px]">
                {conflict.currentSeller.business_name}
              </span>
            </div>

            <div className="flex items-center justify-between text-emerald-700 pt-0.5">
              <span className="flex items-center gap-1.5 font-medium">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" /> New Item
              </span>
              <span className="font-semibold text-emerald-800 truncate max-w-[180px]">
                {conflict.newSeller.business_name}
              </span>
            </div>

            {/* New item preview */}
            <div className="flex items-center gap-2.5 pt-1.5 mt-1 border-t border-dashed border-neutral-200">
              <div className="w-10 h-10 rounded-lg bg-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                {newImg ? (
                  <img src={newImg} alt={conflict.newProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">📦</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 truncate">{conflict.newProduct.name}</p>
                <p className="text-[11px] text-neutral-500">
                  {formatINR(newPrice)} × {conflict.newQuantity}
                  {conflict.newVariant ? ` (${conflict.newVariant.variant_value})` : ''}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200/60 leading-tight">
            Discarding will clear your current cart and start a fresh order with <strong>{conflict.newProduct.name}</strong>.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isReplacing}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Keep Existing Cart
          </button>
          <button
            type="button"
            onClick={onConfirmReplace}
            disabled={isReplacing}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isReplacing ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Discard & Replace Cart
          </button>
        </div>
      </div>
    </div>
  );
};
