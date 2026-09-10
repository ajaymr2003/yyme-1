import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShoppingCart, Search, Heart, Bell, User, LogOut, Menu, X,
  Home, Grid3X3, Package, Store, Moon, Sun, ChevronRight,
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
    return location.pathname === path ? 'text-emerald-600' : 'text-neutral-400';
  };

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-neutral-900 text-white' : 'bg-stone-100 text-neutral-900'}`}>
      {/* Announcement Ticker */}
      {!isProfilePage && !isCheckoutPage && (
        <div className="bg-emerald-600 text-white text-[11px] font-semibold py-1 px-4 overflow-hidden tracking-wide text-center">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Free shipping on your first purchase
          </span>
        </div>
      )}

      {/* Header */}
      {!isProductDetail && !isCheckoutPage && (
        <header className={`${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'} border-b sticky top-0 z-30`}>
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">Y</span>
              </div>
              <span className="text-lg font-black tracking-tight hidden sm:block">YYMEE</span>
            </Link>

            {/* Search Bar */}
            {!isProfilePage && (
              <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 border ${
                      isDarkMode
                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-900 placeholder-neutral-500'
                    }`}
                  />
                </div>
              </form>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-neutral-700' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`}
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <Link to="/wishlist" className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-neutral-300 hover:bg-neutral-700' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`} title="Wishlist">
                <Heart className="w-5 h-5" />
              </Link>

              <Link to="/cart" className={`relative p-2 rounded-lg transition-colors ${isDarkMode ? 'text-neutral-300 hover:bg-neutral-700' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`} title="Cart">
                <ShoppingCart className="w-5 h-5" />
                {items.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>

              {session ? (
                <Link to="/profile" className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-neutral-300 hover:bg-neutral-700' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`} title="Profile">
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                <a href="/login" className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                  Sign In
                </a>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg lg:hidden transition-colors ${isDarkMode ? 'text-neutral-300 hover:bg-neutral-700' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Category Tabs (below header, hidden on profile/checkout) */}
      {!isProfilePage && !isCheckoutPage && !isProductDetail && categories.length > 0 && (
        <div className={`border-b ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'} sticky top-[53px] z-20`}>
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto scrollbar-none">
            <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-emerald-600 text-white shrink-0">
              <Home className="w-3.5 h-3.5" />
              For You
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                to={`/shop/category/${cat.category_id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-neutral-100 text-neutral-600 hover:bg-neutral-200 shrink-0"
              >
                {getCategoryIcon(cat.name, false, isDarkMode)}
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${!isProfilePage && !isCheckoutPage ? 'pb-16' : ''}`}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      {!isCheckoutPage && (
        <nav className={`fixed bottom-0 left-0 right-0 border-t flex items-center justify-around px-2 py-1.5 z-30 ${
          isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
        }`}>
          <Link to="/" className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/')}`}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/shop" className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/shop')}`}>
            <Grid3X3 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Categories</span>
          </Link>
          <Link to="/cart" className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/cart')}`}>
            <ShoppingCart className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute top-0 right-2 bg-emerald-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {items.length}
              </span>
            )}
            <span className="text-[10px] font-medium">Cart</span>
          </Link>
          <Link to={session ? '/profile' : '/login'} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${activeNav('/profile')}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Account</span>
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
