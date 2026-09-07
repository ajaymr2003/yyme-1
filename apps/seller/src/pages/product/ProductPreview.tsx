import React from 'react';
import { Save, X } from 'lucide-react';
import { VariantAxis, VariantCombination } from './ProductPricingAndVariants';

interface ProductPreviewProps {
  onClose: () => void;
  onConfirm: () => void;
  name: string;
  description: string;
  material: string;
  getCategoryBreadcrumb: () => string;
  hasVariants: boolean;
  mrp: string;
  basePrice: string;
  isAvailable: boolean;
  moq: string;
  imageUrls: string[];
  coverImageIndex: number;
  enabledCombinations: VariantCombination[];
  imageAxis?: VariantAxis;
}

export const ProductPreview: React.FC<ProductPreviewProps> = ({
  onClose,
  onConfirm,
  name,
  description,
  material,
  getCategoryBreadcrumb,
  hasVariants,
  mrp,
  basePrice,
  isAvailable,
  moq,
  imageUrls,
  coverImageIndex,
  enabledCombinations,
  imageAxis
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div>
            <h3 className="font-extrabold text-neutral-800 text-base">Catalog Preview & Confirm</h3>
            <p className="text-[10px] text-neutral-400 font-bold">Review listing specifications before publishing live</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 font-black text-xl p-1 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-700">
          {/* Product Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50/50 p-4 rounded-xl border border-neutral-200">
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Category Path</span>
                <span className="font-bold text-neutral-800">{getCategoryBreadcrumb()}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Product Title</span>
                <span className="font-bold text-neutral-900 text-sm">{name}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Material / Base Fabric</span>
                <span className="font-bold text-neutral-700">{material || 'Not Specified'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Description & Specs</span>
                <p className="text-neutral-600 font-medium whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto pr-1">
                  {description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Single Product Pricing / Details Preview */}
          {!hasVariants && (
            <div className="space-y-3">
              <h4 className="font-black text-neutral-800 border-b border-neutral-100 pb-1.5 uppercase tracking-wider text-[10px]">
                Pricing & Stock Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400 font-bold block text-[9px]">MRP</span>
                  <span className="text-sm font-extrabold text-neutral-800">₹{mrp}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <span className="text-emerald-600 font-bold block text-[9px]">SELLING PRICE</span>
                  <span className="text-sm font-black text-emerald-800">₹{basePrice}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400 font-bold block text-[9px]">AVAILABILITY</span>
                  <span className={`text-xs font-black inline-flex items-center gap-1.5 mt-1 ${isAvailable ? 'text-emerald-700' : 'text-rose-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {isAvailable ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400 font-bold block text-[9px]">MINIMUM ORDER QTY (MOQ)</span>
                  <span className="text-xs font-bold text-neutral-800">{moq} unit{parseInt(moq) > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Main image gallery */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                  Product Images ({imageUrls.length})
                </span>
                <div className="flex gap-2 flex-wrap">
                  {imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shadow-2xs ${
                        coverImageIndex === idx ? 'border-emerald-600' : 'border-neutral-200'
                      }`}
                    >
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      {coverImageIndex === idx && (
                        <span className="absolute top-0.5 left-0.5 bg-emerald-600 text-white text-[6px] font-black px-1 py-0.5 rounded shadow-2xs">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Variant Combinations Pricing Matrix Preview */}
          {hasVariants && (
            <div className="space-y-3">
              <h4 className="font-black text-neutral-800 border-b border-neutral-100 pb-1.5 uppercase tracking-wider text-[10px]">
                Variant Combinations Matrix ({enabledCombinations.length} Active SKUs)
              </h4>

              {/* Image axis values overview */}
              {imageAxis && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                    Variant Photo Galleries (Grouped by {imageAxis.name})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {imageAxis.values.map(val => (
                      <div key={val.id} className="border border-neutral-200 rounded-lg p-2.5 flex items-center gap-3">
                        {val.images[0] ? (
                          <img src={val.images[0]} className="w-10 h-10 rounded object-cover border border-neutral-150" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-neutral-100 flex items-center justify-center text-neutral-400">×</div>
                        )}
                        <div>
                          <span className="font-bold text-neutral-800 block text-xs">{val.value}</span>
                          <span className="text-[10px] text-neutral-400 font-bold">{val.images.length} images added</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Combination SKU</th>
                      <th className="py-2.5 px-3">MRP</th>
                      <th className="py-2.5 px-3">Selling Price</th>
                      <th className="py-2.5 px-3">Availability</th>
                      <th className="py-2.5 px-3">SKU Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                    {enabledCombinations.map(combo => (
                      <tr key={combo.id} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-3 font-extrabold text-neutral-900">{Object.values(combo.attributes).join(' / ')}</td>
                        <td className="py-2.5 px-3">₹{combo.mrp}</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-bold">₹{combo.price}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${combo.is_available ? 'text-emerald-700' : 'text-rose-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${combo.is_available ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {combo.is_available ? 'Available' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{combo.sku || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
          >
            Go Back & Edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Confirm & Publish Product</span>
          </button>
        </div>
      </div>
    </div>
  );
};
