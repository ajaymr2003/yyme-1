import React, { useState } from 'react';
import {
  Plus, Trash2, Image as ImageIcon, Star, Camera, RefreshCw, X, Check, AlertTriangle
} from 'lucide-react';

export interface VariantAxisValue {
  id: string;
  value: string;
  images: string[];
}

export interface VariantAxis {
  id: string;
  name: string;
  isImageAxis: boolean;
  values: VariantAxisValue[];
}

export interface VariantCombination {
  id: string;
  attributes: { [axisName: string]: string };
  imageAxisValueId: string | null;
  mrp: number;
  price: number;
  is_available: boolean;
  stock_quantity?: number;
  weight?: number | null;
  sku: string;
  enabled: boolean;
}

interface ProductPricingAndVariantsProps {
  // Single quantity states
  mrp: string;
  setMrp: (val: string) => void;
  basePrice: string;
  setBasePrice: (val: string) => void;
  isAvailable: boolean;
  setIsAvailable: (val: boolean) => void;
  moq: string;
  setMoq: (val: string) => void;

  // Single images states
  imageUrls: string[];
  coverImageIndex: number;
  setCoverImageIndex: (idx: number) => void;
  uploadingSingleImages: boolean;
  handleSingleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImageUrl: (index: number) => void;

  // Variants states
  hasVariants: boolean;
  setHasVariants: (val: boolean) => void;
  axes: VariantAxis[];
  setAxes: (val: VariantAxis[]) => void;
  valueInputs: { [axisId: string]: string };
  setValueInputs: (val: { [axisId: string]: string }) => void;
  combinations: VariantCombination[];
  setCombinations: (val: VariantCombination[] | ((prev: VariantCombination[]) => VariantCombination[])) => void;
  matrixStale: boolean;
  handleGenerateMatrix: () => void;

