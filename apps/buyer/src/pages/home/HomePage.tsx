import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useCart } from '../../core/contexts/CartContext';
import { formatINR } from '@ymenet/utils';
import {
  ShoppingCart,
  Star,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Truck,
  MessageCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Store,
  Users,
  Award,
  HelpCircle,
  ArrowRight,
  Shirt,
  Smartphone,
  Laptop,
  Home,
  Flame,
  Check,
  Package,
} from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    rating: 5,
    name: 'Rahul Sharma',
    location: 'Bangalore, Karnataka',
    text: 'Ordered authentic handloom textiles directly from the artisan. The fabric quality and craftsmanship are remarkable!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    rating: 5,
    name: 'Priya Narayanan',
    location: 'Chennai, Tamil Nadu',
    text: 'Direct WhatsApp communication with the seller made custom sizing effortless. Zero middleman markup and very prompt dispatch.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    rating: 5,
    name: 'Vikram Das',
    location: 'Kolkata, West Bengal',
    text: 'Genuine handcrafted decor pieces straight from rural co-operatives. Beautiful packaging and completely authentic.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
];

const FAQS = [
  {
    question: 'How do I purchase items on YYME?',
    answer:
      'You can browse products, add items to your cart, and connect directly with sellers via WhatsApp or place an order to finalize details.',
  },
  {
    question: 'How are sellers and artisans verified?',
    answer:
      'Our platform administration reviews artisan identification, cooperative registration, or GST documents before granting active store status.',
  },
  {
    question: 'Are there hidden platform fees or markups?',
    answer:
      'No. YYME operates transparently with 0% hidden middleman commissions for buyers, giving you fair factory-direct or artisan-direct pricing.',
  },
  {
    question: 'How is delivery handled?',
    answer:
      'Sellers ship directly to you via reputable courier services. You receive direct dispatch tracking updates straight from the merchant.',
  },
];

