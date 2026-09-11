import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { formatINR } from '@ymenet/utils';
import { useCart } from '../../core/contexts/CartContext';
import { MapPin, CheckCircle, Loader2, Store, ShoppingCart, ShoppingBag } from 'lucide-react';

interface SellerInfo {
  seller_id: string;
  business_name: string;
  owner_name: string;
  seller_type: string;
  shipping_state: string;
  city: string;
}

export const SellerStorefront: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchSeller = async () => {
      if (!id) { setLoading(false); return; }
      try {
        const { data } = await supabase
          .from('sellers')
          .select('seller_id, business_name, owner_name')
          .eq('seller_id', id)
          .maybeSingle();

        if (data) {
          setSeller({
            seller_id: data.seller_id,
            business_name: data.business_name,
            owner_name: data.owner_name,
            seller_type: 'Artisan',
            shipping_state: 'India',
            city: '',
          });
        }

        const { data: prods } = await supabase
          .from('products')
          .select('*, category:categories(name)')
          .eq('seller_id', id)
          .eq('is_active', true)
          .eq('qc_status', 'verified');
        setSellerProducts(prods ?? []);

        // Fetch seller total orders
        const { count: ordCount } = await supabase
          .from('orders')
          .select('order_id', { count: 'exact', head: true })
          .eq('seller_id', id);

        setOrdersCount(ordCount ?? 0);
      } catch (err) {
        console.error('Error fetching seller:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Seller not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-emerald-600 text-white py-2 px-4 rounded-lg shadow-md text-[11px] font-semibold">
          <CheckCircle className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="h-32 sm:h-44 w-full relative bg-neutral-100">
          <div className="absolute -bottom-6 left-6 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-4 border-white bg-white shadow-md flex items-center justify-center">
            <span className="text-xl font-bold text-neutral-400">{seller.business_name.charAt(0)}</span>
          </div>
        </div>

        <div className="px-6 pt-8 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-neutral-900">{seller.business_name}</h1>
              <span className={`border-0 font-bold text-[9px] uppercase px-2 py-0.5 rounded-md ${seller.seller_type === 'GST' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                {seller.seller_type} VERIFIED
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>{ordersCount} {ordersCount === 1 ? 'Order' : 'Orders'} Fulfilled</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" /> {seller.city || 'Kerala'}, {seller.shipping_state}
              </span>
              <span className="text-neutral-300">•</span>
              <span>Owner: {seller.owner_name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-neutral-900">Products from {seller.business_name}</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sellerProducts.map((p) => {
            const isInStock = p.stock_quantity === true || (p.stock_quantity as any) > 0 || p.stock_quantity === undefined;
            return (
              <div
                key={p.product_id}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group cursor-pointer"
                onClick={() => navigate(`/product/${p.product_id}`, { state: { product: p } })}
              >
                <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                  {p.image_urls?.[0] ? (
                    <img
                      src={p.image_urls[0]}
                      alt={p.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${
                        !isInStock ? 'opacity-70' : ''
                      }`}
                    />
                  ) : (
                    <span className="flex items-center justify-center h-full text-3xl">📦</span>
                  )}
                  {!isInStock && (
                    <span className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                      Out of Stock
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-bold text-neutral-900 line-clamp-2">{p.name}</h3>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-sm font-black text-neutral-900">{formatINR(p.base_price)}</p>
                    {!isInStock && (
                      <span className="text-[10px] font-bold text-rose-600">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
