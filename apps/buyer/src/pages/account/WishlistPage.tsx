import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/contexts/AuthContext';
import { useWishlist } from '../../core/contexts/WishlistContext';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import { Heart, Trash2, ShoppingCart, ArrowRight, ArrowLeft, Sparkles, LogIn } from 'lucide-react';

export function WishlistPage() {
  const { session } = useAuth();
  const { items, removeFromWishlist, loading } = useWishlist();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (item: any) => {
    await addItem({
      product_id: item.product_id,
      name: item.name,
      base_price: item.price,
      image_urls: item.image_urls,
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 mb-2 cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">My Wishlist</h1>
            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Heart className="w-3 h-3 fill-rose-600 text-rose-600" />
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Handcrafted finds and artisan products you've saved
          </p>
        </div>

        {!session && items.length > 0 && (
          <Link
            to="/login?redirect=/wishlist"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors self-start sm:self-auto shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In to Sync Across Devices
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 sm:p-14 text-center max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Heart className="w-8 h-8 text-rose-400 stroke-[1.8]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mb-6 leading-relaxed">
            Explore unique handcrafted treasures from independent makers across India and tap the heart icon to save your favorites.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              to="/shop"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs sm:text-sm font-semibold rounded-xl transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => {
            const hasDiscount = item.mrp && item.mrp > item.price;
            const discountPercent = hasDiscount
              ? Math.round(((item.mrp! - item.price) / item.mrp!) * 100)
              : 0;

            return (
              <div
                key={item.product_id}
                className="group bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image Container with Delete Button */}
                  <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                    <Link to={`/product/${item.product_id}`} className="block w-full h-full">
                      {item.image_urls?.[0] ? (
                        <img
                          src={item.image_urls[0]}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-3xl">
                          📦
                        </span>
                      )}
                    </Link>

                    {/* Delete / Remove Heart button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromWishlist(item.product_id);
                      }}
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                      className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs text-neutral-500 hover:text-rose-600 hover:bg-white flex items-center justify-center shadow-xs transition-all active:scale-90 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500 hover:text-rose-600" />
                    </button>

                    {discountPercent > 0 && (
                      <span className="absolute top-2 left-2 bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Info Area */}
                  <div className="p-3">
                    <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider truncate">
                      {item.seller_name}
                    </span>

                    <Link to={`/product/${item.product_id}`}>
                      <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-2 mt-0.5 hover:text-emerald-700 transition-colors leading-snug">
                        {item.name}
                      </h3>
                    </Link>

                    <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-neutral-900">
                        {formatINR(item.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] text-neutral-400 line-through">
                          {formatINR(item.mrp!)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div className="p-3 pt-0">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className="w-full py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
