import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { useQuota } from '../../core/contexts/QuotaContext';
import { CategorySelect, Category } from './CategorySelect';
import {
  ProductPricingAndVariants,
  VariantAxis,
  VariantCombination,
  VariantAxisValue
} from './ProductPricingAndVariants';
import { ProductPreview } from './ProductPreview';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  Layers,
  Package,
  RotateCcw,
  Save,
  Sparkles,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

const CACHE_KEY = 'yyme_seller_add_product_draft';

// Convert any image file to WebP format via Canvas
const convertToWebP = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, 'image/webp', 0.85);
      };
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
};

const uploadImageToSupabase = async (file: File): Promise<string> => {
  const webpBlob = await convertToWebP(file);
  const fileName = `${Math.random().toString(36).substring(2, 12)}_${Date.now()}.webp`;
  const filePath = `product_pics/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, webpBlob, {
      contentType: 'image/webp',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const COMMON_MATERIALS = [
  'Pure Handloom Cotton',
  'Mulmul Cotton',
  'Khadi Silk',
  'Tussar Silk',
  'Terracotta Clay',
  'Brass / Bronze',
  'Teak Wood',
  'Rosewood',
  'Bamboo & Cane',
  'Natural Jute',
  'Handmade Ceramic',
  'Pure Linen',
  'Natural Clay',
  'Vegetable Tanned Leather',
  'Recycled Glass',
  'Copper'
];

export function AddProductPage() {
  const navigate = useNavigate();
  const { sellerProfile } = useSellerAuth();
  const { isListingFull, listingsRemaining, refresh } = useQuota();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Restore draft from localStorage if available
  const getInitialState = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
    return null;
  };

  const cache = getInitialState();

  // Wizard Step (1: Category, 2: Basic Info, 3: Pricing & Variants, 4: Review & Publish)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(cache?.step || 1);

  // Categories
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(cache?.searchQuery || '');
  const [selectedL1, setSelectedL1] = useState<string | null>(cache?.selectedL1 || null);
  const [selectedL2, setSelectedL2] = useState<string | null>(cache?.selectedL2 || null);
  const [selectedL3, setSelectedL3] = useState<Category | null>(cache?.selectedL3 || null);

  // Step 2: Basic Info
  const [name, setName] = useState(cache?.name || '');
  const [description, setDescription] = useState(cache?.description || '');
  const [material, setMaterial] = useState(cache?.material || '');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  // Step 3: Single Product Pricing & Details
  const [mrp, setMrp] = useState(cache?.mrp || '799');
  const [basePrice, setBasePrice] = useState(cache?.basePrice || '499');
  const [isAvailable, setIsAvailable] = useState<boolean>(cache?.isAvailable ?? true);
  const [productStatus, setProductStatus] = useState<'active' | 'inactive'>(cache?.productStatus || 'active');
  const [moq, setMoq] = useState(cache?.moq || '1');

  // Single Product Images
  const [imageUrls, setImageUrls] = useState<string[]>(cache?.imageUrls || []);
  const [coverImageIndex, setCoverImageIndex] = useState(cache?.coverImageIndex || 0);
  const [localSingleFiles, setLocalSingleFiles] = useState<File[]>([]);
  const [uploadingSingleImages, setUploadingSingleImages] = useState(false);

  // Step 3: Variants
  const [hasVariants, setHasVariants] = useState(cache?.hasVariants || false);
  const [axes, setAxes] = useState<VariantAxis[]>(cache?.axes || []);
  const [valueInputs, setValueInputs] = useState<{ [axisId: string]: string }>({});
  const [combinations, setCombinations] = useState<VariantCombination[]>(cache?.combinations || []);
  const [matrixStale, setMatrixStale] = useState(false);
  const [localVariantFiles, setLocalVariantFiles] = useState<{ [valId: string]: File[] }>({});
  const [uploadingVariantImages, setUploadingVariantImages] = useState<{ [valId: string]: boolean }>({});

  // Bulk Variant Edits
  const [bulkMrp, setBulkMrp] = useState(cache?.bulkMrp || '');
  const [bulkPrice, setBulkPrice] = useState(cache?.bulkPrice || '');
  const [bulkAvailability, setBulkAvailability] = useState<string>(cache?.bulkAvailability || '');

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
      } else if (data) {
        setAllCategories(data as Category[]);
      }
    }
    fetchCategories();
  }, []);

  // Persist draft to localStorage on state changes
  useEffect(() => {
    try {
      const draft = {
        step,
        selectedL1,
        selectedL2,
        selectedL3,
        searchQuery,
        name,
        description,
        material,
        mrp,
        basePrice,
        isAvailable,
        productStatus,
        moq,
        imageUrls: imageUrls.filter(u => !u.startsWith('blob:')),
        coverImageIndex,
        hasVariants,
        axes: axes.map(a => ({
          ...a,
          values: a.values.map(v => ({
            ...v,
            images: v.images.filter(img => !img.startsWith('blob:'))
          }))
        })),
        combinations,
        bulkMrp,
        bulkPrice,
        bulkAvailability
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }, [
    step, selectedL1, selectedL2, selectedL3, searchQuery,
    name, description, material, mrp, basePrice,
    isAvailable, moq, imageUrls, coverImageIndex, hasVariants,
    axes, combinations, bulkMrp, bulkPrice, bulkAvailability
  ]);

  const clearDraft = () => {
    localStorage.removeItem(CACHE_KEY);
    setStep(1);
    setSelectedL1(null);
    setSelectedL2(null);
    setSelectedL3(null);
    setSearchQuery('');
    setName('');
    setDescription('');
    setMaterial('');
    setMrp('799');
    setBasePrice('499');
    setIsAvailable(true);
    setMoq('1');
    setImageUrls([]);
    setCoverImageIndex(0);
    setLocalSingleFiles([]);
    setHasVariants(false);
    setAxes([]);
    setCombinations([]);
    setLocalVariantFiles({});
    setErrorMsg('');
  };

  // Single Image Upload Handler
  const handleSingleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setErrorMsg('');
    const newUrls: string[] = [];
    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newUrls.push(URL.createObjectURL(file));
      newFiles.push(file);
    }
    setImageUrls([...imageUrls, ...newUrls]);
    setLocalSingleFiles([...localSingleFiles, ...newFiles]);
  };

  const handleRemoveImageUrl = (index: number) => {
    const updatedUrls = imageUrls.filter((_, idx) => idx !== index);
    const updatedFiles = localSingleFiles.filter((_, idx) => idx !== index);
    setImageUrls(updatedUrls);
    setLocalSingleFiles(updatedFiles);
    if (coverImageIndex >= updatedUrls.length) {
      setCoverImageIndex(Math.max(0, updatedUrls.length - 1));
    }
  };

  // Variant Axis Handlers
  const handleAddAxis = () => {
    const newAxis: VariantAxis = {
      id: `AXIS-${genId()}`,
      name: '',
      isImageAxis: axes.length === 0,
      values: []
    };
    setAxes([...axes, newAxis]);
    setMatrixStale(true);
  };

  const handleAxisNameChange = (axisId: string, newName: string) => {
    setAxes(axes.map(a => a.id === axisId ? { ...a, name: newName } : a));
    setMatrixStale(true);
  };

  const handleRemoveAxis = (axisId: string) => {
    const remaining = axes.filter(a => a.id !== axisId);
    if (remaining.length > 0 && !remaining.some(a => a.isImageAxis)) {
      remaining[0].isImageAxis = true;
    }
    setAxes(remaining);
    setMatrixStale(true);
  };

  const handleSetImageAxis = (axisId: string) => {
    setAxes(axes.map(a => ({ ...a, isImageAxis: a.id === axisId })));
  };

  const handleAddAxisValue = (axisId: string, raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setAxes(axes.map(a => {
      if (a.id !== axisId) return a;
      if (a.values.some(v => v.value.toLowerCase() === trimmed.toLowerCase())) return a;
      return {
        ...a,
        values: [...a.values, { id: `VAL-${genId()}`, value: trimmed, images: [] }]
      };
    }));
    setValueInputs({ ...valueInputs, [axisId]: '' });
    setMatrixStale(true);
  };

  const handleRemoveAxisValue = (axisId: string, valueId: string) => {
    setAxes(axes.map(a => a.id === axisId ? { ...a, values: a.values.filter(v => v.id !== valueId) } : a));
    setMatrixStale(true);
  };

  const handleVariantImageUpload = (axisId: string, valueId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newUrls: string[] = [];
    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newUrls.push(URL.createObjectURL(file));
      newFiles.push(file);
    }

    setAxes(axes.map(a => a.id === axisId
      ? { ...a, values: a.values.map(v => v.id === valueId ? { ...v, images: [...v.images, ...newUrls] } : v) }
      : a));

    setLocalVariantFiles(prev => ({
      ...prev,
      [valueId]: [...(prev[valueId] || []), ...newFiles]
    }));
  };

  const handleRemoveValueImage = (axisId: string, valueId: string, imgIdx: number) => {
    setAxes(axes.map(a => a.id === axisId
      ? { ...a, values: a.values.map(v => v.id === valueId ? { ...v, images: v.images.filter((_, idx) => idx !== imgIdx) } : v) }
      : a));
  };

  // Cartesian Product Matrix Generator
  const handleGenerateMatrix = () => {
    const activeAxes = axes.filter(a => a.name.trim() !== '' && a.values.length > 0);
    if (activeAxes.length === 0) {
      setCombinations([]);
      setMatrixStale(false);
      return;
    }

    const cartesian = (arrays: VariantAxisValue[][]): VariantAxisValue[][] =>
      arrays.reduce<VariantAxisValue[][]>((acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])), [[]]);

    const rawCombos = cartesian(activeAxes.map(a => a.values));
    const imageAxis = activeAxes.find(a => a.isImageAxis);
    const imageAxisIndex = imageAxis ? activeAxes.indexOf(imageAxis) : -1;

    const defaultMrp = parseFloat(bulkMrp) || parseFloat(mrp) || 0;
    const defaultPrice = parseFloat(bulkPrice) || parseFloat(basePrice) || 0;
    const defaultAvailable = bulkAvailability === 'out_of_stock' ? false : true;

    setCombinations(prevCombinations => {
      const generated: VariantCombination[] = rawCombos.map(comboValues => {
        const attributes: { [key: string]: string } = {};
        activeAxes.forEach((axis, i) => { attributes[axis.name] = comboValues[i].value; });

        const existing = prevCombinations.find(
          c => JSON.stringify(c.attributes) === JSON.stringify(attributes)
        );
        const imageAxisValueId = imageAxisIndex >= 0 ? comboValues[imageAxisIndex].id : null;

        if (existing) {
          return { ...existing, imageAxisValueId };
        }

        const skuCode = comboValues.map(v => v.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)).join('-');
        return {
          id: `VAR-${genId()}`,
          attributes,
          imageAxisValueId,
          mrp: defaultMrp,
          price: defaultPrice,
          is_available: defaultAvailable,
          stock_quantity: defaultAvailable ? 999 : 0,
          weight: null,
          sku: `SKU-${skuCode}`,
          enabled: true,
        };
      });
      return generated;
    });

    setMatrixStale(false);
  };

  // Automatically trigger matrix generation on axes change like in reference project
  useEffect(() => {
    handleGenerateMatrix();
  }, [axes]);

  // Apply Bulk Edits
  const handleApplyBulkEdits = () => {
    setCombinations(combinations.map(c => c.enabled ? {
      ...c,
      mrp: bulkMrp !== '' ? (parseFloat(bulkMrp) || c.mrp) : c.mrp,
      price: bulkPrice !== '' ? (parseFloat(bulkPrice) || c.price) : c.price,
      is_available: bulkAvailability === 'available' ? true : bulkAvailability === 'out_of_stock' ? false : (c.is_available ?? true),
      stock_quantity: bulkAvailability === 'available' ? 999 : bulkAvailability === 'out_of_stock' ? 0 : (c.stock_quantity ?? 999),
    } : c));
  };

  const updateCombination = (id: string, patch: Partial<VariantCombination>) => {
    setCombinations(combinations.map(c => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteCombination = (id: string) => {
    setCombinations(combinations.filter(c => c.id !== id));
  };

  const getCategoryBreadcrumb = () => {
    if (!selectedL3) return 'Not Selected';
    const l2 = allCategories.find(c => c.category_id === selectedL3.parent_category_id);
    const l1 = l2 ? allCategories.find(c => c.category_id === l2.parent_category_id) : null;
    return [l1?.name, l2?.name, selectedL3.name].filter(Boolean).join(' > ');
  };

  const imageAxis = axes.find(a => a.isImageAxis);
  const enabledCombinations = combinations.filter(c => c.enabled);

  // Validation per step
  const isStepValid = () => {
    if (step === 1) return selectedL3 !== null;
    if (step === 2) {
      return name.trim().length >= 3 && description.trim().length >= 10 && material.trim() !== '';
    }
    if (step === 3) {
      if (!hasVariants) {
        const p = parseFloat(basePrice);
        const m = parseFloat(mrp);
        const mQ = parseInt(moq);
        return imageUrls.length >= 2 && !isNaN(p) && p > 0 && !isNaN(m) && m > 0 && p <= m && !isNaN(mQ) && mQ >= 1;
      } else {
        if (enabledCombinations.length === 0) return false;
        const activeAxes = axes.filter(a => a.name.trim() !== '' && a.values.length > 0);
        if (activeAxes.length === 0 || activeAxes.length !== axes.length) return false;
        const allCombosValid = enabledCombinations.every(c =>
          c.mrp > 0 && c.price > 0 && c.price <= c.mrp && c.sku.trim() !== ''
        );
        return allCombosValid;
      }
    }
    return true;
  };

  // Final Save & Publish
  const handleFinalSave = async () => {
    if (!sellerProfile) {
      setErrorMsg('Seller profile not found. Please log in again.');
      return;
    }
    if (isListingFull) {
      setErrorMsg('Listing quota reached. Upgrade your subscription to add more products.');
      return;
    }
    if (!selectedL3) {
      setErrorMsg('Please select a category first.');
      setStep(1);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Upload single product images to Supabase storage
      const finalImageUrls: string[] = [];
      for (const file of localSingleFiles) {
        const url = await uploadImageToSupabase(file);
        finalImageUrls.push(url);
      }

      // Add pre-existing uploaded URLs (excluding blobs)
      imageUrls.forEach(url => {
        if (!url.startsWith('blob:') && !finalImageUrls.includes(url)) {
          finalImageUrls.push(url);
        }
      });

      // Ensure cover image is first in the array
      const reorderedImages = [...finalImageUrls];
      if (coverImageIndex > 0 && coverImageIndex < reorderedImages.length) {
        const cover = reorderedImages.splice(coverImageIndex, 1)[0];
        reorderedImages.unshift(cover);
      }

      // 2. Upload variant photos if variants exist
      const resolvedVariantImages: { [valId: string]: string[] } = {};
      for (const [valId, files] of Object.entries(localVariantFiles)) {
        const urls: string[] = [];
        for (const file of files) {
          const url = await uploadImageToSupabase(file);
          urls.push(url);
        }
        resolvedVariantImages[valId] = urls;
      }

      axes.forEach(axis => {
        if (axis.isImageAxis) {
          axis.values.forEach(v => {
            const uploadedUrls = v.images.filter(img => !img.startsWith('blob:'));
            resolvedVariantImages[v.id] = [
              ...(resolvedVariantImages[v.id] || []),
              ...uploadedUrls
            ];
          });
        }
      });

      // 3. Compute aggregate values for products row
      const priceVal = hasVariants
        ? (enabledCombinations.length > 0 ? Math.min(...enabledCombinations.map(c => c.price)) : 0)
        : parseFloat(basePrice);
      const mrpVal = hasVariants
        ? (enabledCombinations.length > 0 ? Math.min(...enabledCombinations.map(c => c.mrp)) : 0)
        : parseFloat(mrp);
      const isProductAvailable = hasVariants
        ? enabledCombinations.some(c => c.is_available)
        : isAvailable;
      const stockVal = isProductAvailable ? 999 : 0;

      // 4. Insert into public.products with qc_status ('submitted') and status ('active' | 'inactive')
      const productPayload: any = {
        seller_id: sellerProfile.seller_id,
        category_id: selectedL3.category_id,
        name: name.trim(),
        description: description.trim() || null,
        material: material.trim() || null,
        weight_kg: 0.5,
        moq: parseInt(moq) || 1,
        base_price: priceVal,
        mrp: mrpVal,
        stock_quantity: stockVal,
        have_variants: hasVariants,
        image_urls: reorderedImages,
        is_active: productStatus === 'active' && isProductAvailable,
        qc_status: 'submitted',
        status: productStatus
      };

      let { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([productPayload])
        .select('product_id')
        .single();

      // Graceful fallback if columns are not yet added to remote database
      if (productError && (productError.message?.includes('qc_status') || productError.message?.includes('status'))) {
        console.warn('Database missing qc_status or status column. Retrying insert without them.');
        const fallbackPayload = { ...productPayload };
        delete fallbackPayload.qc_status;
        delete fallbackPayload.status;
        const retryRes = await supabase
          .from('products')
          .insert([fallbackPayload])
          .select('product_id')
          .single();
        newProduct = retryRes.data;
        productError = retryRes.error;
      }

      if (productError || !newProduct) {
        throw productError || new Error('Failed to create product listing.');
      }

      // 5. Insert variants into public.product_variants if enabled
      if (hasVariants && enabledCombinations.length > 0) {
        const variantRows = enabledCombinations.map(combo => {
          const linkedAxisValue = imageAxis?.values.find(v => v.id === combo.imageAxisValueId);
          const customImages = linkedAxisValue ? (resolvedVariantImages[linkedAxisValue.id] || []) : [];
          const variantImages = customImages.length ? customImages : reorderedImages;

          return {
            product_id: newProduct.product_id,
            variant_type: Object.keys(combo.attributes).join(' / '),
            variant_value: Object.values(combo.attributes).join(' / '),
            sku: combo.sku || null,
            selling_price: combo.price,
            mrp: combo.mrp || 0,
            stock_quantity: combo.is_available ? 999 : 0,
            weight_override: null,
            image_urls: variantImages.filter(url => url.trim() !== '')
          };
        });

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantRows);

        if (variantError) {
          console.error('Variant insertion error:', variantError);
        }
      }

      // 6. Increment seller's used listing quota
      try {
        await supabase.rpc('increment_listing_count', { sid: sellerProfile.seller_id });
      } catch (e) {
        // Fallback directly on sellers table
        await supabase
          .from('sellers')
          .update({ used_listing_count: (sellerProfile.used_listing_count || 0) + 1 })
          .eq('seller_id', sellerProfile.seller_id);
      }

      refresh();
      clearDraft();
      navigate('/products');
    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMsg(err.message || 'Failed to publish product. Please check your inputs and try again.');
    } finally {
      setLoading(false);
      setShowPreview(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Category', subtitle: 'Choose category' },
    { num: 2, title: 'Basic Info', subtitle: 'Title & description' },
    { num: 3, title: 'Pricing & Photos', subtitle: 'Rates, stock & gallery' },
    { num: 4, title: 'Review & Publish', subtitle: 'Preview & launch' },
  ];

  const filteredMaterials = COMMON_MATERIALS.filter(m =>
    m.toLowerCase().includes(material.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/products"
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-neutral-900">Add New Product</h1>
          </div>
          <p className="text-xs text-neutral-500 pl-7">
            {listingsRemaining} listing slot{listingsRemaining === 1 ? '' : 's'} remaining on your plan
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={clearDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Clear all inputs and reset draft"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Draft</span>
          </button>
        </div>
      </div>

      {/* Quota warning */}
      {isListingFull && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900">Listing Quota Reached</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              You have used all listing slots allocated to your current subscription tier.
              <Link to="/subscription" className="font-bold underline ml-1 text-amber-900">
                Upgrade your subscription plan
              </Link> to publish more products.
            </p>
          </div>
        </div>
      )}

      {/* Wizard Step Progress Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-2xs">
        <div className="grid grid-cols-4 gap-2">
          {stepsList.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  // Only allow jumping back or to next step if valid
                  if (s.num < step || (s.num === step + 1 && isStepValid())) {
                    setStep(s.num as any);
                  }
                }}
                disabled={s.num > step + 1}
                className={`text-left p-2.5 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-emerald-50 border border-emerald-300 ring-2 ring-emerald-500/20'
                    : isCompleted
                    ? 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                  </div>
                  <div className="truncate hidden sm:block">
                    <span className="block text-xs font-bold text-neutral-900 leading-tight truncate">
                      {s.title}
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-medium truncate">
                      {s.subtitle}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message Box */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-rose-900">Validation Notice</h4>
            <p className="text-xs text-rose-700 mt-0.5 font-medium">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-rose-400 hover:text-rose-600 text-sm font-black p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="space-y-6">
        {/* STEP 1: CATEGORY SELECT */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 md:p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-base">Select Product Category</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Categorizing your handcrafted product accurately ensures optimal buyer discovery and placement.
              </p>
            </div>

            {selectedL3 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">
                    Selected Leaf Category
                  </span>
                  <span className="text-xs font-black text-emerald-900">
                    {getCategoryBreadcrumb()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedL3(null)}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            <CategorySelect
              allCategories={allCategories}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedL1={selectedL1}
              setSelectedL1={setSelectedL1}
              selectedL2={selectedL2}
              setSelectedL2={setSelectedL2}
              onSelectL3={(cat) => {
                setSelectedL3(cat);
                setErrorMsg('');
              }}
            />
          </div>
        )}

        {/* STEP 2: BASIC INFO */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 md:p-6 shadow-2xs space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-base">Basic Product Information</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Category: <span className="font-bold text-emerald-700">{getCategoryBreadcrumb()}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-800 underline cursor-pointer"
              >
                Change Category
              </button>
            </div>

            <div className="space-y-5">
              {/* Product Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 block">
                  Product Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Handcrafted Terracotta Tea Cup Set of 6"
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                />
                <span className="text-[10px] text-neutral-400 font-medium block">
                  Keep titles clear and descriptive. Minimum 3 characters.
                </span>
              </div>

              {/* Product Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 block">
                  Detailed Description & Specifications <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Highlight key crafting techniques, dimensions, care instructions, origin, and artisan story..."
                  className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium leading-relaxed"
                />
                <span className="text-[10px] text-neutral-400 font-medium block">
                  Minimum 10 characters. Bullet points and dimensions are highly recommended.
                </span>
              </div>

              {/* Material / Fabric with Dropdown */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-neutral-700 block">
                  Material / Base Fabric <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={material}
                    onFocus={() => setShowMaterialDropdown(true)}
                    onBlur={() => setTimeout(() => setShowMaterialDropdown(false), 200)}
                    onChange={(e) => {
                      setMaterial(e.target.value);
                      setShowMaterialDropdown(true);
                    }}
                    placeholder="e.g. Pure Handloom Cotton, Terracotta Clay, Brass, Teak Wood"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 transition-transform ${showMaterialDropdown ? 'rotate-180' : ''}`} />
                </div>
                {showMaterialDropdown && filteredMaterials.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-neutral-50 animate-in fade-in duration-200">
                    {filteredMaterials.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setMaterial(m);
                          setShowMaterialDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        {m}
                        {material === m && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-[10px] text-neutral-400 font-medium block">
                  Select a common artisanal material or type custom specifications.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PRICING, IMAGES & VARIANTS */}
        {step === 3 && (
          <ProductPricingAndVariants
            mrp={mrp} setMrp={setMrp}
            basePrice={basePrice} setBasePrice={setBasePrice}
            isAvailable={isAvailable} setIsAvailable={setIsAvailable}
            moq={moq} setMoq={setMoq}
            imageUrls={imageUrls}
            coverImageIndex={coverImageIndex} setCoverImageIndex={setCoverImageIndex}
            uploadingSingleImages={uploadingSingleImages}
            handleSingleImageUpload={handleSingleImageUpload}
            handleRemoveImageUrl={handleRemoveImageUrl}
            hasVariants={hasVariants} setHasVariants={setHasVariants}
            axes={axes} setAxes={setAxes}
            valueInputs={valueInputs} setValueInputs={setValueInputs}
            combinations={combinations} setCombinations={setCombinations}
            matrixStale={matrixStale}
            handleGenerateMatrix={handleGenerateMatrix}
            handleAddAxis={handleAddAxis}
            handleAxisNameChange={handleAxisNameChange}
            handleRemoveAxis={handleRemoveAxis}
            handleSetImageAxis={handleSetImageAxis}
            handleAddAxisValue={handleAddAxisValue}
            handleRemoveAxisValue={handleRemoveAxisValue}
            handleVariantImageUpload={handleVariantImageUpload}
            handleRemoveValueImage={handleRemoveValueImage}
            uploadingVariantImages={uploadingVariantImages}
            updateCombination={updateCombination}
            deleteCombination={deleteCombination}
          />
        )}

        {/* STEP 4: REVIEW & PUBLISH */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 md:p-6 shadow-2xs space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-base">Review & Final Confirmation</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Confirm product specifications and pricing before making it live.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-black transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Full Catalog Preview</span>
              </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Category</span>
                <span className="text-xs font-bold text-neutral-900 block truncate">{getCategoryBreadcrumb()}</span>
              </div>
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Title & Material</span>
                <span className="text-xs font-bold text-neutral-900 block truncate">{name}</span>
                <span className="text-[11px] text-neutral-500 block truncate">{material || 'Not Specified'}</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Pricing & Availability</span>
                {!hasVariants ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-emerald-900">₹{basePrice}</span>
                    <span className="text-xs text-neutral-400 line-through">₹{mrp}</span>
                    <span className={`text-[10px] font-bold ${isAvailable ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ({isAvailable ? 'Available' : 'Out of Stock'})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-black text-emerald-900 block">
                    {enabledCombinations.length} Active Variant Combinations
                  </span>
                )}
              </div>
            </div>

            {/* Product Summary Specs */}
            <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                <span className="font-bold text-neutral-600">Product Mode</span>
                <span className="font-extrabold text-neutral-900">{hasVariants ? 'Multi-Variant SKU Matrix' : 'Single Product Listing'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                <span className="font-bold text-neutral-600">Minimum Order Quantity (MOQ)</span>
                <span className="font-extrabold text-neutral-900">{moq} unit{parseInt(moq) > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-600">Photo Assets</span>
                <span className="font-extrabold text-neutral-900">
                  {hasVariants
                    ? `${axes.reduce((sum, a) => sum + a.values.reduce((vSum, v) => vSum + v.images.length, 0), 0)} Variant Photos`
                    : `${imageUrls.length} Product Photos`}
                </span>
              </div>
            </div>

            {/* QC Status & Common Listing Status Section */}
            <div className="border border-neutral-200 rounded-xl p-4 bg-white space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">Product Status</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      productStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}>
                      {productStatus === 'active' ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Choose whether this listing is active in your inventory or kept as an inactive draft.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setProductStatus('active')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      productStatus === 'active'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductStatus('inactive')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      productStatus === 'inactive'
                        ? 'bg-neutral-700 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* QC Status Notice */}
              <div className="flex items-start gap-3 bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-950">Quality Check Verification</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 rounded">
                      QC Status: Submitted
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1">
                    When you save this product, its initial QC status is automatically marked as <strong>submitted</strong>. Platform admins review submissions to grant <strong>verified</strong> status or request updates if <strong>rejected</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Publish Banner */}
            <div className={`border rounded-xl p-4 flex items-center justify-between gap-4 ${
              productStatus === 'active' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 text-white rounded-xl shadow-2xs ${
                  productStatus === 'active' ? 'bg-emerald-600' : 'bg-neutral-600'
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-950">
                    {productStatus === 'active' ? 'Ready to Submit & Activate' : 'Ready to Submit as Inactive'}
                  </h4>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    {productStatus === 'active'
                      ? 'Product will be added with Active status and submitted for admin QC review.'
                      : 'Product will be added with Inactive status and submitted for admin QC review.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={loading || isListingFull}
                onClick={handleFinalSave}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Publish Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => {
            if (step > 1) setStep((step - 1) as any);
            else navigate('/products');
          }}
          className="flex items-center gap-2 px-5 py-2.5 border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? 'Cancel & Back' : 'Previous Step'}</span>
        </button>

        {step < 4 ? (
          <button
            type="button"
            disabled={!isStepValid()}
            onClick={() => {
              if (isStepValid()) {
                setErrorMsg('');
                setStep((step + 1) as any);
              } else {
                if (step === 1) setErrorMsg('Please select a category to continue.');
                else if (step === 2) setErrorMsg('Please enter a valid title (3+ chars), description (10+ chars), and material.');
                else if (step === 3) {
                  if (!hasVariants) {
                    setErrorMsg('Please upload at least 2 images and ensure price, MRP, and MOQ are valid.');
                  } else {
                    setErrorMsg('Please generate combinations and ensure all enabled variants have valid pricing and SKU.');
                  }
                }
              }
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || isListingFull}
            onClick={handleFinalSave}
            className="flex items-center gap-2 px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing Product...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Confirm & Publish</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Catalog Preview Modal */}
      {showPreview && (
        <ProductPreview
          onClose={() => setShowPreview(false)}
          onConfirm={handleFinalSave}
          name={name}
          description={description}
          material={material}
          getCategoryBreadcrumb={getCategoryBreadcrumb}
          hasVariants={hasVariants}
          mrp={mrp}
          basePrice={basePrice}
          isAvailable={isAvailable}
          moq={moq}
          imageUrls={imageUrls}
          coverImageIndex={coverImageIndex}
          enabledCombinations={enabledCombinations}
          imageAxis={imageAxis}
        />
      )}
    </div>
  );
}