  // Variant callbacks
  handleAddAxis: () => void;
  handleAxisNameChange: (axisId: string, name: string) => void;
  handleRemoveAxis: (axisId: string) => void;
  handleSetImageAxis: (axisId: string) => void;
  handleAddAxisValue: (axisId: string, raw: string) => void;
  handleRemoveAxisValue: (axisId: string, valueId: string) => void;
  handleVariantImageUpload: (axisId: string, valueId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveValueImage: (axisId: string, valueId: string, imgIdx: number) => void;
  uploadingVariantImages: { [valId: string]: boolean };
  updateCombination: (id: string, patch: Partial<VariantCombination>) => void;
  deleteCombination: (id: string) => void;
}

const PRESET_OPTION_NAMES = [
  'Color',
  'Size',
  'Weight',
  'Volume',
  'Pack Size',
  'Flavor',
  'Material',
  'Custom...'
];

export const ProductPricingAndVariants: React.FC<ProductPricingAndVariantsProps> = ({
  mrp, setMrp,
  basePrice, setBasePrice,
  isAvailable, setIsAvailable,
  moq, setMoq,
  imageUrls,
  coverImageIndex, setCoverImageIndex,
  uploadingSingleImages,
  handleSingleImageUpload,
  handleRemoveImageUrl,
  hasVariants, setHasVariants,
  axes,
  valueInputs, setValueInputs,
  combinations,
  matrixStale,
  handleGenerateMatrix,
  handleAddAxis,
  handleAxisNameChange,
  handleRemoveAxis,
  handleSetImageAxis,
  handleAddAxisValue,
  handleRemoveAxisValue,
  handleVariantImageUpload,
  handleRemoveValueImage,
  uploadingVariantImages,
  updateCombination,
  deleteCombination
}) => {
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  const imageAxis = axes.find(a => a.isImageAxis);
  const enabledCombinations = combinations.filter(c => c.enabled);

  const groupedCombinations = imageAxis
    ? imageAxis.values
      .map(val => ({ axisValue: val, combos: combinations.filter(c => c.imageAxisValueId === val.id) }))
      .filter(g => g.combos.length > 0)
    : [{ axisValue: null as VariantAxisValue | null, combos: combinations }];

  return (
    <div className="space-y-6">
      {/* VARIANT TOGGLE */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-4 md:p-5">
        <label className="flex items-center gap-3 font-bold text-xs text-neutral-800 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => setHasVariants(e.target.checked)}
            className="w-4.5 h-4.5 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500 cursor-pointer"
          />
          <span className="text-sm font-extrabold text-neutral-900">
            This product has multiple variants (e.g., Sizes, Colors, Bottle Volumes)
          </span>
        </label>
      </div>

      {/* SINGLE QUANTITY IMAGES & PRICING */}
      {!hasVariants && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-4 md:p-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-sm md:text-base">
                3. Pricing & Images
              </h3>
            </div>
            <span className="text-xs text-neutral-400 font-bold">{imageUrls.length} Images Added</span>
          </div>
          <div className="p-4 md:p-6 space-y-6">

            {/* Images Upload Section */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-700 block">Product Images</label>
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-xl border-2 overflow-hidden group transition-all ${
                        coverImageIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-neutral-200'
                      }`}
                    >
                      <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                      {coverImageIndex === idx && (
                        <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" /> Main Cover
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveImageUrl(idx)}
                          className="self-end p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                          title="Delete Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {coverImageIndex !== idx && (
                          <button
                            type="button"
                            onClick={() => setCoverImageIndex(idx)}
                            className="w-full py-1 bg-white/90 text-neutral-900 text-[10px] font-bold rounded-md hover:bg-white transition-colors cursor-pointer"
                          >
                            Set as Cover
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-bold text-neutral-500 block">Upload Product Images (At least 2 required)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingSingleImages}
                    onChange={handleSingleImageUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {uploadingSingleImages && (
                    <RefreshCw className="animate-spin w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Fields as Table */}
            <div className="pt-6 border-t border-neutral-100 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">MRP (₹)</th>
                    <th className="py-3 px-4">YYMEE PRICE (₹)</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4">Minimum Order Qty (MOQ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  <tr>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={mrp}
                        onChange={(e) => setMrp(e.target.value)}
                        className="w-28 bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="w-28 bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none focus:border-emerald-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsAvailable(!isAvailable)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                            isAvailable ? 'bg-emerald-600' : 'bg-neutral-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              isAvailable ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-bold ${isAvailable ? 'text-emerald-700' : 'text-neutral-400'}`}>
                          {isAvailable ? 'Available' : 'Out of Stock'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={moq}
                        onChange={(e) => setMoq(e.target.value)}
                        className="w-20 bg-neutral-50 border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VARIANT SYSTEM */}
      {hasVariants && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-4 md:p-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-neutral-900">4. Variant Attributes</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Add every attribute that changes this product (Color, Size, Material...). Mark one as the photo attribute if it changes how the product looks.
              </p>
            </div>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase shrink-0">
              {enabledCombinations.length} Active SKUs
            </span>
          </div>

          <div className="p-4 md:p-6 space-y-6">

            {/* General settings for variant setup: MOQ */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 flex items-center justify-between gap-4 max-w-sm">
              <div>
                <label className="text-xs font-bold text-neutral-700 block">Minimum Order Quantity (MOQ)</label>
                <p className="text-[10px] text-neutral-400 font-medium">Applies globally to all variants</p>
              </div>
              <input
                type="number"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                required
                className="w-24 bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Step A: Axis builder */}
            <div className="space-y-6 border-b border-neutral-100 pb-8">
              <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider">Step A: Define Attributes</h4>

              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto border border-neutral-200 rounded-2xl bg-white shadow-2xs">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-1/4">Attribute Type</th>
                      <th className="py-3.5 px-4 w-2/5">Add Value (Press Enter/Comma)</th>
                      <th className="py-3.5 px-4">Options & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {axes.map((axis) => (
                      <tr key={axis.id} className="hover:bg-neutral-50/30">
                        {/* Column 1: Selector */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col gap-2">
                            <select
                              value={PRESET_OPTION_NAMES.includes(axis.name) ? axis.name : axis.name ? 'Custom...' : ''}
                              onChange={(e) => {
                                const selected = e.target.value;
                                handleAxisNameChange(axis.id, selected === 'Custom...' ? '' : selected);
                              }}
                              className="bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-3xs w-full"
                            >
                              <option value="">-- Choose Attribute --</option>
                              {PRESET_OPTION_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            {(!PRESET_OPTION_NAMES.includes(axis.name) || axis.name === '') && (
                              <input
                                type="text"
                                placeholder="Type Custom Attribute Name..."
                                value={axis.name}
                                onChange={(e) => handleAxisNameChange(axis.id, e.target.value)}
                                className="bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-emerald-600 shadow-3xs w-full"
                              />
                            )}
                          </div>
                        </td>

                        {/* Column 2: Value Input & Tags */}
                        <td className="py-4 px-4 align-top space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. Red, XL, 100ml..."
                              value={valueInputs[axis.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                if (val.endsWith(',')) {
                                  handleAddAxisValue(axis.id, val.slice(0, -1));
                                  setValueInputs({ ...valueInputs, [axis.id]: '' });
                                } else {
                                  setValueInputs({ ...valueInputs, [axis.id]: val });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddAxisValue(axis.id, valueInputs[axis.id] || '');
                                  setValueInputs({ ...valueInputs, [axis.id]: '' });
                                }
                              }}
                              className="flex-1 bg-neutral-50 border border-neutral-250 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-800 focus:outline-none focus:bg-white focus:border-emerald-600 transition-all uppercase"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleAddAxisValue(axis.id, valueInputs[axis.id] || '');
                                setValueInputs({ ...valueInputs, [axis.id]: '' });
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
                              title="Add Value"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          </div>
                          {axis.values.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {axis.values.map(val => (
                                <span key={val.id} className="inline-flex items-center gap-1 bg-neutral-50 border border-neutral-200 px-2 py-1 rounded-md text-[11px] font-bold text-neutral-700 hover:border-neutral-350 transition-colors shadow-3xs">
                                  {val.value}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAxisValue(axis.id, val.id)}
                                    className="text-neutral-400 hover:text-rose-600 font-bold ml-1 text-xs cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Column 3: Picture Toggle & Remove Button */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center justify-between gap-4 py-1.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={axis.isImageAxis}
                                onChange={() => handleSetImageAxis(axis.id)}
                                className="w-4.5 h-4.5 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-xs font-extrabold text-neutral-700 flex items-center gap-1 hover:text-emerald-700 transition-colors">
                                <Camera className="w-3.5 h-3.5 text-neutral-400" /> Photos change by this attribute
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleRemoveAxis(axis.id)}
                              className="text-xs font-extrabold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Stack Cards */}
              <div className="block md:hidden space-y-4">
                {axes.map((axis) => (
                  <div key={axis.id} className="border border-neutral-200 rounded-2xl overflow-hidden bg-white p-4 space-y-4">
                    {/* Axis Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-xs font-bold text-neutral-700">Attribute Type</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={PRESET_OPTION_NAMES.includes(axis.name) ? axis.name : axis.name ? 'Custom...' : ''}
                            onChange={(e) => {
                              const selected = e.target.value;
                              handleAxisNameChange(axis.id, selected === 'Custom...' ? '' : selected);
                            }}
                            className="bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-3xs"
                          >
                            <option value="">-- Choose Attribute --</option>
                            {PRESET_OPTION_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                          {(!PRESET_OPTION_NAMES.includes(axis.name) || axis.name === '') && (
                            <input
                              type="text"
                              placeholder="Type Custom Attribute Name..."
                              value={axis.name}
                              onChange={(e) => handleAxisNameChange(axis.id, e.target.value)}
                              className="bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-emerald-600 shadow-3xs"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={axis.isImageAxis}
                            onChange={() => handleSetImageAxis(axis.id)}
                            className="w-4.5 h-4.5 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs font-extrabold text-neutral-700 flex items-center gap-1 hover:text-emerald-700 transition-colors">
                            <Camera className="w-3.5 h-3.5 text-neutral-400" /> Photos change by this attribute
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveAxis(axis.id)}
                          className="text-xs font-extrabold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ml-auto sm:ml-0"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Axis Body */}
                    <div className="space-y-4">
                      {/* Value Input */}
                      <div className="max-w-xl">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Add Value (Type & Press Enter or Comma)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Red, XL, 100ml, Cotton"
                            value={valueInputs[axis.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              if (val.endsWith(',')) {
                                handleAddAxisValue(axis.id, val.slice(0, -1));
                                setValueInputs({ ...valueInputs, [axis.id]: '' });
                              } else {
                                setValueInputs({ ...valueInputs, [axis.id]: val });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddAxisValue(axis.id, valueInputs[axis.id] || '');
                                setValueInputs({ ...valueInputs, [axis.id]: '' });
                              }
                            }}
                            className="flex-1 bg-neutral-50 border border-neutral-250 rounded-lg px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:bg-white focus:border-emerald-600 transition-all uppercase"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleAddAxisValue(axis.id, valueInputs[axis.id] || '');
                              setValueInputs({ ...valueInputs, [axis.id]: '' });
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
                            title="Add Value"
                          >
                            <Check className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>

                      {/* Value Chips */}
                      {axis.values.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {axis.values.map(val => (
                            <span key={val.id} className="inline-flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 hover:border-neutral-300 transition-colors shadow-2xs">
                              {val.value}
                              <button
                                type="button"
                                onClick={() => handleRemoveAxisValue(axis.id, val.id)}
                                className="text-neutral-400 hover:text-rose-600 font-bold ml-1 text-sm cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddAxis}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer"
                >
                  + Add Attribute
                </button>
              </div>

              {matrixStale && combinations.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Attributes changed — regenerate to sync the matrix. Existing prices and photos are kept.
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateMatrix}
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg shrink-0 hover:bg-amber-700 cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            {/* Step B: Matrix */}
            {combinations.length > 0 && (
              <div className="space-y-5">
                {groupedCombinations.map((group) => (
                  <div key={group.axisValue?.id || 'flat'} className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {group.axisValue && (
                      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
                        {group.axisValue.images[0] ? (
                          <img src={group.axisValue.images[0]} alt={group.axisValue.value} className="w-7 h-7 rounded-md object-cover border border-neutral-200" />
                        ) : (
                          <div className="w-7 h-7 rounded-md bg-neutral-200 flex items-center justify-center">
                            <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                          </div>
                        )}
                        <span className="text-xs font-black text-neutral-800">{imageAxis?.name}: {group.axisValue.value}</span>
                        <span className="text-[10px] font-bold text-neutral-400">
                          ({group.combos.filter(c => c.enabled).length}/{group.combos.length} active)
                        </span>
                      </div>
                    )}

                    {/* Desktop View Table */}
                    <div className="hidden md:block overflow-x-auto w-full max-w-full">
                      <table className="w-full border-collapse text-left text-xs min-w-[700px]">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                            {imageAxis && <th className="py-3 px-4">Image</th>}
                            {axes.map(axis => (
                              <th key={axis.id} className="py-3 px-4">{axis.name}</th>
                            ))}
                            <th className="py-3 px-4">MRP (₹)</th>
                            <th className="py-3 px-4">YYMEE PRICE (₹)</th>
                            <th className="py-3 px-4">Availability</th>
                            <th className="py-3 px-4">SKU</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-700">
                          {group.combos.map((combo, comboIdx) => {
                            const linkedAxisValue = imageAxis?.values.find(v => v.id === combo.imageAxisValueId);
                            return (
                              <tr key={combo.id} className={`hover:bg-neutral-50/50 ${!combo.enabled ? 'opacity-40' : ''}`}>
                                {imageAxis && comboIdx === 0 && (
                                  <td className="py-3 px-4 border-r border-neutral-100 align-middle bg-neutral-50/20" rowSpan={group.combos.length}>
                                    <div className="flex flex-col items-center gap-3 justify-center py-2 min-w-[200px]">
                                      {/* Grid of 4 slots */}
                                      <div className="grid grid-cols-2 gap-2">
                                        {[0, 1, 2, 3].map((slotIdx) => {
                                          const url = linkedAxisValue?.images[slotIdx];
                                          return (
                                            <div
                                              key={slotIdx}
                                              className={`relative w-12 h-12 rounded-lg border-2 bg-neutral-50 flex items-center justify-center group/slot transition-all ${
                                                url ? 'border-neutral-200' : 'border-dashed border-neutral-300'
                                              }`}
                                            >
                                              {url ? (
                                                <>
                                                  <div className="w-full h-full rounded-md overflow-hidden cursor-pointer" onClick={() => setActivePreviewUrl(url)}>
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                  </div>
                                                  {slotIdx === 0 && (
                                                    <div className="absolute top-0.5 left-0.5 bg-emerald-600 text-white text-[7px] font-black uppercase px-1 rounded shadow-2xs z-10 pointer-events-none">
                                                      Cover
                                                    </div>
                                                  )}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveValueImage(imageAxis.id, linkedAxisValue!.id, slotIdx)}
                                                    className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md z-20 cursor-pointer opacity-0 group-hover/slot:opacity-100 transition-opacity"
                                                    title="Remove Image"
                                                  >
                                                    <X className="w-2 h-2" strokeWidth={3} />
                                                  </button>
                                                </>
                                              ) : (
                                                linkedAxisValue && (
                                                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100 transition-colors">
                                                    <Plus className="w-4 h-4 text-neutral-400" />
                                                    <input
                                                      type="file"
                                                      accept="image/*"
                                                      multiple
                                                      disabled={uploadingVariantImages[linkedAxisValue.id]}
                                                      onClick={(e) => { e.currentTarget.value = ''; }}
                                                      onChange={(e) => handleVariantImageUpload(imageAxis.id, linkedAxisValue.id, e)}
                                                      className="hidden"
                                                    />
                                                  </label>
                                                )
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                      
                                      {linkedAxisValue && linkedAxisValue.images.length > 0 && (
                                        <label className="cursor-pointer text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1">
                                          <Camera className="w-3 h-3" />
                                          <span>Add Images</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            disabled={uploadingVariantImages[linkedAxisValue.id]}
                                            onClick={(e) => { e.currentTarget.value = ''; }}
                                            onChange={(e) => handleVariantImageUpload(imageAxis.id, linkedAxisValue.id, e)}
                                            className="hidden"
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </td>
                                )}

                                {axes.map(axis => {
                                  const isImgAxis = axis.isImageAxis;
                                  if (isImgAxis) {
                                    if (comboIdx !== 0) return null;
                                    return (
                                      <td key={axis.id} className="py-3 px-4 font-extrabold text-neutral-800 border-r border-neutral-100 align-middle bg-neutral-50/20" rowSpan={group.combos.length}>
                                        {combo.attributes[axis.name] || '-'}
                                      </td>
                                    );
                                  }
                                  return (
                                    <td key={axis.id} className="py-3 px-4 font-extrabold text-neutral-800">
                                      {combo.attributes[axis.name] || '-'}
                                    </td>
                                  );
                                })}

                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    value={combo.mrp}
                                    disabled={!combo.enabled}
                                    onChange={(e) => updateCombination(combo.id, { mrp: parseFloat(e.target.value) || 0 })}
                                    className="w-20 bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs font-bold disabled:opacity-50"
                                  />
                                </td>

                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    value={combo.price}
                                    disabled={!combo.enabled}
                                    onChange={(e) => updateCombination(combo.id, { price: parseFloat(e.target.value) || 0 })}
                                    className="w-20 bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs font-bold text-emerald-700 disabled:opacity-50"
                                  />
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={!combo.enabled}
                                      onClick={() => updateCombination(combo.id, { is_available: !combo.is_available })}
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                                        combo.is_available ? 'bg-emerald-600' : 'bg-neutral-300'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                          combo.is_available ? 'translate-x-4.5' : 'translate-x-1'
                                        }`}
                                      />
                                    </button>
                                    <span className={`text-[10px] font-bold ${combo.is_available ? 'text-emerald-700' : 'text-neutral-400'}`}>
                                      {combo.is_available ? 'Available' : 'Out'}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <input
                                    type="text"
                                    value={combo.sku}
                                    disabled={!combo.enabled}
                                    onChange={(e) => updateCombination(combo.id, { sku: e.target.value })}
                                    className="w-32 bg-neutral-50 border border-neutral-300 rounded px-2 py-1 text-xs font-mono disabled:opacity-50"
                                  />
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => deleteCombination(combo.id)}
                                    className="text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded font-bold transition-colors cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View Stack Cards */}
                    <div className="block md:hidden space-y-4 p-3">
                      {group.combos.map((combo) => {
                        const linkedAxisValue = imageAxis?.values.find(v => v.id === combo.imageAxisValueId);
                        return (
                          <div key={combo.id} className={`bg-neutral-50/50 rounded-xl p-4 border border-neutral-200 space-y-3.5 ${!combo.enabled ? 'opacity-40' : ''}`}>
                            <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                              <span className="font-extrabold text-sm text-emerald-800">
                                {Object.values(combo.attributes).join(' / ')}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteCombination(combo.id)}
                                className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>

                            {/* Images layout on mobile */}
                            {imageAxis && linkedAxisValue && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-neutral-400 block uppercase">Images ({linkedAxisValue.value})</span>
                                <div className="flex gap-2 flex-wrap">
                                  {[0, 1, 2, 3].map((slotIdx) => {
                                    const url = linkedAxisValue?.images[slotIdx];
                                    return (
                                      <div
                                        key={slotIdx}
                                        className={`relative w-12 h-12 rounded-lg border bg-white flex items-center justify-center group/slot transition-all ${
                                          url ? 'border-neutral-200' : 'border-dashed border-neutral-300'
                                        }`}
                                      >
                                        {url ? (
                                          <>
                                            <div className="w-full h-full rounded-md overflow-hidden cursor-pointer" onClick={() => setActivePreviewUrl(url)}>
                                              <img src={url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            {slotIdx === 0 && (
                                              <div className="absolute top-0.5 left-0.5 bg-emerald-600 text-white text-[7px] font-black uppercase px-1 rounded shadow-2xs z-10">
                                                Cover
                                              </div>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveValueImage(imageAxis.id, linkedAxisValue!.id, slotIdx)}
                                              className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-600 text-white rounded-full shadow-md z-20 cursor-pointer"
                                              title="Remove"
                                            >
                                              <X className="w-2 h-2" strokeWidth={3} />
                                            </button>
                                          </>
                                        ) : (
                                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                            <Plus className="w-4 h-4 text-neutral-400" />
                                            <input
                                              type="file"
                                              accept="image/*"
                                              multiple
                                              disabled={uploadingVariantImages[linkedAxisValue.id]}
                                              onClick={(e) => { e.currentTarget.value = ''; }}
                                              onChange={(e) => handleVariantImageUpload(imageAxis.id, linkedAxisValue.id, e)}
                                              className="hidden"
                                            />
                                          </label>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Inputs grid on mobile */}
                            <div className="grid grid-cols-2 gap-3.5">
                              <div>
                                <label className="text-[10px] font-bold text-neutral-500 block mb-1">MRP (₹)</label>
                                <input
                                  type="number"
                                  value={combo.mrp}
                                  disabled={!combo.enabled}
                                  onChange={(e) => updateCombination(combo.id, { mrp: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-neutral-500 block mb-1">YYMEE PRICE (₹)</label>
                                <input
                                  type="number"
                                  value={combo.price}
                                  disabled={!combo.enabled}
                                  onChange={(e) => updateCombination(combo.id, { price: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-bold text-emerald-700"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-neutral-500 block mb-1">Availability</label>
                                <div className="flex items-center gap-2.5">
                                  <button
                                    type="button"
                                    disabled={!combo.enabled}
                                    onClick={() => updateCombination(combo.id, { is_available: !combo.is_available })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                                      combo.is_available ? 'bg-emerald-600' : 'bg-neutral-300'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        combo.is_available ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                  <span className={`text-xs font-bold ${combo.is_available ? 'text-emerald-700' : 'text-neutral-400'}`}>
                                    {combo.is_available ? 'Available' : 'Out of Stock'}
                                  </span>
                                </div>
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-neutral-500 block mb-1">SKU</label>
                                <input
                                  type="text"
                                  value={combo.sku}
                                  disabled={!combo.enabled}
                                  onChange={(e) => updateCombination(combo.id, { sku: e.target.value })}
                                  className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {activePreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setActivePreviewUrl(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActivePreviewUrl(null)}
              className="absolute -top-10 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={activePreviewUrl} alt="Preview" className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};
