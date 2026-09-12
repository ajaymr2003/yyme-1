import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist, WishlistProductData } from '../core/contexts/WishlistContext';

interface WishlistButtonProps {
  productId: string;
  product?: Partial<WishlistProductData>;
  className?: string;
  iconClassName?: string;
  variant?: 'floating' | 'inline' | 'detail';
  showLabel?: boolean;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  product,
  className = '',
  iconClassName = '',
  variant = 'floating',
  showLabel = false,
}) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(productId);
  const [animating, setAnimating] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    await toggleWishlist(productId, product);
  };

  if (variant === 'detail') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
          wishlisted
            ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 shadow-xs'
            : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 shadow-xs'
        } ${animating ? 'scale-95' : 'active:scale-95'} ${className}`}
      >
        <Heart
          className={`w-5 h-5 transition-all duration-300 ${
            wishlisted
              ? 'fill-rose-500 text-rose-500 scale-110'
              : 'text-neutral-500 group-hover:text-rose-500'
          } ${iconClassName}`}
        />
        {showLabel && (
          <span className="text-xs sm:text-sm">
            {wishlisted ? 'Saved' : 'Wishlist'}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      className={`group relative flex items-center justify-center rounded-full transition-all cursor-pointer ${
        variant === 'floating'
          ? 'w-7 h-7 sm:w-8 sm:h-8 bg-white/90 hover:bg-white backdrop-blur-xs shadow-xs hover:shadow-md'
          : 'p-1.5 hover:bg-neutral-100'
      } ${animating ? 'scale-125' : 'active:scale-90'} ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${
          wishlisted
            ? 'fill-rose-500 text-rose-500 scale-105'
            : 'text-neutral-600 group-hover:text-rose-500'
        } ${iconClassName}`}
      />
    </button>
  );
};
