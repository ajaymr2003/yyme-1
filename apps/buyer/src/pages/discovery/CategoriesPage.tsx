import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useCart } from '../../core/contexts/CartContext';
import { getCategoryIcon } from '../../components/CategoryIcons';
import { formatINR } from '@ymenet/utils';
import { cacheService, CACHE_KEYS, CACHE_TTL } from '../../core/services/cacheService';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  ChevronRight,
  ArrowDown,
  Sparkles,
  Store,
  CheckCircle,
  Package
} from 'lucide-react';

export function CategoriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: cartItems } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'for-you'
  );
  const [categories, setCategories] = useState<any[]>(() => {
    return cacheService.get<any[]>(CACHE_KEYS.CATEGORIES_ALL, true)?.data || [];
  });
  const [products, setProducts] = useState<any[]>(() => {
    const cat = searchParams.get('category') || 'for-you';
    return cacheService.get<any[]>(CACHE_KEYS.CATEGORY_PRODUCTS(cat), true)?.data || [];
  });
  const [popularStores, setPopularStores] = useState<any[]>(() => {
    return cacheService.get<any[]>('yyme_buyer_popular_stores', true)?.data || [];
  });
  const [loading, setLoading] = useState(() => {
    const cat = searchParams.get('category') || 'for-you';
    return !cacheService.get<any[]>(CACHE_KEYS.CATEGORY_PRODUCTS(cat), true);
  });

  // Sync category param with state
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setSelectedCategory(catParam);
    }
  }, [searchParams]);

  // Fetch all categories with 15-min cache
  useEffect(() => {
    cacheService
      .fetchWithCache(
        CACHE_KEYS.CATEGORIES_ALL,
        async () => {
          const { data } = await supabase.from('categories').select('*').order('display_order');
          return data ?? [];
        },
        { ttl: CACHE_TTL.LONG, onBackgroundUpdate: (fresh) => setCategories(fresh) }
      )
      .then((data) => setCategories(data));

    // Fetch popular sellers with cache
    cacheService
      .fetchWithCache(
        'yyme_buyer_popular_stores',
        async () => {
          const { data } = await supabase.from('sellers').select('seller_id, business_name').limit(6);
          return data ?? [];
        },
        { ttl: CACHE_TTL.SHORT, onBackgroundUpdate: (fresh) => setPopularStores(fresh) }
      )
      .then((data) => setPopularStores(data));
  }, []);

  // Fetch products based on selected category with SWR
  useEffect(() => {
    const cacheKey = CACHE_KEYS.CATEGORY_PRODUCTS(selectedCategory);
    const cached = cacheService.get<any[]>(cacheKey, true);
    if (!cached) {
      setLoading(true);
    }

    cacheService
      .fetchWithCache(
        cacheKey,
        async () => {
          if (selectedCategory === 'for-you') {
            const { data } = await supabase
              .from('products')
              .select('*, seller:sellers(seller_id, business_name), category:categories(name)')
              .eq('is_active', true)
              .eq('qc_status', 'verified')
              .order('created_at', { ascending: false })
              .limit(24);
            return data ?? [];
          } else {
            const targetCategory = categories.find((c) => c.category_id === selectedCategory);
            if (!targetCategory && categories.length > 0) {
              return [];
            }

            const childCategoryIds = categories
              .filter((c) => c.parent_category_id === selectedCategory)
              .map((c) => c.category_id);

            const allIds = [selectedCategory, ...childCategoryIds];

            const { data } = await supabase
              .from('products')
              .select('*, seller:sellers(seller_id, business_name), category:categories(name)')
              .eq('is_active', true)
              .eq('qc_status', 'verified')
              .in('category_id', allIds)
              .order('created_at', { ascending: false })
              .limit(30);

            if (!data || data.length === 0) {
              const { data: fallbackData } = await supabase
                .from('products')
                .select('*, seller:sellers(seller_id, business_name), category:categories(name)')
                .eq('is_active', true)
                .eq('qc_status', 'verified')
                .order('created_at', { ascending: false })
                .limit(18);
              return fallbackData ?? [];
            }

            return data;
          }
        },
        {
          ttl: CACHE_TTL.DYNAMIC,
          onBackgroundUpdate: (fresh) => {
            setProducts(fresh);
            setLoading(false);
          },
        }
      )
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, [selectedCategory, categories]);

  const l1Categories = categories.filter((c) => c.level === 1);
  const selectedCatObj = categories.find((c) => c.category_id === selectedCategory);
  const subCategories = categories.filter((c) => c.parent_category_id === selectedCategory);

  const handleSelectCategory = (id: string) => {
    setSelectedCategory(id);
    setSearchParams(id === 'for-you' ? {} : { category: id }, { replace: true });
  };

  const handleBack = () => {
    if (selectedCategory !== 'for-you') {
      setSelectedCategory('for-you');
      setSearchParams({}, { replace: true });
    } else {
      navigate('/');
    }
  };

  // Curated stores fallback if sellers table is small
  const displayStores = [
    { name: 'Value 365', tag: 'BEST VALUE', iconColor: 'bg-rose-50 text-rose-600' },
    { name: 'Minutes Express', tag: 'FASTEST', iconColor: 'bg-amber-50 text-amber-600' },
    { name: 'Artisan Hub', tag: 'DIRECT MAKER', iconColor: 'bg-emerald-50 text-emerald-700' },
    { name: 'Handloom Guild', tag: 'AUTHENTIC', iconColor: 'bg-purple-50 text-purple-700' },
    { name: 'Organic Pantry', tag: 'PURE & FRESH', iconColor: 'bg-teal-50 text-teal-700' },
    { name: 'Craft Studio', tag: 'HANDMADE', iconColor: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="flex flex-col h-full w-full flex-1 bg-white overflow-hidden">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-200/80 px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 -ml-1 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
            All Categories
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate('/search')}
            className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            title="Search products"
            aria-label="Search"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>

          <Link
            to="/cart"
            className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors relative cursor-pointer"
            title="Cart"
            aria-label="Cart"
          >
            <ShoppingCart className="w-5 h-5 stroke-[2]" />
            {cartItems.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-xs">
                {cartItems.length}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main 2-Column Container */}
      <div className="flex flex-1 overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Left Column: Category Rail / Desktop Sidebar */}
        <aside
          className="w-[82px] sm:w-[94px] md:w-56 lg:w-64 shrink-0 bg-surface-input md:bg-neutral-50/70 border-r border-neutral-200/80 overflow-y-auto overflow-x-hidden scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* 1. "For You" Rail Item */}
          <button
            onClick={() => handleSelectCategory('for-you')}
            className={`w-full py-2.5 px-1 md:py-3 md:px-3.5 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between relative transition-all cursor-pointer ${
              selectedCategory === 'for-you'
                ? 'bg-white text-neutral-900 md:shadow-xs md:font-bold'
                : 'text-neutral-600 hover:bg-neutral-200/40 md:hover:bg-neutral-100'
            }`}
          >
            {/* Active Indicator - Emerald Green */}
            {selectedCategory === 'for-you' && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 md:w-1.5 bg-emerald-600 rounded-r-full" />
            )}

            <div className="flex flex-col md:flex-row items-center md:gap-3 w-full min-w-0">
              <div
                className={`w-11 h-11 md:w-9 md:h-9 rounded-2xl md:rounded-xl shrink-0 flex items-center justify-center transition-all ${
                  selectedCategory === 'for-you'
                    ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 shadow-xs'
                    : 'bg-white/80 md:bg-white shadow-2xs'
                }`}
              >
                <Sparkles className="w-5 h-5 md:w-4 md:h-4 text-emerald-600" />
              </div>

              <span
                className={`text-[10px] sm:text-[11px] md:text-xs leading-tight text-center md:text-left mt-1 md:mt-0 w-full md:w-auto truncate px-0.5 md:px-0 ${
                  selectedCategory === 'for-you' ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'
                }`}
              >
                For You
              </span>
            </div>

            <ChevronRight className="hidden md:block w-4 h-4 text-neutral-400 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* 2. L1 Categories Rail Items */}
          {l1Categories.map((cat) => {
            const isSelected = selectedCategory === cat.category_id;
            return (
              <button
                key={cat.category_id}
                onClick={() => handleSelectCategory(cat.category_id)}
                className={`w-full py-2.5 px-1 md:py-3 md:px-3.5 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between relative transition-all border-t border-neutral-200/40 md:border-neutral-200/60 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-neutral-900 md:shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-200/40 md:hover:bg-neutral-100'
                }`}
              >
                {/* Active Indicator - Emerald Green */}
                {isSelected && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 md:w-1.5 bg-emerald-600 rounded-r-full" />
                )}

                <div className="flex flex-col md:flex-row items-center md:gap-3 w-full min-w-0">
                  <div
                    className={`w-11 h-11 md:w-9 md:h-9 rounded-2xl md:rounded-xl shrink-0 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-surface-category md:bg-emerald-50 shadow-xs' : 'bg-white/80 md:bg-white shadow-2xs'
                    }`}
                  >
                    {getCategoryIcon(cat.name, isSelected, false, 24)}
                  </div>

                  <span
                    className={`text-[10px] sm:text-[10.5px] md:text-xs leading-tight text-center md:text-left mt-1 md:mt-0 w-full md:w-auto line-clamp-2 md:line-clamp-1 px-0.5 md:px-0 ${
                      isSelected ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'
                    }`}
                  >
                    {cat.name}
                  </span>
                </div>

                <ChevronRight className="hidden md:block w-4 h-4 text-neutral-400 shrink-0 ml-1" />
              </button>
            );
          })}
        </aside>

        {/* Right Column: Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white p-3 sm:p-5 md:p-6 lg:p-8">
          {selectedCategory === 'for-you' ? (
            /* ======================================================= */
            /* "FOR YOU" CONTENT PANE                                  */
            /* ======================================================= */
            <div className="space-y-6 md:space-y-8 pb-20 md:pb-8 max-w-6xl">
              {/* Section 1: Popular Store */}
              <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h2 className="text-sm sm:text-base md:text-lg font-bold text-neutral-900 tracking-tight">
                    Popular Stores
                  </h2>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
                  {displayStores.map((store, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate('/shop')}
                      className="bg-neutral-50/80 hover:bg-neutral-100/80 border border-neutral-200/60 hover:border-emerald-300 rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-between text-center transition-all duration-200 group cursor-pointer aspect-square shadow-2xs hover:shadow-md"
                    >
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${store.iconColor} group-hover:scale-105 transition-transform`}
                      >
                        <Store className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="w-full">
                        <span className="text-[9px] sm:text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-full uppercase tracking-tight block truncate mb-0.5">
                          {store.tag}
                        </span>
                        <p className="text-[10.5px] sm:text-[11.5px] md:text-xs font-bold text-neutral-800 leading-tight truncate">
                          {store.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 2: New & Upcoming Launches */}
              <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h2 className="text-sm sm:text-base md:text-lg font-bold text-neutral-900 tracking-tight">
                    New & Upcoming Launches
                  </h2>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
                  {products.slice(0, 11).map((p, idx) => {
                    const hasImage = p.image_urls && p.image_urls.length > 0;
                    const badges = ['BUY NOW', 'NEW', 'TOP PICK', 'POPULAR', 'SALE IS LIVE'];
                    const badgeText = badges[idx % badges.length];

                    return (
                      <Link
                        key={p.product_id}
                        to={`/product/${p.product_id}`}
                        state={{ product: p }}
                        className="flex flex-col items-center group cursor-pointer"
                      >
                        <div className="w-full relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/60 shadow-2xs group-hover:shadow-md transition-all">
                          {hasImage ? (
                            <img
                              src={p.image_urls[0]}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-neutral-100">
                              📦
                            </div>
                          )}

                          {/* Launch Badge */}
                          <div className="absolute bottom-1.5 left-1 right-1 flex justify-center">
                            <span className="bg-emerald-700 text-white text-[8px] sm:text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-xs tracking-wider uppercase truncate max-w-full">
                              {badgeText}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10.5px] sm:text-xs md:text-sm font-semibold text-neutral-800 text-center leading-tight truncate w-full mt-1.5 group-hover:text-emerald-700 transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[10.5px] sm:text-xs md:text-sm font-bold text-neutral-900">
                          {formatINR(p.base_price)}
                        </p>
                      </Link>
                    );
                  })}

                  {/* "View All" Button Tile */}
                  <Link
                    to="/shop"
                    className="flex flex-col items-center justify-center aspect-[4/5] rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400 transition-all group cursor-pointer"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                      <ArrowDown className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-emerald-800 mt-2">
                      View All
                    </span>
                  </Link>
                </div>
              </section>

              {/* Section 3: Featured Artisans & Picks */}
              <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h2 className="text-sm sm:text-base md:text-lg font-bold text-neutral-900 tracking-tight">
                    Featured Artisans & Picks
                  </h2>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
                  {products.slice(11, 23).map((p) => {
                    const hasImage = p.image_urls && p.image_urls.length > 0;
                    return (
                      <Link
                        key={p.product_id}
                        to={`/product/${p.product_id}`}
                        state={{ product: p }}
                        className="flex flex-col group cursor-pointer"
                      >
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/60 shadow-2xs group-hover:shadow-md transition-all">
                          {hasImage ? (
                            <img
                              src={p.image_urls[0]}
                              alt={p.name}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                                (p.stock_quantity === false || (p.stock_quantity as any) === 0) ? 'opacity-70' : ''
                              }`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-neutral-100">
                              📦
                            </div>
                          )}

                          {/* Out of Stock badge */}
                          {(p.stock_quantity === false || (p.stock_quantity as any) === 0) && (
                            <div className="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs tracking-wider z-10">
                              Out of Stock
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] md:text-xs font-bold text-neutral-900 truncate mt-1 group-hover:text-emerald-700 transition-colors">
                          {p.seller?.business_name || 'Artisan'}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate leading-tight">{p.name}</p>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <p className="text-[10.5px] sm:text-xs font-bold text-neutral-900">
                            {formatINR(p.base_price)}
                          </p>
                          {(p.stock_quantity === false || (p.stock_quantity as any) === 0) && (
                            <span className="text-[8.5px] font-bold text-rose-600">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            /* ======================================================= */
            /* CATEGORY SPECIFIC CONTENT PANE                          */
            /* ======================================================= */
            <div className="space-y-6 md:space-y-8 pb-20 md:pb-8 max-w-6xl">
              {/* Category Header Banner */}
              <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200/70 p-3.5 sm:p-5 rounded-2xl">
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-neutral-900">
                    {selectedCatObj?.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    Explore handcrafted collections & essentials
                  </p>
                </div>
                <Link
                  to={`/shop/category/${selectedCategory}`}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Subcategories (L2) Grid */}
              {subCategories.length > 0 && (
                <section>
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-neutral-900 mb-3 uppercase tracking-wide">
                    Subcategories
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
                    {subCategories.map((subCat) => (
                      <Link
                        key={subCat.category_id}
                        to={`/shop/category/${selectedCategory}/${subCat.category_id}`}
                        className="bg-neutral-50/80 hover:bg-emerald-50/40 border border-neutral-200/60 hover:border-emerald-300/80 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 group cursor-pointer aspect-square shadow-2xs hover:shadow-md"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                          {getCategoryIcon(subCat.name, false, false, 28)}
                        </div>
                        <span className="text-[10.5px] sm:text-[11.5px] md:text-xs font-semibold text-neutral-800 group-hover:text-emerald-800 mt-2 line-clamp-2 leading-tight">
                          {subCat.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Top Products in this Category */}
              <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-neutral-900 uppercase tracking-wide">
                    Top Products in {selectedCatObj?.name}
                  </h3>
                </div>

                {loading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4 py-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <div
                        key={n}
                        className="bg-neutral-100 rounded-xl aspect-[4/5] animate-pulse"
                      />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
                    {products.map((p) => {
                      const hasImage = p.image_urls && p.image_urls.length > 0;
                      return (
                        <Link
                          key={p.product_id}
                          to={`/product/${p.product_id}`}
                          state={{ product: p }}
                          className="flex flex-col group cursor-pointer"
                        >
                          <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/60 shadow-2xs group-hover:shadow-md transition-all">
                            {hasImage ? (
                              <img
                                src={p.image_urls[0]}
                                alt={p.name}
                                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                                  (p.stock_quantity === false || (p.stock_quantity as any) === 0) ? 'opacity-70' : ''
                                }`}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-neutral-100">
                                📦
                              </div>
                            )}

                            {/* Out of Stock badge */}
                            {(p.stock_quantity === false || (p.stock_quantity as any) === 0) && (
                              <div className="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs tracking-wider z-10">
                                Out of Stock
                              </div>
                            )}

                            {/* Rating badge */}
                            <div className="absolute bottom-1 left-1 bg-white/95 backdrop-blur-xs px-1 py-0.2 rounded text-[9px] font-bold text-neutral-800 flex items-center gap-0.5 shadow-2xs">
                              <span>4.2</span>
                              <span className="text-emerald-600 text-[8px]">★</span>
                            </div>
                          </div>

                          <div className="pt-1">
                            <p className="text-[10.5px] sm:text-[11px] md:text-xs font-bold text-neutral-900 truncate group-hover:text-emerald-700 transition-colors">
                              {p.seller?.business_name || 'Artisan'}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate leading-tight">
                              {p.name}
                            </p>
                            <div className="flex items-baseline justify-between mt-0.5">
                              <div className="flex items-baseline gap-1">
                                {p.mrp && p.mrp > p.base_price && (
                                  <span className="text-[9.5px] text-neutral-400 line-through">
                                    {formatINR(p.mrp)}
                                  </span>
                                )}
                                <span className="text-[10.5px] sm:text-xs font-bold text-neutral-900">
                                  {formatINR(p.base_price)}
                                </span>
                              </div>
                              {(p.stock_quantity === false || (p.stock_quantity as any) === 0) && (
                                <span className="text-[8.5px] font-bold text-rose-600">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500">
                      No products found in this category yet.
                    </p>
                  </div>
                )}
              </section>

              {/* Full Category View Button */}
              <Link
                to={`/shop/category/${selectedCategory}`}
                className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <span>View All {selectedCatObj?.name} Products</span>
                <ChevronRight className="w-4 h-4 text-emerald-700" />
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
