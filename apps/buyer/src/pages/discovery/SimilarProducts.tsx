import { Link } from 'react-router-dom';
import { formatINR } from '@ymenet/utils';

interface SimilarProduct {
  product_id: string;
  name: string;
  image_urls?: string[];
  base_price: number;
  mrp?: number;
  seller?: { business_name?: string };
}

export function SimilarProducts({ products }: { products: SimilarProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="pt-6 border-t border-neutral-200">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900">Similar Products</h3>
      </div>
      <div
        className="flex overflow-x-auto gap-3 px-4 pb-4 snap-x hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((p) => {
          const pDiscount =
            p.mrp && p.mrp > p.base_price
              ? Math.round(((p.mrp - p.base_price) / p.mrp) * 100)
              : 0;

          return (
            <Link
              key={p.product_id}
              to={`/product/${p.product_id}`}
              className="w-[140px] shrink-0 snap-start bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all group block"
            >
              <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                {p.image_urls?.[0] ? (
                  <img
                    src={p.image_urls[0]}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
                {pDiscount > 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                    {pDiscount}% OFF
                  </span>
                )}
              </div>
              <div className="p-2">
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 mb-1">
                  <span className="font-semibold text-emerald-700 truncate max-w-[100px]">
                    {p.seller?.business_name || 'Seller'}
                  </span>
                  <span className="text-amber-500 flex items-center gap-0.5">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    0
                  </span>
                </div>
                <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 leading-tight group-hover:text-emerald-700 min-h-[2.5rem]">
                  {p.name}
                </h4>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-sm font-black text-neutral-900">{formatINR(p.base_price)}</span>
                  {pDiscount > 0 && (
                    <span className="text-[10px] text-neutral-400 line-through">{formatINR(p.mrp || 0)}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
