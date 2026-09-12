import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShoppingCart, ShoppingBag, Search, Heart, Bell, User, LogOut, Menu, X,
  Home, Grid3X3, LayoutGrid, Package, Store, Moon, Sun, ChevronRight, ChevronDown, ArrowLeft,
  Sparkles, HelpCircle, Settings, MapPin, Wallet, FileText
} from 'lucide-react';
import { useAuth, supabase } from '../core/contexts/AuthContext';
import { useCart } from '../core/contexts/CartContext';
import { getCategoryIcon, BagIcon } from '../components/CategoryIcons';

import { cacheService, CACHE_KEYS, CACHE_TTL } from '../core/services/cacheService';

export function BuyerLayout() {
  const { session, buyerProfile, signOut } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('yyme_buyer_dark_mode') === 'true';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>(() => {
    const cached = cacheService.get<any[]>(CACHE_KEYS.CATEGORIES_L1, true);
    return cached ? cached.data : [];
  });
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAccountMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setAccountMenuOpen(true);
  };

  const handleAccountMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setAccountMenuOpen(false);
    }, 200);
  };

  // Close account dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isAuthPage = location.pathname.startsWith('/login');
  const isProfilePage = location.pathname.startsWith('/profile');
  const isCheckoutPage = location.pathname.startsWith('/checkout');
  const isProductDetail = /^\/product\/[^/]+$/.test(location.pathname);
  const isCartPage = location.pathname.startsWith('/cart');
  const isCategoriesPage = location.pathname === '/shop' || location.pathname === '/categories';
  const isHome = location.pathname === '/';

  useEffect(() => {
    cacheService
      .fetchWithCache(
        CACHE_KEYS.CATEGORIES_L1,
        async () => {
          const { data } = await supabase.from('categories').select('*').eq('level', 1).order('display_order');
          return data ?? [];
        },
        { ttl: CACHE_TTL.LONG, onBackgroundUpdate: (fresh) => setCategories(fresh) }
      )
      .then((data) => setCategories(data));
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('yyme_buyer_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const activeNav = (path: string) => {
    if (path === '/shop') {
      return location.pathname === '/shop' || location.pathname === '/categories' ? 'text-emerald-600' : 'text-neutral-400';
    }
    return location.pathname === path ? 'text-emerald-600' : 'text-neutral-400';
  };

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-neutral-900 text-white' : 'bg-surface-warm text-neutral-900'}`}>
      {/* Header */}
      {!isProductDetail && !isCheckoutPage && !isCategoriesPage && (
        <header className="sticky top-0 z-30 bg-white border-t-[3px] border-icon-accent border-b border-neutral-200/80">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 sm:gap-4">
            {/* Mobile Back Button (on non-home pages) */}
            {!isHome && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-1.5 -ml-1 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors shrink-0 md:hidden cursor-pointer"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="shrink-0 flex items-center gap-1.5 sm:gap-2 pl-0.5 group">
              <img
                src="/logo_only.png"
                alt="YYMEE Logo"
                className="h-7 sm:h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <img
                src="/name_only.png"
                alt="YYMEE"
                className="h-4 sm:h-5 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Search Bar (Flipkart Style with Blue Border) */}
            <form onSubmit={handleSearch} className="flex-1 min-w-0">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none stroke-[2]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Products, Brands and More"
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm bg-white text-neutral-900 placeholder:text-neutral-500 border border-[#166534] focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </form>

            {/* Right Action Buttons Row (Flipkart-Style) */}
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              {/* Button 1 (YYMEE) with Dropdown */}
              <div
                ref={accountMenuRef}
                className="relative"
                onMouseEnter={handleAccountMouseEnter}
                onMouseLeave={handleAccountMouseLeave}
              >
                <button
                  type="button"
                  id="header-btn-1"
                  onClick={() => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                    setAccountMenuOpen((prev) => !prev);
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    accountMenuOpen
                      ? 'text-[#2874f0] bg-blue-50/70'
                      : 'text-neutral-800 hover:text-[#2874f0] hover:bg-blue-50/60'
                  }`}
                >
                  <User className="w-4 h-4 text-neutral-700 stroke-[2]" />
                  <span>YYMEE</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 stroke-[2.5] transition-transform duration-200 ${accountMenuOpen ? 'rotate-180 text-emerald-700' : ''}`} />
                </button>

                {/* Dropdown Menu (YYME Green Style) */}
                {accountMenuOpen && (
                  <div
                    onMouseEnter={handleAccountMouseEnter}
                    onMouseLeave={handleAccountMouseLeave}
                    className="absolute right-0 sm:left-0 sm:right-auto top-full pt-1.5 w-56 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.14)] border border-neutral-100 py-2">
                      {/* Header */}
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-xs font-bold text-neutral-900 tracking-tight">Your Account</p>
                        {buyerProfile?.full_name && (
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">{buyerProfile.full_name}</p>
                        )}
                      </div>

                    <div className="py-1">
                      {/* My Profile */}
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          if (!session) {
                            navigate('/login?redirect=/profile');
                          } else {
                            navigate('/profile');
                          }
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-700 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors cursor-pointer text-left"
                      >
                        <User className="w-4 h-4 text-neutral-600 stroke-[1.8]" />
                        <span>My Profile</span>
                      </button>

                      {/* Orders */}
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          if (!session) {
                            navigate('/login?redirect=/orders');
                          } else {
                            navigate('/orders');
                          }
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-700 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors cursor-pointer text-left"
                      >
                        <Package className="w-4 h-4 text-neutral-600 stroke-[1.8]" />
                        <span>Orders</span>
                      </button>

                      {/* Wishlist */}
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          if (!session) {
                            navigate('/login?redirect=/wishlist');
                          } else {
                            navigate('/wishlist');
                          }
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-700 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors cursor-pointer text-left"
                      >
                        <Heart className="w-4 h-4 text-neutral-600 stroke-[1.8]" />
                        <span>Wishlist</span>
                      </button>

                      {/* Notifications */}
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          if (!session) {
                            navigate('/login?redirect=/notifications');
                          } else {
                            navigate('/notifications');
                          }
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-700 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors cursor-pointer text-left"
                      >
                        <Bell className="w-4 h-4 text-neutral-600 stroke-[1.8]" />
                        <span>Notifications</span>
                      </button>

                      {/* Become a Seller */}
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          const sellerUrl = (import.meta.env.VITE_SELLER_URL as string) || 'http://localhost:5174';
                          const buyerId = buyerProfile?.buyer_id || '';
                          const userId = session?.user?.id || buyerProfile?.user_id || '';
                          const params = new URLSearchParams();
                          if (buyerId) params.set('buyer_id', buyerId);
                          if (userId) params.set('user_id', userId);
                          params.set('from', 'buyer');
                          const targetUrl = `${sellerUrl}/landing?${params.toString()}`;
                          console.log('[Become a Seller] Desktop button clicked:', {
                            buyerId,
                            userId,
                            sellerUrl,
                            targetUrl,
                            hasSession: Boolean(session),
                          });
                          window.location.href = targetUrl;
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-700 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors cursor-pointer text-left"
                      >
                        <Store className="w-4 h-4 text-neutral-600 stroke-[1.8]" />
                        <span>Become a Seller</span>
                      </button>

                      {/* Logout */}
                      <div className="border-t border-neutral-100 my-1 pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            setAccountMenuOpen(false);
                            if (session) {
                              await signOut();
                              navigate('/login');
                            } else {
                              navigate('/login');
                            }
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-700 hover:text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4 text-neutral-600 group-hover:text-rose-600 stroke-[1.8]" />
                          <span>{session ? 'Logout' : 'Login'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>


              {/* Cart Button */}
              <button
                type="button"
                id="header-btn-cart"
                onClick={() => {
                  if (!session) {
                    navigate('/login?redirect=/cart');
                  } else {
                    navigate('/cart');
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-800 hover:text-[#2874f0] hover:bg-blue-50/60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <div className="relative flex items-center">
                  <ShoppingCart className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-800 stroke-[2]" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center leading-none shadow-xs">
                      {items.length}
                    </span>
                  )}
                </div>
                <span>Cart</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Category Tabs (below header, hidden on profile/checkout/cart/categories) */}
      {!isProfilePage && !isCheckoutPage && !isProductDetail && !isCartPage && !isCategoriesPage && categories.length > 0 && (
        <div className={`py-1.5 border-b shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-colors duration-200 sticky top-0 md:top-[53px] z-20 ${
          isDarkMode ? 'bg-[#1F2937] border-neutral-800' : 'bg-white border-neutral-100'
        }`}>
          <div
            className="max-w-7xl mx-auto px-4 flex items-start gap-4 sm:gap-6 overflow-x-auto scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {/* For You Tab */}
            <Link
              to="/"
              className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] group shrink-0 cursor-pointer"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isHome ? 'bg-[#7a9488]' : ''}`}>
                {getCategoryIcon('For You', isHome, isDarkMode, 34)}
              </div>
              <span className={`text-[10px] sm:text-[11px] truncate max-w-[60px] text-center transition-colors ${
                isHome ? 'font-bold text-neutral-900' : 'text-neutral-600 font-medium'
              }`}>
                For You
              </span>
              {isHome && <span className="h-[2px] w-full bg-[#10B981] rounded-full" />}
            </Link>

            {/* Dynamic Categories */}
            {categories.map((cat) => {
              const isActive = location.pathname === `/shop/category/${cat.category_id}`;
              return (
                <Link
                  key={cat.category_id}
                  to={`/shop/category/${cat.category_id}`}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] group shrink-0 cursor-pointer"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-[#7a9488]' : ''}`}>
                    {getCategoryIcon(cat.name, isActive, isDarkMode, 34)}
                  </div>
                  <span className={`text-[10px] sm:text-[11px] truncate max-w-[60px] text-center transition-colors ${
                    isActive ? 'font-bold text-neutral-900' : 'text-neutral-600 font-medium'
                  }`}>
                    {cat.name}
                  </span>
                  {isActive && <span className="h-[2px] w-full bg-[#10B981] rounded-full" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isCategoriesPage ? 'overflow-hidden pb-14 md:pb-0 flex flex-col' : 'overflow-y-auto'} ${!isProfilePage && !isCheckoutPage && !isCategoriesPage ? 'pb-16 md:pb-0' : ''}`}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation (hidden on product details, checkout, and desktop view) */}
      {!isCheckoutPage && !isProductDetail && (
        <nav className={`fixed bottom-0 left-0 right-0 border-t flex items-center justify-around px-2 py-1.5 z-30 md:hidden ${
          isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
        }`}>
          <Link to="/" className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/')}`}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/shop" className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/shop')}`}>
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-medium">Categories</span>
          </Link>
          <Link to={session ? '/profile' : '/login?redirect=/profile'} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/profile')}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Account</span>
          </Link>
          <Link to={session ? '/cart' : '/login?redirect=/cart'} className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/cart')}`}>
            <ShoppingCart className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute top-0 right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                {items.length}
              </span>
            )}
            <span className="text-[10px] font-medium">Cart</span>
          </Link>
        </nav>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
          <div className={`fixed top-0 left-0 bottom-0 w-72 z-50 shadow-2xl ${isDarkMode ? 'bg-neutral-800' : 'bg-white'} overflow-y-auto`}>
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {session ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                    {buyerProfile?.full_name?.charAt(0) || 'U'}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold">{session ? (buyerProfile?.full_name || 'User') : 'Guest User'}</p>
                  <p className="text-[11px] text-neutral-500">{session ? 'Member' : 'Sign in for benefits'}</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Menu Items */}
            <div className="p-3">
              {[
                { icon: <User className="w-5 h-5" />, label: 'My Profile', path: '/profile' },
                { icon: <Heart className="w-5 h-5" />, label: 'Wishlist', path: '/wishlist' },
                { icon: <Package className="w-5 h-5" />, label: 'My Orders', path: '/orders' },
                { icon: <Wallet className="w-5 h-5" />, label: 'Payments', path: '/payments' },
                { icon: <Bell className="w-5 h-5" />, label: 'Notifications', path: '/notifications' },
                { icon: <HelpCircle className="w-5 h-5" />, label: 'Help & Support', path: '/support' },
                { icon: <FileText className="w-5 h-5" />, label: 'About YYME', path: '/about' },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-100 transition-colors"
                >
                  <span className="text-neutral-500">{item.icon}</span>
                  {item.label}
                  <ChevronRight className="w-4 h-4 text-neutral-400 ml-auto" />
                </Link>
              ))}

              <div className="my-3 border-t border-neutral-200" />

              {/* Become a Seller */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  const sellerUrl = (import.meta.env.VITE_SELLER_URL as string) || 'http://localhost:5174';
                  const buyerId = buyerProfile?.buyer_id || '';
                  const userId = session?.user?.id || buyerProfile?.user_id || '';
                  const params = new URLSearchParams();
                  if (buyerId) params.set('buyer_id', buyerId);
                  if (userId) params.set('user_id', userId);
                  params.set('from', 'buyer');
                  const targetUrl = `${sellerUrl}/landing?${params.toString()}`;
                  console.log('[Become a Seller] Mobile drawer clicked:', {
                    buyerId,
                    userId,
                    sellerUrl,
                    targetUrl,
                    hasSession: Boolean(session),
                  });
                  window.location.href = targetUrl;
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors mb-2"
              >
                <Store className="w-5 h-5 text-emerald-600" />
                <span>Become a Seller</span>
                <ChevronRight className="w-4 h-4 text-emerald-500 ml-auto" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-100 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-neutral-500" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>

              {session && (
                <button
                  onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              )}

              {!session && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors mt-2 justify-center"
                >
                  Sign In / Sign Up
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Log Out</h3>
            <p className="text-sm text-neutral-600">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-semibold text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
