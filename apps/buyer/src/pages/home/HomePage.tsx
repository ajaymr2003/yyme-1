import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import {
  ShoppingCart, Star, Sparkles, ShieldCheck, Truck, MessageCircle,
  CheckCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ArrowRight, Flame, Package, Store, Users, HelpCircle, Heart,
} from 'lucide-react';
import { FeatureBenefits } from '../../components/FeatureBenefits';
import { WhyChooseUs } from '../../components/WhyChooseUs';
import { MarketplaceStats } from '../../components/MarketplaceStats';
import { SellerCTA } from '../../components/SellerCTA';

const TESTIMONIALS = [
  { id: 1, rating: 5, name: 'Rahul Sharma', location: 'Bangalore', text: 'Ordered authentic handloom textiles directly from the artisan. The fabric quality and craftsmanship are remarkable!', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
  { id: 2, rating: 5, name: 'Priya Narayanan', location: 'Chennai', text: 'Direct WhatsApp communication with the seller made custom sizing effortless. Zero middleman markup.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
  { id: 3, rating: 5, name: 'Vikram Das', location: 'Kolkata', text: 'Genuine handcrafted decor pieces straight from rural co-operatives. Beautiful packaging and completely authentic.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
];

const FAQS = [
  { question: 'How do I purchase items on YYME?', answer: 'You can browse products, add items to your cart, and connect directly with sellers via WhatsApp or place an order to finalize details.' },
  { question: 'How are sellers and artisans verified?', answer: 'Our platform administration reviews artisan identification, cooperative registration, or GST documents before granting active store status.' },
  { question: 'Are there hidden platform fees or markups?', answer: 'No. YYME operates transparently with 0% hidden middleman commissions for buyers.' },
  { question: 'How is delivery handled?', answer: 'Sellers ship directly to you via reputable courier services. You receive direct dispatch tracking updates straight from the merchant.' },
];

const COLLECTIONS = [
  { title: 'Handloom & Heritage Textiles', description: 'Up to 35% off on hand-woven silk, cotton & ethnic wear', tag: 'Artisan Special', color: 'from-emerald-800 to-emerald-600', link: '/shop' },
  { title: 'Home Living & Terracotta Decor', description: 'Handcrafted pottery, kitchenware & sustainable lifestyle', tag: 'Eco Craft', color: 'from-teal-800 to-emerald-700', link: '/shop' },
  { title: 'Festive Season Showcase', description: 'Special seasonal offers directly from verified Indian makers', tag: 'Festive Deals', color: 'from-amber-700 to-emerald-800', link: '/shop' },
];

import { cacheService, CACHE_KEYS, CACHE_TTL } from '../../core/services/cacheService';

export function HomePage() {
  const { addItem } = useCart();
  const [banners, setBanners] = useState<any[]>(() => {
    return cacheService.get<any[]>(CACHE_KEYS.BANNERS, true)?.data || [];
  });
  const [categories, setCategories] = useState<any[]>(() => {
    return cacheService.get<any[]>(CACHE_KEYS.CATEGORIES_L1, true)?.data || [];
  });
  const [allProducts, setAllProducts] = useState<any[]>(() => {
    return cacheService.get<any[]>(CACHE_KEYS.FEATURED_PRODUCTS, true)?.data || [];
  });
  const [activeTab, setActiveTab] = useState<'trending' | 'new' | 'best'>('trending');
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [sellers, setSellers] = useState<any[]>(() => {
    return cacheService.get<any[]>(CACHE_KEYS.ACTIVE_SELLERS, true)?.data || [];
  });
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    // 1. Banners with cache
    cacheService.fetchWithCache(
      CACHE_KEYS.BANNERS,
      async () => {
        const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('display_order');
        return data ?? [];
      },
      { ttl: CACHE_TTL.MEDIUM, onBackgroundUpdate: (fresh) => setBanners(fresh) }
    ).then((data) => setBanners(data));

    // 2. Categories with cache
    cacheService.fetchWithCache(
      CACHE_KEYS.CATEGORIES_L1,
      async () => {
        const { data } = await supabase.from('categories').select('*').order('display_order');
        return (data ?? []).filter((c: any) => c.level === 1);
      },
      { ttl: CACHE_TTL.LONG, onBackgroundUpdate: (fresh) => setCategories(fresh) }
    ).then((data) => setCategories(data));

    // 3. Featured Products with cache
    cacheService.fetchWithCache(
      CACHE_KEYS.FEATURED_PRODUCTS,
      async () => {
        const { data } = await supabase
          .from('products')
          .select('*, seller:sellers(seller_id, business_name, whatsapp_number), category:categories(name)')
          .eq('is_active', true)
          .eq('qc_status', 'verified')
          .order('created_at', { ascending: false })
          .limit(24);
        return data ?? [];
      },
      { ttl: CACHE_TTL.SHORT, onBackgroundUpdate: (fresh) => setAllProducts(fresh) }
    ).then((data) => setAllProducts(data));

    // 4. Active Sellers with cache
    cacheService.fetchWithCache(
      CACHE_KEYS.ACTIVE_SELLERS,
      async () => {
        const { data } = await supabase
          .from('sellers')
          .select('seller_id, business_name, account_status')
          .eq('account_status', 'active')
          .limit(6);
        return data ?? [];
      },
      { ttl: CACHE_TTL.SHORT, onBackgroundUpdate: (fresh) => setSellers(fresh) }
    ).then((data) => setSellers(data));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => setCurrentHeroSlide((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const showAddedToast = (name: string) => { setAddedToast(`Added "${name}" to cart!`); setTimeout(() => setAddedToast(null), 2500); };

  const tabProducts = (() => {
    switch (activeTab) {
      case 'new': return [...allProducts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'best': return [...allProducts].sort((a, b) => (b.moq || 1) - (a.moq || 1));
      default: return allProducts;
    }
  })();

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-12">
      {addedToast && (
        <div className="fixed bottom-20 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4" /><span>{addedToast}</span>
        </div>
      )}

      {/* Hero Banner Section with full-bleed green backdrop & bottom color grading */}
      <section className="w-full relative overflow-hidden bg-gradient-to-b from-brand-500 via-brand-500 to-brand-600 pt-5 pb-14 sm:pt-6 sm:pb-28">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-6 lg:px-8 flex items-center justify-center">
          {/* Centered card with reduced banner size */}
          <div className="w-full max-w-[680px] h-[150px] sm:h-[280px] md:h-[310px] relative rounded-xl sm:rounded-3xl overflow-hidden shadow-2xl">
            {banners.length > 0 ? (
              banners.map((banner, idx) => (
                <div
                  key={banner.banner_id}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
                    idx === currentHeroSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover cursor-pointer"
                  />
                  {/* Mobile arrows on image */}
                  <button onClick={() => setCurrentHeroSlide(p => p === 0 ? banners.length - 1 : p - 1)} className="absolute md:hidden left-2 top-1/2 -translate-y-1/2 z-30 text-white/80 hover:text-white bg-black/20 rounded-full p-1 backdrop-blur-sm"><ChevronLeft className="w-6 h-6 stroke-[3]" /></button>
                  <button onClick={() => setCurrentHeroSlide(p => (p + 1) % banners.length)} className="absolute md:hidden right-2 top-1/2 -translate-y-1/2 z-30 text-white/80 hover:text-white bg-black/20 rounded-full p-1 backdrop-blur-sm"><ChevronRight className="w-6 h-6 stroke-[3]" /></button>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/10 backdrop-blur-xs text-white text-center p-6">
                <h1 className="text-2xl sm:text-4xl font-black">Welcome to YYME</h1>
                <p className="text-sm sm:text-base text-white/90 mt-2">Support local artisans and explore handcrafted treasures from every corner of India.</p>
              </div>
            )}

            {/* Desktop arrows */}
            {banners.length > 1 && (
              <>
                <button onClick={() => setCurrentHeroSlide(p => p === 0 ? banners.length - 1 : p - 1)} className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 bg-black/20 hover:bg-black/40 rounded-full p-2.5 backdrop-blur-xs"><ChevronLeft className="w-6 h-6 stroke-[2.5]" /></button>
                <button onClick={() => setCurrentHeroSlide(p => (p + 1) % banners.length)} className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 bg-black/20 hover:bg-black/40 rounded-full p-2.5 backdrop-blur-xs"><ChevronRight className="w-6 h-6 stroke-[2.5]" /></button>
              </>
            )}
          </div>
        </div>

        {/* Color Grading (bottom smoke / gradient fade into white) */}
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-36 pointer-events-none z-10 bg-gradient-to-t from-white via-white/40 to-transparent" />
      </section>

      {/* Feature Benefits Strip (overlapping bottom gradient) */}
      <FeatureBenefits />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-4">
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Featured Catalog</h2>
              <p className="text-xs text-neutral-500">Handcrafted products directly from Indian workshops</p>
            </div>
          </div>

          {tabProducts.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-500">
              <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-800">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
              {tabProducts.map((p) => {
                const hasImage = p.image_urls && p.image_urls.length > 0;
                const brandOrSeller = p.seller?.business_name || p.brand || 'Artisan';
                const isInStock = p.stock_quantity === true || (p.stock_quantity as any) > 0 || p.stock_quantity === undefined;
                const sum = (p.product_id || 'default').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const rating = (4.0 + (sum % 8) / 10).toFixed(1);
                const ratingCount = (1200 + (sum * 9) % 3500).toLocaleString();

                return (
                  <Link
                    key={p.product_id}
                    to={`/product/${p.product_id}`}
                    className="flex flex-col group cursor-pointer"
                  >
                    {/* Portrait aspect ratio container with rating badge */}
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100 shadow-2xs">
                      {hasImage ? (
                        <img
                          src={p.image_urls[0]}
                          alt={p.name}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                            !isInStock ? 'opacity-70' : ''
                          }`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-neutral-100">
                          📦
                        </div>
                      )}

                      {/* Out of Stock badge */}
                      {!isInStock && (
                        <div className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs tracking-wider z-10">
                          Out of Stock
                        </div>
                      )}

                      {/* Bottom-left Rating Badge: 4.2 ★ (3,486) */}
                      <div className="absolute bottom-1.5 left-1.5 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-bold text-neutral-800 flex items-center gap-0.5 shadow-2xs">
                        <span>{rating}</span>
                        <span className="text-icon-accent text-[9px]">★</span>
                        <span className="text-neutral-400 text-[9px] font-normal border-l border-neutral-300 pl-1">
                          ({ratingCount})
                        </span>
                      </div>
                    </div>

                    {/* Details below image */}
                    <div className="pt-1.5 px-0.5">
                      {/* Line 1: Brand/Seller bold + Product title lighter */}
                      <div className="flex items-baseline gap-1 text-[11px] sm:text-xs leading-tight">
                        <span className="font-bold text-neutral-900 shrink-0">
                          {brandOrSeller}
                        </span>
                        <span className="text-neutral-500 font-normal truncate">
                          {p.name}
                        </span>
                      </div>

                      {/* Line 2: Prices: strikethrough MRP first, then bold final price */}
                      <div className="mt-0.5 flex items-baseline justify-between gap-1 text-[11.5px] sm:text-xs">
                        <div className="flex items-baseline gap-1">
                          {p.mrp && p.mrp > p.base_price && (
                            <span className="text-neutral-400 line-through text-[10px] font-normal">
                              {formatINR(p.mrp)}
                            </span>
                          )}
                          <span className="font-bold text-neutral-900">
                            {formatINR(p.base_price)}
                          </span>
                        </div>
                        {!isInStock && (
                          <span className="text-[9.5px] font-bold text-rose-600">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Collections */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Special Collections</h2>
            <Link to="/shop" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">View All <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLLECTIONS.map((col, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${col.color} text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden`}>
                <div>
                  <span className="text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-full">{col.tag}</span>
                  <h3 className="text-lg font-black mt-3 mb-1">{col.title}</h3>
                  <p className="text-xs text-neutral-100/90 leading-relaxed">{col.description}</p>
                </div>
                <div className="mt-6"><Link to={col.link} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-neutral-900 text-xs font-bold rounded-xl hover:bg-neutral-100 transition-colors">Explore Hub <ArrowRight className="w-3.5 h-3.5" /></Link></div>
              </div>
            ))}
          </div>
        </section>

        {/* Sellers */}
        {sellers.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" />Verified Makers & Artisans</h2>
              <Link to="/shop" className="text-xs font-semibold text-emerald-700 hover:underline">Explore All Stores</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {sellers.map((s) => (
                <div key={s.seller_id} className="bg-white border border-neutral-200 rounded-xl p-3.5 text-center shadow-xs flex flex-col items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center border border-emerald-200 mb-2">{s.business_name?.charAt(0).toUpperCase() || 'A'}</div>
                  <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{s.business_name}</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">India</p>
                  <span className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Verified</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <WhyChooseUs />
        <MarketplaceStats />
        <SellerCTA />

        {/* Testimonials */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-neutral-900">Buyer Experiences</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-2.5">{[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-500" />)}</div>
                  <p className="text-xs text-neutral-700 italic leading-relaxed">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-neutral-100 mt-4">
                  <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover border border-neutral-200" />
                  <div><h5 className="text-xs font-bold text-neutral-900">{t.name}</h5><p className="text-[10px] text-neutral-400">{t.location}</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-emerald-600" />Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="py-3">
                <button onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? null : idx)} className="w-full flex items-center justify-between text-left font-bold text-xs text-neutral-800 hover:text-emerald-700 transition-colors">
                  <span>{faq.question}</span>
                  {faqOpenIndex === idx ? <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />}
                </button>
                {faqOpenIndex === idx && <p className="text-xs text-neutral-600 mt-2 pl-1 leading-relaxed">{faq.answer}</p>}
              </div>
            ))}
          </div>
        </section>

        <footer className="pt-8 border-t border-neutral-200 text-neutral-500 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">Y</div><span className="text-base font-black text-neutral-900">YYME</span></div>
              <p className="text-[11px] leading-relaxed">Empowering verified regional artisans, weavers, and small businesses with fair, direct marketplace commerce.</p>
            </div>
            <div><h5 className="font-bold text-neutral-900 mb-2">Explore</h5><ul className="space-y-1.5 text-[11px]"><li><Link to="/shop" className="hover:text-emerald-700">All Products</Link></li><li><Link to="/search" className="hover:text-emerald-700">Search Catalog</Link></li><li><Link to="/cart" className="hover:text-emerald-700">My Cart</Link></li></ul></div>
            <div><h5 className="font-bold text-neutral-900 mb-2">Artisans & Sellers</h5><ul className="space-y-1.5 text-[11px]"><li><span>Become a Maker</span></li><li><span>Verification Process</span></li><li><span>Zero Commission Model</span></li></ul></div>
            <div><h5 className="font-bold text-neutral-900 mb-2">Customer Support</h5><ul className="space-y-1.5 text-[11px]"><li><span>Direct WhatsApp Order</span></li><li><span>Delivery Tracking</span></li><li><span>Safety & Authenticity</span></li></ul></div>
          </div>
          <div className="text-center py-4 border-t border-neutral-100 text-[11px] text-neutral-400">© {new Date().getFullYear()} YYME Marketplace. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
}
