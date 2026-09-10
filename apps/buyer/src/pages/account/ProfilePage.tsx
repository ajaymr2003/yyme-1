import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useAuth } from '../../core/contexts/AuthContext';
import {
  User, Package, Heart, MapPin, Bell, Settings, HelpCircle,
  ChevronRight, LogOut, Phone, Edit3, Star, Clock, Wallet,
  FileText, Globe, Shield, AlertTriangle
} from 'lucide-react';

interface Address {
  address_id: string;
  label: string;
  full_address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface Order {
  order_id: string;
  created_at: string;
  status: string;
  total_amount: number;
}

interface WishlistItem {
  favorite_id: string;
  product_id: string;
  name: string;
  price: number;
  image_urls: string[];
  seller_name: string;
}

export function ProfilePage() {
  const { session, buyerProfile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [session, authLoading]);

  async function fetchData() {
    if (!session?.user?.id) return;
    setLoading(true);

    try {
      // Fetch buyer profile
      const { data: buyer } = await supabase
        .from('buyers')
        .select('buyer_id, user_id, full_name, default_address_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // Fetch addresses
      if (buyer?.buyer_id) {
        const { data: addr } = await supabase
          .from('addresses')
          .select('*')
          .eq('buyer_id', buyer.buyer_id)
          .order('is_default', { ascending: false });
        setAddresses(addr ?? []);

        // Fetch recent orders
        const { data: ord } = await supabase
          .from('orders')
          .select('order_id, created_at, status, total_amount')
          .eq('buyer_id', buyer.buyer_id)
          .order('created_at', { ascending: false })
          .limit(5);
        setOrders(ord ?? []);

        // Fetch wishlist
        const { data: fav } = await supabase
          .from('favorites')
          .select('favorite_id, product_id, products(name, base_price, image_urls, sellers(business_name))')
          .eq('buyer_id', buyer.buyer_id)
          .limit(10);

        const wishlistItems = (fav ?? []).map((f: any) => ({
          favorite_id: f.favorite_id,
          product_id: f.product_id,
          name: f.products?.name || 'Product',
          price: f.products?.base_price || 0,
          image_urls: f.products?.image_urls ?? [],
          seller_name: f.products?.sellers?.business_name || 'Seller',
        }));
        setWishlist(wishlistItems);
      }
    } catch (e) {
      console.warn('Error fetching profile data:', e);
    }
    setLoading(false);
  }

  const handleNameSave = async () => {
    if (!newName.trim() || !session?.user?.id) return;
    const { data: buyer } = await supabase
      .from('buyers')
      .select('buyer_id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (buyer) {
      await supabase.from('buyers').update({ full_name: newName.trim() }).eq('buyer_id', buyer.buyer_id);
    }
    setEditingName(false);
    fetchData();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuSections = [
    {
      title: 'My Activity',
      items: [
        { icon: <Package className="w-5 h-5" />, label: 'My Orders', path: '/orders', color: 'text-blue-600 bg-blue-50' },
        { icon: <Heart className="w-5 h-5" />, label: 'Wishlist', path: '/wishlist', color: 'text-pink-600 bg-pink-50' },
        { icon: <Clock className="w-5 h-5" />, label: 'Recently Viewed', action: () => {}, color: 'text-amber-600 bg-amber-50' },
      ]
    },
    {
      title: 'Account Settings',
      items: [
        { icon: <MapPin className="w-5 h-5" />, label: 'Saved Addresses', action: () => setActiveTab('addresses'), color: 'text-emerald-600 bg-emerald-50' },
        { icon: <Bell className="w-5 h-5" />, label: 'Notifications', action: () => setActiveTab('notifications'), color: 'text-purple-600 bg-purple-50' },
        { icon: <Globe className="w-5 h-5" />, label: 'Language', action: () => setActiveTab('language'), color: 'text-cyan-600 bg-cyan-50' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: <HelpCircle className="w-5 h-5" />, label: 'Help & Support', action: () => setActiveTab('support'), color: 'text-orange-600 bg-orange-50' },
        { icon: <FileText className="w-5 h-5" />, label: 'About YYME', path: '/about', color: 'text-indigo-600 bg-indigo-50' },
      ]
    }
  ];

  const renderSubPage = () => {
    switch (activeTab) {
      case 'addresses':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Saved Addresses</h3>
              <button className="text-xs font-semibold text-emerald-600 hover:underline">+ Add New</button>
            </div>
            {addresses.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
                <MapPin className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-600">No saved addresses</p>
                <p className="text-xs text-neutral-400 mt-1">Add a delivery address for faster checkout</p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div key={addr.address_id} className={`bg-white border rounded-xl p-4 ${addr.is_default ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-neutral-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-neutral-900">{addr.label || 'Home'}</p>
                      <p className="text-xs text-neutral-600 mt-1">{addr.full_address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                    {addr.is_default && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">DEFAULT</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold">Notification Preferences</h3>
            <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {[
                { label: 'Order Updates', desc: 'Status changes, delivery tracking' },
                { label: 'Promotional Offers', desc: 'Deals, new arrivals, collections' },
                { label: 'Seller Messages', desc: 'Direct messages from sellers' },
                { label: 'Price Alerts', desc: 'Wishlist item price drops' },
              ].map((pref, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{pref.label}</p>
                    <p className="text-[11px] text-neutral-500">{pref.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={idx < 2} className="sr-only peer" />
                    <div className="w-9 h-5 bg-neutral-300 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold">Language</h3>
            <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {[
                { code: 'en', name: 'English', native: 'English' },
                { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
                { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
                { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
              ].map((lang) => (
                <button key={lang.code} className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{lang.name}</p>
                    <p className="text-[11px] text-neutral-500">{lang.native}</p>
                  </div>
                  {lang.code === 'en' && <span className="text-emerald-600 font-bold text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-bold">Help & Support</h3>
            <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Help Desk</p>
                  <p className="text-xs text-neutral-500">+91 1800-200-9900 (Toll Free)</p>
                  <p className="text-[10px] text-neutral-400">Mon-Sat 9am-6pm</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Email Support</p>
                  <p className="text-xs text-neutral-500">support@yyme.in</p>
                  <p className="text-[10px] text-neutral-400">24hr response time</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const userName = buyerProfile?.full_name || 'User';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // If a sub-page is active, show it
  if (activeTab !== 'home') {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setActiveTab('home')} className="text-xs font-semibold text-emerald-600 hover:underline mb-4 flex items-center gap-1">
          ← Back to Profile
        </button>
        {renderSubPage()}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Profile Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center border-2 border-emerald-200">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-emerald-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
                <button onClick={handleNameSave} className="text-xs font-bold text-emerald-600 hover:underline">Save</button>
                <button onClick={() => setEditingName(false)} className="text-xs text-neutral-400 hover:text-neutral-600">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 truncate">{userName}</h2>
                <button onClick={() => { setNewName(userName); setEditingName(true); }} className="text-neutral-400 hover:text-emerald-600">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-neutral-500 mt-0.5">{session.user?.phone || session.user?.email}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-neutral-100">
          <div className="text-center">
            <p className="text-lg font-black text-emerald-700">{orders.length}</p>
            <p className="text-[10px] text-neutral-500 font-medium">Orders</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-pink-600">{wishlist.length}</p>
            <p className="text-[10px] text-neutral-500 font-medium">Wishlist</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-blue-600">{addresses.length}</p>
            <p className="text-[10px] text-neutral-500 font-medium">Addresses</p>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{section.title}</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {section.items.map((item) => (
              <button
                key={item.label}
                onClick={() => item.path ? navigate(item.path) : item.action?.()}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <span className="flex-1 text-xs font-semibold text-neutral-900">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-50 transition-colors shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </button>

      <p className="text-center text-[10px] text-neutral-400 pb-4">
        YYME v1.0 · Direct Artisan Marketplace
      </p>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Log Out?</h3>
            <p className="text-sm text-neutral-600">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-sm font-semibold text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors">Cancel</button>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors">Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
