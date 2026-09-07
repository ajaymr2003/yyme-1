import React, { useState, useEffect } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { QCProduct, QCVariant } from '../../core/types';
import { Search, Image as ImageIcon, ChevronDown, ChevronUp, RefreshCw, ClipboardCheck, Eye } from 'lucide-react';

export function QcPending() {
  const [products, setProducts] = useState<QCProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'pending' | 'rejected'>('pending');
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusFilter = currentTab === 'pending' ? 'submitted' : 'rejected';
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (name),
          sellers:seller_id (business_name, owner_name)
        `)
        .eq('qc_status', statusFilter);

      if (productsError) throw productsError;

      if (productsData && productsData.length > 0) {
        const productIds = productsData.map((p: any) => p.product_id);

        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*')
          .in('product_id', productIds);

        const productVariantsMap = new Map<string, QCVariant[]>();
        if (variantsData) {
          variantsData.forEach((v: any) => {
            const list = productVariantsMap.get(v.product_id) || [];
            list.push(v);
            productVariantsMap.set(v.product_id, list);
          });
        }

        const mappedProducts = productsData.map((p: any) => {
          const pVariants = productVariantsMap.get(p.product_id) || [];

          const pVariantsSorted = [...pVariants].sort((a: any, b: any) => {
            const partA = a.variant_value.split(' / ')[0]?.trim() || '';
            const partB = b.variant_value.split(' / ')[0]?.trim() || '';
            return partA.localeCompare(partB);
          });

          let coverImage = p.image_urls && p.image_urls.length > 0 ? p.image_urls[0] : null;
          if (!coverImage && pVariantsSorted.length > 0) {
            const variantWithImage = pVariantsSorted.find((v: any) => v.image_urls && v.image_urls.length > 0);
            if (variantWithImage) coverImage = variantWithImage.image_urls[0];
          }

          let minPrice = p.base_price;
          let maxPrice = p.base_price;
          let minMrp = 0;
          let maxMrp = 0;
          if (pVariantsSorted.length > 0) {
            const prices = pVariantsSorted.map((v: any) => v.selling_price).filter((pr: any) => pr !== null && pr !== undefined);
            if (prices.length > 0) {
              minPrice = Math.min(...prices);
              maxPrice = Math.max(...prices);
            }
            const mrps = pVariantsSorted.map((v: any) => v.mrp).filter((m: any) => m !== null && m !== undefined);
            if (mrps.length > 0) {
              minMrp = Math.min(...mrps);
              maxMrp = Math.max(...mrps);
            }
          }

          const totalStock = pVariantsSorted.length > 0
            ? pVariantsSorted.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0)
            : p.stock_quantity;

          return {
            ...p,
            cover_image: coverImage,
            variants: pVariantsSorted,
            minPrice,
            maxPrice,
            minMrp,
            maxMrp,
            totalStock,
          };
        });

        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentTab]);

  const toggleExpand = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sellers?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedProductId) {
    return (
      <QcDetailView
        productId={selectedProductId}
        onBack={() => {
          setSelectedProductId(null);
          fetchProducts();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              {currentTab === 'pending' ? 'QC Pending Review' : 'Rejected Products'}
            </h1>
            <p className="text-neutral-500 text-sm mt-0.5">
              {currentTab === 'pending'
                ? 'Review and approve or reject seller product submissions.'
                : 'Products that have been rejected during QC.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            {products.length} {currentTab === 'pending' ? 'Pending' : 'Rejected'}
          </span>
          <button onClick={fetchProducts}
            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"
            title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-200">
        {(['pending', 'rejected'] as const).map((tab) => (
          <button key={tab} onClick={() => setCurrentTab(tab)}
            className={`pb-2 px-4 text-sm font-bold transition-all relative ${
              currentTab === tab ? 'text-emerald-600' : 'text-neutral-500 hover:text-neutral-900'
            }`}>
            {tab === 'pending' ? 'Pending' : 'Rejected'} Products
            {currentTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search by product name, seller, or ID..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-500">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
            Loading pending products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <ClipboardCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">All caught up!</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
              There are no products awaiting QC review right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Seller</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Submitted On</th>
                  <th className="px-6 py-4 text-center">Review</th>
                  <th className="px-6 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm text-neutral-900">
                {filteredProducts.map((p) => {
                  const isExpanded = !!expandedProducts[p.product_id];

                  const parentPrice = p.minPrice !== p.maxPrice
                    ? `\u20B9${p.minPrice} - \u20B9${p.maxPrice}`
                    : `\u20B9${p.minPrice}`;

                  const parentMrp = p.minMrp !== p.maxMrp
                    ? `\u20B9${p.minMrp} - \u20B9${p.maxMrp}`
                    : `\u20B9${p.minMrp}`;

                  return (
                    <React.Fragment key={p.product_id}>
                      <tr onClick={() => setSelectedProductId(p.product_id)}
                        className="hover:bg-amber-50/30 transition duration-150 cursor-pointer">
                        <td className="px-6 py-4 font-semibold">
                          <div className="flex items-center gap-3">
                            {p.cover_image ? (
                              <img src={p.cover_image} alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4 text-neutral-400" />
                              </div>
                            )}
                            <div>
                              <span className="block font-bold">{p.name}</span>
                              <span className="block font-mono text-[9px] text-neutral-400 mt-0.5">{p.product_id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="block font-semibold text-neutral-900 text-xs">{p.sellers?.business_name || 'N/A'}</span>
                            <span className="block text-[10px] text-neutral-500 mt-0.5">{p.sellers?.owner_name || ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-neutral-500">
                          {p.categories?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{parentPrice}</span>
                            {p.minMrp > 0 && p.minMrp > p.minPrice && (
                              <span className="text-[10px] text-neutral-400 line-through font-normal mt-0.5">
                                MRP: {parentMrp}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-neutral-500">
                          {p.totalStock} units
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-500 font-medium">
                          {new Date(p.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedProductId(p.product_id); }}
                            className="p-2 hover:bg-amber-100 rounded-lg text-amber-600 transition duration-150"
                            title="Review Product">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {p.variants && p.variants.length > 0 ? (
                            <button onClick={(e) => toggleExpand(p.product_id, e)}
                              className="p-1 hover:bg-neutral-100 rounded transition-colors text-neutral-400 hover:text-neutral-600"
                              title="Toggle Variants">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          ) : null}
                        </td>
                      </tr>

                      {isExpanded && p.variants && p.variants.length > 0 && (
                        p.variants.map((v: QCVariant) => {
                          const variantImage = v.image_urls && v.image_urls.length > 0 ? v.image_urls[0] : null;
                          return (
                            <tr key={v.variant_id}
                              className="bg-neutral-50/40 border-b border-neutral-200 hover:bg-neutral-100/30 transition-colors text-xs">
                              <td className="py-3 pl-14 pr-6 font-semibold text-neutral-700">
                                <div className="flex items-center gap-3">
                                  {variantImage ? (
                                    <img src={variantImage} alt={`${v.variant_type} ${v.variant_value}`}
                                      className="w-7 h-7 rounded object-cover border border-neutral-200 shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                                      <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-semibold text-neutral-700">{v.variant_type}: {v.variant_value}</span>
                                    <span className="block font-mono text-[9px] text-neutral-400 mt-0.5">{v.sku}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-6 text-neutral-500 font-medium italic">Variant</td>
                              <td className="py-3 px-6 text-neutral-500 font-medium italic">\u2014</td>
                              <td className="py-3 px-6">
                                <div className="flex flex-col">
                                  <span className="font-bold text-neutral-700">\u20B9{v.selling_price}</span>
                                  {v.mrp && v.mrp > v.selling_price && (
                                    <span className="text-[9px] text-neutral-400 line-through font-normal mt-0.5">
                                      MRP: \u20B9{v.mrp}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-6 font-semibold text-neutral-600">{v.stock_quantity} units</td>
                              <td className="py-3 px-6"></td>
                              <td className="py-3 px-6 text-center"></td>
                              <td className="py-3 px-6"></td>
                            </tr>
                          );
                        })
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Detail View (inline, no separate file needed)
// ==========================================
function QcDetailView({ productId, onBack }: { productId: string; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<QCVariant[]>([]);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: prod, error: prodErr } = await supabase
          .from('products')
          .select('*, categories:category_id (name), sellers:seller_id (business_name, owner_name)')
          .eq('product_id', productId)
          .single();
        if (prodErr || !prod) throw new Error('Product not found.');
        setProduct(prod);

        const { data: varData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId);

        const sorted = (varData || []).sort((a: any, b: any) => {
          const partA = a.variant_value.split(' / ')[0]?.trim() || '';
          const partB = b.variant_value.split(' / ')[0]?.trim() || '';
          return partA.localeCompare(partB);
        });
        setVariants(sorted);
      } catch (err: any) {
        setError(err.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  const handleApprove = async () => {
    setShowApproveConfirm(false);
    setActionLoading(true);
    setError('');
    try {
      const adminId = (await supabase.auth.getUser()).data.user?.id;
      const { error: updateErr } = await supabase
        .from('products')
        .update({
          qc_status: 'verified',
        })
        .eq('product_id', productId);
      if (updateErr) throw updateErr;

      await supabase.from('audit_logs').insert([{
        admin_id: adminId,
        action: 'APPROVE_PRODUCT_QC',
        target_id: productId,
        details: { product_name: product?.name },
      }]);

      setSuccessMsg('Product approved and published!');
      setTimeout(() => onBack(), 1500);
    } catch (err: any) {
      setError('Approval failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setShowRejectConfirm(false);
    setActionLoading(true);
    setError('');
    try {
      const adminId = (await supabase.auth.getUser()).data.user?.id;
      const { error: updateErr } = await supabase
        .from('products')
        .update({
          qc_status: 'rejected',
          qc_reason: rejectionReason,
        })
        .eq('product_id', productId);
      if (updateErr) throw updateErr;

      await supabase.from('audit_logs').insert([{
        admin_id: adminId,
        action: 'REJECT_PRODUCT_QC',
        target_id: productId,
        details: { product_name: product?.name, reason: rejectionReason },
      }]);

      setSuccessMsg('Product has been rejected.');
      setTimeout(() => onBack(), 1500);
    } catch (err: any) {
      setError('Rejection failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getAllImages = (): string[] => {
    const imgs: string[] = [];
    if (product?.image_urls) imgs.push(...product.image_urls);
    variants.forEach(v => {
      if (v.image_urls) v.image_urls.forEach(url => { if (!imgs.includes(url)) imgs.push(url); });
    });
    return imgs;
  };

  const allImages = getAllImages();
  const hasVariants = variants.length > 0;
  const totalStock = hasVariants
    ? variants.reduce((sum, v) => sum + v.stock_quantity, 0)
    : product?.stock_quantity || 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500 font-bold space-y-3">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading product for review...</span>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-red-50 border border-red-200 rounded-2xl text-center space-y-4">
        <h3 className="font-bold text-red-800 text-lg">Failed to load product</h3>
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={onBack} className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700">
          Back to List
        </button>
      </div>
    );
  }

  if (!product) return null;

  const COMMON_REJECTION_REASONS = [
    "Image quality is poor or blurry.",
    "Product title is misleading or incorrect.",
    "Description is incomplete or lacks specifications.",
    "Pricing/MRP values are invalid or mismatched.",
    "Inappropriate or prohibited content.",
    "Duplicate product listing.",
    "Invalid category selection.",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack}
            className="p-2.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-all shrink-0">
            <svg className="w-5 h-5 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight line-clamp-1">{product.name}</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <ClipboardCheck className="w-3 h-3" />
                Pending QC
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Submitted {new Date(product.created_at).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })} · ID: <span className="font-mono">{product.product_id}</span>
            </p>
          </div>
        </div>

        {!showRejectInput && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowRejectInput(true)} disabled={actionLoading || !!successMsg}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 border border-red-200 rounded-lg text-sm font-bold transition-all">
              Reject
            </button>
            <button onClick={() => setShowApproveConfirm(true)} disabled={actionLoading || !!successMsg}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-sm transition-all">
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Approve & Publish'}
            </button>
          </div>
        )}
      </div>

      {/* Reject Input */}
      {showRejectInput && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-red-700 block mb-2">Select a reason or type below:</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_REJECTION_REASONS.map((reason) => (
                  <button key={reason} onClick={() => setRejectionReason(reason)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      rejectionReason === reason
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white border-red-200 text-red-700 hover:border-red-400'
                    }`}>
                    {reason}
                  </button>
                ))}
              </div>
              <textarea placeholder="Enter rejection reason..."
                value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-white border border-red-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium" rows={3} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (!rejectionReason.trim()) return; setShowRejectConfirm(true); }}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all">
                Confirm Rejection
              </button>
              <button onClick={() => { setShowRejectInput(false); setRejectionReason(''); }}
                className="px-5 py-2 bg-white hover:bg-neutral-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-bold">{successMsg}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold">{error}</div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Product Images</h3>
          </div>
          <div className="p-4">
            {allImages.length > 0 ? (
              <div className="flex gap-4">
                {allImages.length > 1 && (
                  <div className="flex flex-col gap-2 shrink-0">
                    {allImages.map((url, idx) => (
                      <button key={idx} onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                          idx === activeImageIndex ? 'border-amber-500 ring-2 ring-amber-500/25' : 'border-neutral-200 hover:border-neutral-400'
                        }`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex-1 relative rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50">
                  <img src={allImages[activeImageIndex] || allImages[0]} alt={product.name}
                    className="w-full h-auto max-h-[500px] object-contain" />
                  {allImages.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activeImageIndex + 1} / {allImages.length}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-square rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <ImageIcon className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="text-xs text-neutral-400 font-medium">No images uploaded</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 space-y-4 border-b border-neutral-100">
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Product Name</span>
              <span className="text-sm font-bold text-neutral-900">{product.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Description</span>
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <p className={`text-sm text-neutral-900 whitespace-pre-wrap leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
                  {product.description || 'No description provided.'}
                </p>
                {product.description && product.description.length > 120 && (
                  <button onClick={() => setDescExpanded(!descExpanded)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-1">
                    {descExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Category</span>
                <span className="text-sm font-bold text-neutral-900">{product.categories?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Material</span>
                <span className="text-sm font-bold text-neutral-900">{product.material || '\u2014'}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">MOQ</span>
                <span className="text-sm font-bold text-neutral-900">{product.moq} units</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Total Stock</span>
                <span className="text-sm font-bold text-neutral-900">{totalStock} units</span>
              </div>
            </div>

            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Seller</span>
                  <span className="text-sm font-bold text-neutral-900">{product.sellers?.business_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Owner</span>
                  <span className="text-sm font-bold text-neutral-900">{product.sellers?.owner_name || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Variants */}
      {!hasVariants ? (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pricing & Inventory</h3>
          </div>
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="px-5 py-3">MRP</th>
                  <th className="px-5 py-3">Platform Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">MOQ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-neutral-900">
                  <td className="px-5 py-4 text-sm font-bold">\u20B9{product.mrp || 0}</td>
                  <td className="px-5 py-4 text-sm font-bold text-emerald-700">\u20B9{product.base_price}</td>
                  <td className="px-5 py-4 text-sm font-bold">{product.stock_quantity} units</td>
                  <td className="px-5 py-4 text-sm font-bold">{product.moq} units</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Product Variants</h3>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase">
              {variants.length} Variants
            </span>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Variant</th>
                  <th className="px-5 py-3">MRP (\u20B9)</th>
                  <th className="px-5 py-3">Price (\u20B9)</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">SKU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-900">
                {variants.map((v) => (
                  <tr key={v.variant_id} className="hover:bg-neutral-50/20">
                    <td className="px-5 py-3 text-sm font-bold text-amber-700">{v.variant_value}</td>
                    <td className="px-5 py-3 text-sm font-medium">\u20B9{v.mrp}</td>
                    <td className="px-5 py-3 text-sm font-bold text-emerald-700">\u20B9{v.selling_price}</td>
                    <td className="px-5 py-3 text-sm font-semibold">{v.stock_quantity} units</td>
                    <td className="px-5 py-3 text-xs font-mono text-neutral-500">{v.sku || '\u2014'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Confirm Modal */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-neutral-900">Approve Product</h3>
            <p className="text-sm text-neutral-500">Approve <span className="font-bold text-neutral-900">{product.name}</span>? This product will go live immediately.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowApproveConfirm(false)}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-900 rounded-lg text-sm font-semibold">Cancel</button>
              <button onClick={handleApprove} disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold">
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirm Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-neutral-900">Reject Product</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-bold text-red-700 mb-1">Reason:</p>
              <p className="text-sm text-red-800">{rejectionReason}</p>
            </div>
            <p className="text-sm text-neutral-500">Reject <span className="font-bold text-neutral-900">{product.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowRejectConfirm(false)}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-900 rounded-lg text-sm font-semibold">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold">
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
