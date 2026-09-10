import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import {
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Store,
  Truck,
  ArrowLeft,
  Check,
  X,
  Layers,
  AlertCircle,
  MessageCircle,
  Search
} from 'lucide-react';

import { cacheService, CACHE_KEYS, CACHE_TTL } from '../../core/services/cacheService';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const totalCartCount = items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  // Swipe & Drag refs for interactive image sliding
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  // Initialize synchronously from cache if present (eliminates loading spinner!)
  const initialCache = id ? cacheService.get<{ product: any; variants: any[]; related: any[] }>(CACHE_KEYS.PRODUCT_DETAIL(id), true)?.data : null;

  const [product, setProduct] = useState<any>(initialCache?.product ?? null);
  const [variants, setVariants] = useState<any[]>(initialCache?.variants ?? []);
  const [selectedVariant, setSelectedVariant] = useState<any>(() => {
    if (initialCache?.variants && initialCache.variants.length > 0) {
      const inStockVar = initialCache.variants.find(
        (v: any) => v.stock_quantity === true || (v.stock_quantity as any) > 0
      );
      return inStockVar || initialCache.variants[0];
    }
    return null;
  });
  const [loading, setLoading] = useState(!initialCache && !!id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState<number>(initialCache?.product?.moq || 1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [soldByOpen, setSoldByOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>(initialCache?.related ?? []);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const cacheKey = CACHE_KEYS.PRODUCT_DETAIL(id);
    const cached = cacheService.get<{ product: any; variants: any[]; related: any[] }>(cacheKey, true);
    if (!cached) {
      setLoading(true);
    }

    cacheService
      .fetchWithCache(
        cacheKey,
        async () => {
          const { data: prodData } = await supabase
            .from('products')
            .select('*, seller:sellers(seller_id, business_name, whatsapp_number), category:categories(name)')
            .eq('product_id', id)
            .single();

          if (!prodData) return null;

          // Fetch variants for this product
          const { data: varData } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', id)
            .order('selling_price', { ascending: true });

          const varList = varData ?? [];

          // Fetch related products
          let relList: any[] = [];
          if (prodData.category_id) {
            const { data: rel } = await supabase
              .from('products')
              .select('*, seller:sellers(seller_id, business_name, whatsapp_number), category:categories(name)')
              .eq('category_id', prodData.category_id)
              .eq('is_active', true)
              .eq('qc_status', 'verified')
              .neq('product_id', id)
              .limit(8);

            relList = rel ?? [];
          }

          return { product: prodData, variants: varList, related: relList };
        },
        {
          ttl: CACHE_TTL.SHORT,
          onBackgroundUpdate: (fresh) => {
            if (fresh) {
              setProduct(fresh.product);
              setVariants(fresh.variants);
              if (fresh.variants.length > 0) {
                const inStockVar = fresh.variants.find(
                  (v: any) => v.stock_quantity === true || (v.stock_quantity as any) > 0
                );
                setSelectedVariant(inStockVar || fresh.variants[0]);
              }
              setRelatedProducts(fresh.related);
              setLoading(false);
            }
          },
        }
      )
      .then((fresh) => {
        if (fresh) {
          setProduct(fresh.product);
          setQuantity(fresh.product.moq || 1);
          setVariants(fresh.variants);
          if (fresh.variants.length > 0) {
            const inStockVar = fresh.variants.find(
              (v: any) => v.stock_quantity === true || (v.stock_quantity as any) > 0
            );
            setSelectedVariant(inStockVar || fresh.variants[0]);
          } else {
            setSelectedVariant(null);
          }
          setRelatedProducts(fresh.related);
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold"
        >
          Go Home
        </button>
      </div>
    );
  }

  // Variant-specific image priority with product image fallbacks
  const variantImages = selectedVariant?.image_urls || [];
  const productImages = product.image_urls || [];
  const allImages = variantImages.length > 0
    ? [...variantImages, ...productImages.filter((u: string) => !variantImages.includes(u))]
    : productImages;

  // Reset active image index when selected variant changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedVariant]);

  const handlePrevImage = () => {
    if (allImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (allImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didSwipe.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      didSwipe.current = true;
      if (deltaX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    didSwipe.current = false;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current === null) return;
    const deltaX = mouseStartX.current - e.clientX;
    if (Math.abs(deltaX) > 35) {
      didSwipe.current = true;
      if (deltaX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    mouseStartX.current = null;
    setTimeout(() => {
      didSwipe.current = false;
    }, 100);
  };

  const displayPrice = selectedVariant?.selling_price ?? selectedVariant?.price ?? product.base_price;
  const displayMrp = selectedVariant?.mrp ?? product.mrp ?? 0;

  // Boolean stock determination
  const isInStock = selectedVariant
    ? (selectedVariant.stock_quantity === true || (selectedVariant.stock_quantity as any) > 0 || selectedVariant.stock_quantity === undefined)
    : (product.stock_quantity === true || (product.stock_quantity as any) > 0 || product.stock_quantity === undefined);

  const discount = displayMrp > displayPrice
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
    : 0;

  const showAddedToast = (name: string) => {
    setAddedToast(`Added "${name}" to cart!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const handleAddToCart = async () => {
    if (!isInStock) return;
    await addItem(product, selectedVariant, quantity);
    setAddedToCart(true);
    const itemLabel = selectedVariant
      ? `${product.name} (${selectedVariant.variant_value})`
      : product.name;
    showAddedToast(itemLabel);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isInStock) return;
    let cleanPhone = (product.seller?.whatsapp_number || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    const variantText = selectedVariant
      ? ` (${selectedVariant.variant_type}: ${selectedVariant.variant_value})`
      : '';
    const message = `Hello! I would like to order "${product.name}"${variantText}\nQuantity: ${quantity}\nTotal Price: ${formatINR(displayPrice * quantity)}\n\nPlease confirm availability and delivery.`;

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 lg:pb-12">
      {addedToast && (
        <div className="fixed bottom-20 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Top Header Bar with Back Button, Search Bar, and Cart Button */}
      <div className="sticky top-0 z-30 bg-[#e2f1fc] border-b border-sky-200/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-2.5">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1 text-gray-800 hover:text-black hover:bg-black/5 rounded-full transition-colors shrink-0 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Search Bar with Green Border and Green Shadow */}
          <form onSubmit={handleSearch} className="flex-1 min-w-0">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none stroke-[2]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products"
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm bg-white text-gray-800 placeholder:text-gray-500 border border-[#166534] focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/25 focus:outline-none transition-all shadow-[0_2px_12px_rgba(22,101,52,0.18)]"
              />
            </div>
          </form>

          {/* Cart Button */}
          <Link
            to="/cart"
            className="p-1.5 text-gray-800 hover:text-black hover:bg-black/5 rounded-full transition-colors relative shrink-0 flex items-center justify-center cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-6 h-6 stroke-[1.9] text-gray-800" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none shadow-xs border border-white">
                {totalCartCount > 99 ? '99+' : totalCartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto">
        {/* Gallery Section with Smooth Horizontal Sliding Carousel */}
        <div
          className="relative bg-white select-none overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            mouseStartX.current = null;
          }}
        >
          <div className="w-full h-[340px] sm:h-[440px] overflow-hidden bg-neutral-50/50">
            {allImages.length > 0 ? (
              <div
                className="flex h-full w-full transition-transform duration-300 ease-out will-change-transform"
                style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
              >
                {allImages.map((imgUrl: string, i: number) => (
                  <div
                    key={i}
                    className="w-full h-full shrink-0 flex items-center justify-center cursor-zoom-in"
                    onClick={() => {
                      if (!didSwipe.current) setIsFullScreen(true);
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} - ${i + 1}`}
                      className={`w-full h-full object-contain pointer-events-none transition-opacity duration-200 ${
                        !isInStock ? 'opacity-70' : 'opacity-100'
                      }`}
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">📦</span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(-1)}
            className="hidden lg:flex absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center shadow-sm z-10 hover:bg-white cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/35 hover:bg-black/60 active:scale-95 text-white cursor-pointer transition-all flex items-center justify-center shadow-md"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/35 hover:bg-black/60 active:scale-95 text-white cursor-pointer transition-all flex items-center justify-center shadow-md"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </>
          )}

          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-xs">
              {allImages.map((_: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === activeImageIndex ? 'bg-[#166534] w-5 shadow-xs' : 'bg-white/70 hover:bg-white w-2'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Out of Stock Overlay Badge */}
          {!isInStock && (
            <div className="absolute top-4 right-4 z-20">
              <span className="bg-rose-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="px-4 space-y-0">
          {/* Name + Price + Stock Pill */}
          <div className="bg-white py-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                <Star className="w-3 h-3 fill-white" /> 4.2
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                  isInStock
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
              >
                {isInStock ? '● In Stock' : '○ Out of Stock'}
              </span>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-2.5 mt-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {formatINR(displayPrice)}
              </span>
              {displayMrp > displayPrice && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    {formatINR(displayMrp)}
                  </span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Variants Selector */}
          {variants.length > 0 && (
            <div className="bg-white py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Select {variants[0]?.variant_type || 'Option'}:
                </span>
                {selectedVariant && (
                  <span className="text-xs font-medium text-neutral-600">
                    Selected: <strong className="font-bold text-neutral-900">{selectedVariant.variant_value}</strong>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.variant_id === v.variant_id;
                  const isVarInStock = v.stock_quantity === true || (v.stock_quantity as any) > 0 || v.stock_quantity === undefined;

                  return (
                    <button
                      key={v.variant_id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        setActiveImageIndex(0);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                          : isVarInStock
                            ? 'border-gray-200 bg-white text-gray-800 hover:border-emerald-300'
                            : 'border-gray-200 bg-gray-50 text-gray-400 opacity-60'
                      }`}
                    >
                      <span className={isSelected ? 'font-bold' : ''}>{v.variant_value}</span>
                      <span
                        className={`text-[11px] ${
                          isSelected ? 'text-emerald-700 font-bold' : 'text-gray-500'
                        }`}
                      >
                        {formatINR(v.selling_price)}
                      </span>
                      {!isVarInStock && (
                        <span className="text-[9.5px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          {isInStock && (
            <div className="flex items-center gap-3 py-3 border-b border-gray-100 bg-white">
              <span className="text-xs font-bold text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(product.moq || 1, q - 1))}
                  disabled={quantity <= (product.moq || 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center text-xs font-bold text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                  +
                </button>
              </div>
              {product.moq && product.moq > 1 && (
                <span className="text-[11px] text-neutral-500">(Min order: {product.moq})</span>
              )}
            </div>
          )}

          {/* Desktop Only Action Buttons (On Mobile, sticky bottom bar is used) */}
          <div className="hidden lg:block bg-white border-b border-gray-100 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isInStock}
                className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${
                  isInStock
                    ? 'text-emerald-700 border-2 border-emerald-600 bg-white hover:bg-emerald-50 active:scale-[0.99] cursor-pointer shadow-xs'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Cart
                  </>
                ) : isInStock ? (
                  <>
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </>
                ) : (
                  'Out of Stock'
                )}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isInStock}
                className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${
                  isInStock
                    ? 'text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] cursor-pointer shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                {isInStock ? 'Buy Now ' : 'Currently Unavailable'}
              </button>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white border-b border-gray-100">
            <button
              onClick={() => setDeliveryOpen(!deliveryOpen)}
              className="w-full flex items-center justify-between py-4 px-1 text-left cursor-pointer"
            >
              <span className="text-sm font-bold text-gray-900">Delivery details</span>
              {deliveryOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {deliveryOpen && (
              <div className="pb-4 px-1 space-y-3">
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <Truck className="w-4 h-4 text-emerald-600" /> Ships from{' '}
                  {product.seller?.shipping_state || 'Kerala, India'}
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white border-b border-gray-100">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex items-center justify-between py-4 px-1 text-left cursor-pointer"
            >
              <span className="text-sm font-bold text-gray-900">Product Details</span>
              {detailsOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {detailsOpen && (
              <div className="pb-4 px-1 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Category</span>
                    <p className="text-gray-900 font-medium">{product.category?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Weight</span>
                    <p className="text-gray-900 font-medium">{product.weight_kg || '-'} kg</p>
                  </div>
                  {product.material && (
                    <div>
                      <span className="text-gray-500">Material / Process</span>
                      <p className="text-gray-900 font-medium">{product.material}</p>
                    </div>
                  )}
                  {selectedVariant?.sku && (
                    <div>
                      <span className="text-gray-500">SKU</span>
                      <p className="text-gray-900 font-medium">{selectedVariant.sku}</p>
                    </div>
                  )}
                </div>
                {product.description && (
                  <div className="border-t border-gray-100 pt-3">
                    <span className="text-gray-500 text-xs">Description</span>
                    <p className="text-xs text-gray-800 leading-relaxed mt-1">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sold By */}
          <div className="bg-white border-b border-gray-100">
            <button
              onClick={() => setSoldByOpen(!soldByOpen)}
              className="w-full flex items-center justify-between py-4 px-1 text-left cursor-pointer"
            >
              <span className="text-sm font-bold text-gray-900">Sold By</span>
              {soldByOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {soldByOpen && (
              <div className="pb-4 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Store className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 text-sm">
                      {product.seller?.business_name || 'Verified Artisan'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="bg-white py-6">
              <h3 className="text-sm font-bold text-gray-900 px-1 mb-3">Similar Products</h3>
              <div className="flex overflow-x-auto gap-3 px-1 pb-4 scrollbar-none">
                {relatedProducts.map((rp) => {
                  const isRelInStock = rp.stock_quantity === true || (rp.stock_quantity as any) > 0 || rp.stock_quantity === undefined;
                  return (
                    <div
                      key={rp.product_id}
                      onClick={() => navigate(`/product/${rp.product_id}`)}
                      className="w-[140px] shrink-0 cursor-pointer group"
                    >
                      <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-1">
                        {rp.image_urls?.[0] ? (
                          <img
                            src={rp.image_urls[0]}
                            alt={rp.name}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${!isRelInStock ? 'opacity-70' : ''}`}
                          />
                        ) : (
                          <span className="flex items-center justify-center h-full text-2xl">📦</span>
                        )}
                        {!isRelInStock && (
                          <span className="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-neutral-900 line-clamp-2">
                        {rp.name}
                      </p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <p className="text-xs font-black text-neutral-900">
                          {formatINR(rp.base_price)}
                        </p>
                        {!isRelInStock && (
                          <span className="text-[9px] text-rose-600 font-semibold">
                            (Sold out)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 flex gap-3 z-40 lg:hidden shadow-2xl">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isInStock}
          className={`flex-1 py-3 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs sm:text-sm ${
            isInStock
              ? 'text-emerald-700 border-2 border-emerald-600 bg-white hover:bg-emerald-50 active:scale-[0.99] cursor-pointer shadow-xs'
              : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
          }`}
        >
          {addedToCart ? (
            <>
              <Check className="w-4 h-4" /> Added
            </>
          ) : isInStock ? (
            <>
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </>
          ) : (
            'Out of Stock'
          )}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!isInStock}
          className={`flex-1 py-3 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs sm:text-sm ${
            isInStock
              ? 'text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] cursor-pointer shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          {isInStock ? 'Buy Now' : 'Out of Stock'}
        </button>
      </div>

      {/* Fullscreen Image */}
      {isFullScreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsFullScreen(false)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white cursor-pointer">
            <X className="w-8 h-8" />
          </button>
          <img
            src={allImages[activeImageIndex] || ''}
            alt={product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}