const COLLECTIONS = [
  {
    title: 'Handloom & Heritage Textiles',
    description: 'Up to 35% off on hand-woven silk, cotton & ethnic wear',
    tag: '✨ Artisan Special',
    color: 'from-emerald-800 to-emerald-600',
    link: '/shop',
  },
  {
    title: 'Home Living & Terracotta Decor',
    description: 'Handcrafted pottery, kitchenware & sustainable lifestyle',
    tag: '🌿 Eco Craft',
    color: 'from-teal-800 to-emerald-700',
    link: '/shop',
  },
  {
    title: 'Festive Season Showcase',
    description: 'Special seasonal offers directly from verified Indian makers',
    tag: '🎉 Festive Deals',
    color: 'from-amber-700 to-emerald-800',
    link: '/shop',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'trending' | 'new' | 'best'>('trending');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [sellers, setSellers] = useState<any[]>([]);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    // 1. Banners
    supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => setBanners(data ?? []));

    // 2. Categories
    supabase
      .from('categories')
      .select('*')
      .eq('level', 1)
      .order('display_order')
      .then(({ data }) => setCategories(data ?? []));

    // 3. Products with seller and category joins
    supabase
      .from('products')
      .select('*, seller:sellers(seller_id, business_name, shipping_state, whatsapp_number), category:categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24)
      .then(({ data }) => setAllProducts(data ?? []));

    // 4. Active Verified Sellers
    supabase
      .from('sellers')
      .select('seller_id, business_name, seller_type, shipping_state, account_status')
      .eq('account_status', 'active')
      .limit(6)
      .then(({ data }) => setSellers(data ?? []));
  }, []);

  // Hero carousel auto-timer
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const showAddedToast = (productName: string) => {
    setAddedToast(`Added "${productName}" to cart!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  // Filter products by active tab and optional category
  const filteredProducts = allProducts.filter((p) => {
    if (selectedCategory && p.category_id !== selectedCategory) {
      return false;
    }
    return true;
  });

  const getTabProducts = () => {
    switch (activeTab) {
      case 'new':
        return [...filteredProducts].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'best':
        return [...filteredProducts].sort((a, b) => (b.moq || 1) - (a.moq || 1));
      case 'trending':
      default:
        return filteredProducts;
    }
  };

  const displayedProducts = getTabProducts();

  // Helper for category icon
  const renderCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('saree')) {
      return <Shirt className="w-5 h-5 text-emerald-600" />;
    }
    if (lower.includes('electronic') || lower.includes('mobile') || lower.includes('tech')) {
      return <Smartphone className="w-5 h-5 text-emerald-600" />;
    }
    if (lower.includes('laptop') || lower.includes('computer')) {
      return <Laptop className="w-5 h-5 text-emerald-600" />;
    }
    if (lower.includes('home') || lower.includes('living') || lower.includes('decor')) {
      return <Home className="w-5 h-5 text-emerald-600" />;
    }
    return <Package className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-neutral-900 pb-12">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-20 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className="bg-emerald-600 text-white text-[11px] font-semibold py-1.5 px-4 overflow-hidden tracking-wide text-center">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          ⚡ Free delivery benefits • Direct WhatsApp ordering • 100% Verified Indian Artisans & Local Sellers • Fair transparent pricing
        </span>
      </div>

      {/* 2. SUB-BAR: CATEGORIES HORIZONTAL NAVIGATION */}
      <div className="bg-white border-b border-neutral-200 sticky top-[57px] z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            All Products
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.category_id;
            return (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.category_id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {renderCategoryIcon(cat.name)}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-4">
        {/* 3. HERO BANNER CAROUSEL */}
        <section className="relative rounded-2xl overflow-hidden shadow-sm bg-emerald-700 min-h-[160px] sm:min-h-[260px] md:min-h-[320px]">
          {banners.length > 0 ? (
            banners.map((b, idx) => (
              <div
                key={b.banner_id}
                className={`absolute inset-0 transition-opacity duration-700 flex items-center ${
                  idx === currentHeroSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {b.image_url ? (
                  <img
                    src={b.image_url}
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 sm:p-12 flex flex-col justify-center text-white">
                    <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full w-fit mb-2 backdrop-blur-xs">
                      Handcrafted Marketplace
                    </span>
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-black mb-2">{b.title}</h2>
                    <p className="text-emerald-100 text-xs sm:text-sm max-w-md mb-4">
                      Discover authentic artisan creations straight from local makers across India.
                    </p>
                    <Link
                      to="/shop"
                      className="w-fit px-5 py-2 bg-white text-emerald-800 text-xs font-bold rounded-xl shadow-md hover:bg-neutral-100 transition-colors inline-flex items-center gap-2"
                    >
                      Shop Collection <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 sm:p-12 flex flex-col justify-center text-white bg-gradient-to-r from-emerald-800 to-emerald-600">
              <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full w-fit mb-3">
                Direct Marketplace
              </span>
              <h1 className="text-2xl sm:text-4xl font-black mb-2">Welcome to YYME</h1>
              <p className="text-emerald-100 text-xs sm:text-sm max-w-lg mb-4">
                Support local artisans and producers. Browse authentic, handcrafted treasures with factory-direct pricing.
              </p>
              <Link
                to="/shop"
                className="w-fit px-6 py-2.5 bg-white text-emerald-800 text-xs font-bold rounded-xl shadow-md hover:bg-neutral-100 transition-colors inline-flex items-center gap-2"
              >
                Explore Catalog <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Carousel Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentHeroSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-xs transition-colors"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentHeroSlide((prev) => (prev + 1) % banners.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-xs transition-colors"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Carousel Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentHeroSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentHeroSlide ? 'bg-white w-5' : 'bg-white/50'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. VALUE PROPOSITIONS & BUYER BENEFITS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900">Direct Delivery</h4>
              <p className="text-[11px] text-neutral-500">Shipped straight from the maker</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900">Verified Artisans</h4>
              <p className="text-[11px] text-neutral-500">Authentic & certified sellers</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900">WhatsApp Connect</h4>
              <p className="text-[11px] text-neutral-500">Direct seller chat & ordering</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900">0% Middleman Fee</h4>
              <p className="text-[11px] text-neutral-500">Direct fair-trade producer prices</p>
            </div>
          </div>
        </section>

        {/* 5. PRODUCT SHOWCASE TABS & GRID */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                Featured Catalog
                {selectedCategory && (
                  <span className="text-xs font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Filtered
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-500">Handcrafted products directly from Indian workshops</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'trending'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Trending
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'new'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                New Arrivals
              </button>
              <button
                onClick={() => setActiveTab('best')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'best'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Best Value
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {displayedProducts.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-500">
              <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-800">No products found in this selection</p>
              <p className="text-xs text-neutral-400 mt-1">Check back soon or browse all categories in the shop.</p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {displayedProducts.map((p) => {
                const discount =
                  p.mrp && p.mrp > p.base_price
                    ? Math.round(((p.mrp - p.base_price) / p.mrp) * 100)
                    : 0;

                return (
                  <div
                    key={p.product_id}
                    className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Image Area */}
                    <Link
                      to={`/product/${p.product_id}`}
                      className="relative aspect-square bg-neutral-100 overflow-hidden flex items-center justify-center"
                    >
                      {p.image_urls?.[0] ? (
                        <img
                          src={p.image_urls[0]}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}

                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                          {discount}% OFF
                        </span>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">
                          <span className="truncate">{p.category?.name || 'Handicraft'}</span>
                          {p.seller?.shipping_state && (
                            <span className="text-neutral-400 font-normal truncate">
                              {p.seller.shipping_state}
                            </span>
                          )}
                        </div>

                        <Link to={`/product/${p.product_id}`} className="block">
                          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 hover:text-emerald-700 transition-colors">
                            {p.name}
                          </h3>
                        </Link>

                        <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                          <Store className="w-3 h-3 text-neutral-400" />
                          <span className="truncate">{p.seller?.business_name || 'Verified Artisan'}</span>
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-100 mt-3">
                        <div className="flex items-baseline gap-1.5 mb-2">
                          <span className="text-sm sm:text-base font-black text-neutral-900">
                            {formatINR(p.base_price)}
                          </span>
                          {discount > 0 && (
                            <span className="text-[10px] text-neutral-400 line-through">
                              {formatINR(p.mrp)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              addItem(p);
                              showAddedToast(p.name);
                            }}
                            className="flex-1 py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add to Cart
                          </button>

                          {p.seller?.whatsapp_number && (
                            <a
                              href={`https://wa.me/91${p.seller.whatsapp_number}?text=${encodeURIComponent(
                                `Hi ${p.seller.business_name}, I saw "${p.name}" on YYME and want to order it!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 border border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors"
                              title="Chat with Maker on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        {p.moq > 1 && (
                          <p className="text-[10px] text-amber-600 font-semibold mt-1.5 text-center">
                            Min. order: {p.moq} units
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 6. SPECIAL FEATURED COLLECTIONS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Special Collections</h2>
              <p className="text-xs text-neutral-500">Curated selections from verified maker hubs</p>
            </div>
            <Link to="/shop" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLLECTIONS.map((col, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${col.color} text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden`}
              >
                <div>
                  <span className="text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    {col.tag}
                  </span>
                  <h3 className="text-lg font-black mt-3 mb-1">{col.title}</h3>
                  <p className="text-xs text-neutral-100/90 leading-relaxed">{col.description}</p>
                </div>
                <div className="mt-6">
                  <Link
                    to={col.link}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-neutral-900 text-xs font-bold rounded-xl shadow-xs hover:bg-neutral-100 transition-colors"
                  >
                    Explore Hub <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. VERIFIED ARTISANS / LOCAL MAKERS SPOTLIGHT */}
        {sellers.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Verified Makers & Artisans
                </h2>
                <p className="text-xs text-neutral-500">Empowering certified local creators across India</p>
              </div>
              <Link to="/shop" className="text-xs font-semibold text-emerald-700 hover:underline">
                Explore All Stores
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {sellers.map((s) => (
                <div
                  key={s.seller_id}
                  className="bg-white border border-neutral-200 rounded-xl p-3.5 text-center shadow-xs flex flex-col items-center justify-between"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center border border-emerald-200 mb-2">
                    {s.business_name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{s.business_name}</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{s.shipping_state || 'India'}</p>
                  <span className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. TESTIMONIALS & TRUST REVIEWS */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Buyer Experiences</h2>
            <p className="text-xs text-neutral-500">Real feedback from satisfied shoppers across India</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-2.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs text-neutral-700 italic leading-relaxed">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-neutral-100 mt-4">
                  <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover border border-neutral-200" />
                  <div>
                    <h5 className="text-xs font-bold text-neutral-900">{t.name}</h5>
                    <p className="text-[10px] text-neutral-400">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. FREQUENTLY ASKED QUESTIONS */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-neutral-500">Answers to common questions about ordering from YYME</p>
          </div>

          <div className="divide-y divide-neutral-100">
            {FAQS.map((faq, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <div key={idx} className="py-3">
                  <button
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-xs text-neutral-800 hover:text-emerald-700 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <p className="text-xs text-neutral-600 mt-2 pl-1 leading-relaxed animate-in fade-in duration-150">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 10. FOOTER */}
        <footer className="pt-8 border-t border-neutral-200 text-neutral-500 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  Y
                </div>
                <span className="text-base font-black text-neutral-900">YYME</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Empowering verified regional artisans, weavers, and small businesses with fair, direct marketplace commerce.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-neutral-900 mb-2">Explore</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link to="/shop" className="hover:text-emerald-700">All Products</Link></li>
                <li><Link to="/search" className="hover:text-emerald-700">Search Catalog</Link></li>
                <li><Link to="/cart" className="hover:text-emerald-700">My Cart</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-neutral-900 mb-2">Artisans & Sellers</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li><span className="hover:text-emerald-700 cursor-pointer">Become a Maker</span></li>
                <li><span className="hover:text-emerald-700 cursor-pointer">Verification Process</span></li>
                <li><span className="hover:text-emerald-700 cursor-pointer">Zero Commission Model</span></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-neutral-900 mb-2">Customer Support</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li><span className="hover:text-emerald-700 cursor-pointer">Direct WhatsApp Order</span></li>
                <li><span className="hover:text-emerald-700 cursor-pointer">Delivery Tracking</span></li>
                <li><span className="hover:text-emerald-700 cursor-pointer">Safety & Authenticity</span></li>
              </ul>
            </div>
          </div>

          <div className="text-center py-4 border-t border-neutral-100 text-[11px] text-neutral-400">
            © {new Date().getFullYear()} YYME Marketplace. Direct artisan commerce across India. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
