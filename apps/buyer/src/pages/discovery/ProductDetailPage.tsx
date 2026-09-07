import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useCart, formatWhatsAppUrl } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import {
  ShoppingCart,
  MessageCircle,
  Truck,
  ShieldCheck,
  Award,
  ArrowLeft,
  Store,
  ChevronRight,
  Star,
  CheckCircle,
  Plus,
  Minus,
  Share2,
} from 'lucide-react';
import { SimilarProducts } from './SimilarProducts';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    supabase
      .from('products')
      .select('*, seller:sellers(*), category:categories(*)')
      .eq('product_id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setProduct(data);
          setQuantity(data.moq || 1);
          setSelectedImageIndex(0);

          // Fetch related products
          if (data.category_id) {
            supabase
              .from('products')
              .select('*, seller:sellers(business_name), category:categories(name)')
              .eq('category_id', data.category_id)
              .eq('is_active', true)
              .eq('qc_status', 'verified')
              .neq('product_id', data.product_id)
              .limit(4)
              .then(({ data: related }) => setRelatedProducts(related || []));
          }
        }
        setLoading(false);
      });
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-sm font-semibold text-neutral-800">Product not found</p>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          This item might have been unlisted or removed by the merchant.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  const images = product.image_urls?.length ? product.image_urls : [];
  const discount =
    product.mrp && product.mrp > product.base_price
      ? Math.round(((product.mrp - product.base_price) / product.mrp) * 100)
      : 0;

  const minOrder = product.moq || 1;

  const handleAddToCart = async () => {
    const success = await addItem(product, undefined, quantity);
    if (success) {
      showToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`);
    }
  };

  const whatsappMessage = `Hello ${product.seller?.business_name || 'Seller'}, I am interested in purchasing "${product.name}" (Qty: ${quantity}, Total: ${formatINR(product.base_price * quantity)}) on YYME. Can you share availability and payment details?`;

  const handleWhatsAppClick = () => {
    if (!product?.seller_id) return;

    // 1. Decrement seller's remaining_click_quota via database RPC function
    supabase.rpc('decrement_click_quota', { sid: product.seller_id }).then(({ error }) => {
      if (error) console.error('Error decrementing click quota:', error);
    });

    // 2. Log click into whatsapp_click_logs
    supabase.from('whatsapp_click_logs').insert([{
      seller_id: product.seller_id,
      product_id: product.product_id,
      item_price: product.base_price
    }]).then(({ error }) => {
      if (error) console.warn('whatsapp_click_logs note:', error.message);
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-neutral-500 overflow-x-auto scrollbar-none">
        <Link to="/" className="hover:text-emerald-600">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <Link to="/shop" className="hover:text-emerald-600">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <Link
              to={`/shop/category/${product.category.category_id}`}
              className="hover:text-emerald-600 truncate max-w-[120px]"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <span className="text-neutral-900 font-semibold truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Product Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Image Gallery */}
        <div className="md:col-span-6 space-y-3">
          <div className="aspect-square bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs flex items-center justify-center relative">
            {images.length > 0 ? (
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl">📦</span>
            )}

            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-black px-2 py-1 rounded-lg shadow-sm">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    selectedImageIndex === i ? 'border-emerald-600 shadow-xs' : 'border-neutral-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Meta & Purchase Options */}
        <div className="md:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {product.category?.name || 'Handicraft'}
              </span>
              <span className="text-xs text-neutral-400">ID: {product.product_id?.slice(0, 8)}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 leading-snug">{product.name}</h1>

            {/* Seller Info */}
            <div className="flex items-center gap-2 mt-2 text-xs text-neutral-600">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>
                Sold by <strong className="text-neutral-900">{product.seller?.business_name || 'Verified Artisan'}</strong>
              </span>
              {product.seller?.shipping_state && (
                <span className="text-neutral-400">({product.seller.shipping_state})</span>
              )}
            </div>
          </div>

          {/* Price Box */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-neutral-900">
                {formatINR(product.base_price)}
              </span>
              {discount > 0 && (
                <span className="text-sm text-neutral-400 line-through">
                  {formatINR(product.mrp)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Save {discount}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">Inclusive of all local taxes</p>

            {minOrder > 1 && (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg mt-3 w-fit">
                Minimum order quantity: {minOrder} units
              </p>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-neutral-300 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(minOrder, prev - 1))}
                  className="p-2.5 hover:bg-neutral-100 text-neutral-600 transition-colors"
                  aria-label="Decrease Quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-sm font-bold text-neutral-900 min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="p-2.5 hover:bg-neutral-100 text-neutral-600 transition-colors"
                  aria-label="Increase Quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-neutral-500">
                Total: <strong className="text-neutral-900">{formatINR(product.base_price * quantity)}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>

            {product.seller?.whatsapp_number && (
              product.seller.remaining_click_quota !== undefined && product.seller.remaining_click_quota <= 0 ? (
                <button
                  type="button"
                  disabled
                  className="py-3 px-5 bg-neutral-200 text-neutral-500 text-sm font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  title="Seller inquiry quota reached"
                >
                  <MessageCircle className="w-4 h-4" /> Inquiries Full
                </button>
              ) : (
                <a
                  href={formatWhatsAppUrl(product.seller.whatsapp_number, whatsappMessage)}
                  onClick={handleWhatsAppClick}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" /> Order on WhatsApp
                </a>
              )
            )}
          </div>

          {/* Benefit Highlights */}
          <div className="border-t border-neutral-200 pt-4 space-y-2.5 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct factory / artisan delivery straight to your location</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Genuine handcrafted quality verified by YYME platform</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero middlemen commission — your payment directly supports the maker</span>
            </div>
          </div>

          {/* Material & Description */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-neutral-900">Product Information</h3>

            {product.material && (
              <div className="text-xs">
                <span className="font-semibold text-neutral-700">Material: </span>
                <span className="text-neutral-600">{product.material}</span>
              </div>
            )}

            {product.weight && (
              <div className="text-xs">
                <span className="font-semibold text-neutral-700">Shipping Weight: </span>
                <span className="text-neutral-600">{product.weight} kg</span>
              </div>
            )}

            <div className="text-xs leading-relaxed text-neutral-700 whitespace-pre-line bg-white border border-neutral-200 rounded-xl p-4">
              {product.description || 'Authentic handcrafted creation made with traditional Indian techniques.'}
            </div>
          </div>
        </div>
      </div>

      <SimilarProducts products={relatedProducts} />
    </div>
  );
}
