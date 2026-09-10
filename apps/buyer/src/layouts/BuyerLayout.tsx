import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShoppingCart, ShoppingBag, Search, Heart, Bell, User, LogOut, Menu, X,
  Home, Grid3X3, LayoutGrid, Package, Store, Moon, Sun, ChevronRight, ArrowLeft,
  Sparkles, HelpCircle, Settings, MapPin, Wallet, FileText
} from 'lucide-react';
import { useAuth } from '../core/contexts/AuthContext';
import { useCart } from '../core/contexts/CartContext';
import { supabase } from '../core/contexts/AuthContext';
import { getCategoryIcon } from '../components/CategoryIcons';

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
  const [categories, setCategories] = useState<any[]>([]);

  const isAuthPage = location.pathname.startsWith('/login');
  const isProfilePage = location.pathname.startsWith('/profile');
  const isCheckoutPage = location.pathname.startsWith('/checkout');
  const isProductDetail = /^\/product\/[^/]+$/.test(location.pathname);
  const isCartPage = location.pathname.startsWith('/cart');
  const isCategoriesPage = location.pathname === '/shop' || location.pathname === '/categories';
  const isHome = location.pathname === '/';

  useEffect(() => {
    supabase.from('categories').select('*').eq('level', 1).order('display_order')
      .then(({ data }) => setCategories(data ?? []));
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
      {!isProductDetail && !isCheckoutPage && !isCartPage && !isCategoriesPage && (
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
            <Link to="/" className="shrink-0 flex items-center pl-0.5">
              <img
                src="/logo.png"
                alt="YYMEE"
                className="h-6 sm:h-7 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.logo-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'logo-fallback flex items-center gap-1 font-black text-base text-neutral-900 tracking-tight';
                    fallback.innerHTML = '<span class="text-emerald-600">YY</span>MEE';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </Link>

            {/* Search Bar */}
            {!isProfilePage && (
              <form onSubmit={handleSearch} className="flex-1 min-w-0">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none stroke-[2]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm bg-surface-input text-neutral-800 placeholder:text-neutral-400 border border-neutral-200/70 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  />
                </div>
              </form>
            )}

            {/* Right Action Icons: Notification Bell & Cart */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors relative cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-neutral-700 stroke-[1.8]" />
              </button>

              <Link
                to="/cart"
                className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors relative flex items-center justify-center cursor-pointer"
                title="Shopping Bag"
                aria-label="Shopping Bag"
              >
                <ShoppingBag className="w-5 h-5 text-neutral-800 stroke-[1.8]" />
                {items.length > 0 && (
                  <span className="absolute top-1 right-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {items.length}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Category Tabs (below header, hidden on profile/checkout/cart/categories) */}
      {!isProfilePage && !isCheckoutPage && !isProductDetail && !isCartPage && !isCategoriesPage && categories.length > 0 && (
        <div className={`border-b ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'} sticky top-0 md:top-[53px] z-20`}>
          <div
            className="max-w-7xl mx-auto flex items-center overflow-x-auto scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {/* For You Tab */}
            <Link
              to="/"
              className="relative px-4 py-3 shrink-0 text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <span className={isHome ? 'text-brand-600' : 'text-neutral-600 hover:text-neutral-900'}>
                For You
              </span>
              {isHome && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-500 rounded-full" />
              )}
            </Link>

            {/* Dynamic Categories */}
            {categories.map((cat) => {
              const isActive = location.pathname === `/shop/category/${cat.category_id}`;
              return (
                <Link
                  key={cat.category_id}
                  to={`/shop/category/${cat.category_id}`}
                  className="relative px-4 py-3 shrink-0 text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <span className={isActive ? 'text-brand-600' : 'text-neutral-600 hover:text-neutral-900'}>
                    {cat.name}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-500 rounded-full" />
                  )}
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
          <Link to={session ? '/profile' : '/login'} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/profile')}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Account</span>
          </Link>
          <Link to="/cart" className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/cart')}`}>
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
