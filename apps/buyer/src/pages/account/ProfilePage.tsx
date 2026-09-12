import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../core/contexts/AuthContext';
import { useAuth } from '../../core/contexts/AuthContext';
import { formatINR } from '@ymenet/utils';
import {
  User,
  Package,
  Heart,
  Bell,
  ChevronRight,
  Power,
  CheckCircle2,
  ExternalLink,
  Store,
  Trash2
} from 'lucide-react';
import { useWishlist } from '../../core/contexts/WishlistContext';

interface Order {
  order_id: string;
  order_number?: string;
  product_id?: string;
  clicked_at?: string;
  created_at?: string;
  status: string;
  item_price: number;
  product_images?: string[];
  product_name?: string;
  seller_name?: string;
}

interface WishlistItem {
  favorite_id: string;
  product_id: string;
  name: string;
  price: number;
  image_urls: string[];
  seller_name: string;
}

export function ProfilePage({ defaultTab }: { defaultTab?: 'profile' | 'orders' | 'wishlist' | 'notifications' }) {
  const { session, user, buyerProfile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route-driven tab mapping
  const getTabFromLocation = (): 'profile' | 'orders' | 'wishlist' | 'notifications' => {
    if (location.pathname === '/orders') return 'orders';
    if (location.pathname === '/wishlist') return 'wishlist';
    if (location.pathname === '/notifications') return 'notifications';
    if (defaultTab) return defaultTab;
    return 'profile';
  };

  // Active tab in layout: 'profile' | 'orders' | 'wishlist' | 'notifications'
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist' | 'notifications'>(getTabFromLocation());

  useEffect(() => {
    setActiveTab(getTabFromLocation());
  }, [location.pathname, defaultTab]);
  const [loading, setLoading] = useState(true);

  // Profile fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('Male');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Editing states
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data lists
  const [orders, setOrders] = useState<Order[]>([]);
  const { items: wishlist, removeFromWishlist } = useWishlist();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate('/login?redirect=/profile');
      return;
    }
    fetchData();
  }, [session, authLoading]);

  // Synchronize names when profile loads
  useEffect(() => {
    if (buyerProfile?.full_name) {
      const parts = buyerProfile.full_name.trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    const currentEmail = user?.email || (session?.user as any)?.email || '';
    setEmail(currentEmail);

    const currentPhone = (session?.user as any)?.phone || user?.phone || '';
    setPhone(currentPhone);
  }, [buyerProfile, user, session]);

  async function fetchData() {
    if (!session?.user?.id) return;
    setLoading(true);

    try {
      // Fetch buyer profile
      const { data: buyer } = await supabase
        .from('buyers')
        .select('buyer_id, user_id, full_name')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (buyer?.buyer_id) {
        // Fetch recent orders
        try {
          const { data: ord, error: ordErr } = await supabase
            .from('orders')
            .select(`
              order_id,
              order_number,
              product_id,
              clicked_at,
              status,
              item_price,
              product_images,
              product:products(name),
              seller:sellers(business_name)
            `)
            .eq('buyer_id', buyer.buyer_id)
            .order('clicked_at', { ascending: false })
            .limit(15);

          if (!ordErr && ord) {
            const mappedOrders: Order[] = ord.map((o: any) => ({
              order_id: o.order_id,
              order_number: o.order_number,
              product_id: o.product_id,
              clicked_at: o.clicked_at,
              status: o.status || 'initiated',
              item_price: o.item_price || 0,
              product_images: Array.isArray(o.product_images) ? o.product_images : [],
              product_name: o.product?.name || 'Handcrafted Item',
              seller_name: o.seller?.business_name || 'Verified Seller'
            }));
            setOrders(mappedOrders);
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Error fetching profile data:', e);
    }
    setLoading(false);
  }

  const handleSavePersonal = async () => {
    if (!firstName.trim()) {
      showToast('First name is required');
      return;
    }
    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const userId = session?.user?.id;
      if (userId) {
        await supabase.from('buyers').update({ full_name: fullName }).eq('user_id', userId);
        showToast('Personal information updated successfully');
      }
      setEditingPersonal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update personal information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      const userId = session?.user?.id;
      if (userId && email.trim()) {
        await supabase.from('users').update({ email: email.trim() }).eq('user_id', userId);
        showToast('Email address updated');
      }
      setEditingEmail(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update email');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhone = async () => {
    setSaving(true);
    try {
      const userId = session?.user?.id;
      if (userId && phone.trim()) {
        await supabase.from('users').update({ phone_number: phone.trim() }).eq('user_id', userId);
        showToast('Mobile number updated');
      }
      setEditingPhone(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update phone');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] bg-[#f1f3f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-neutral-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const displayName = buyerProfile?.full_name || 'YYME Customer';

  return (
    <div className="bg-[#f1f3f6] min-h-screen py-3 sm:py-5 px-2 sm:px-4 lg:px-8">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/95 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 sm:gap-4 items-start">
        
        {/* ================= LEFT SIDEBAR ================= */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 space-y-3">
          
          {/* Card 1: User Greeting Card */}
          <div className="bg-white rounded-xs shadow-xs p-3.5 flex items-center gap-3.5 border border-neutral-200/80">
            {/* YYME Green Avatar */}
            <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <span className="text-lg font-black text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-neutral-500 block leading-tight">Hello,</span>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 truncate leading-tight mt-0.5">
                {displayName}
              </h2>
            </div>
          </div>

          {/* Card 2: Navigation Menu Card */}
          <div className="bg-white rounded-xs shadow-xs border border-neutral-200/80 divide-y divide-neutral-100 overflow-hidden text-xs sm:text-sm">
            
            {/* Section: MY ORDERS */}
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className={`w-full flex items-center justify-between px-4 py-3.5 text-left font-bold transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'text-emerald-800 bg-emerald-50/80'
                  : 'text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-emerald-700 stroke-[2.2]" />
                <span className="tracking-wide uppercase text-xs">MY ORDERS</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'orders' ? 'text-emerald-700' : 'text-neutral-400'}`} />
            </button>

            {/* Section: ACCOUNT SETTINGS */}
            <div className="py-2">
              <div className="flex items-center gap-3 px-4 py-2 text-neutral-500 font-bold uppercase text-[11px] tracking-wider select-none">
                <User className="w-4 h-4 text-emerald-700 stroke-[2.2]" />
                <span>ACCOUNT SETTINGS</span>
              </div>
              <div className="mt-0.5">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className={`w-full text-left pl-11 pr-4 py-2.5 transition-colors cursor-pointer text-xs sm:text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'text-emerald-800 bg-emerald-50/80 font-bold border-l-4 border-emerald-600'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Profile Information
                </button>
              </div>
            </div>

            {/* Section: MY STUFF */}
            <div className="py-2">
              <div className="flex items-center gap-3 px-4 py-2 text-neutral-500 font-bold uppercase text-[11px] tracking-wider select-none">
                <Heart className="w-4 h-4 text-emerald-700 stroke-[2.2]" />
                <span>MY STUFF</span>
              </div>
              <div className="mt-0.5">
                <button
                  type="button"
                  onClick={() => navigate('/wishlist')}
                  className={`w-full text-left pl-11 pr-4 py-2.5 transition-colors cursor-pointer text-xs sm:text-sm font-medium ${
                    activeTab === 'wishlist'
                      ? 'text-emerald-800 bg-emerald-50/80 font-bold border-l-4 border-emerald-600'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  My Wishlist
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/notifications')}
                  className={`w-full text-left pl-11 pr-4 py-2.5 transition-colors cursor-pointer text-xs sm:text-sm font-medium ${
                    activeTab === 'notifications'
                      ? 'text-emerald-800 bg-emerald-50/80 font-bold border-l-4 border-emerald-600'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  All Notifications
                </button>
              </div>
            </div>

            {/* Section: LOGOUT */}
            {/* Section: BECOME A SELLER */}
            <div className="p-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  const sellerUrl = (import.meta.env.VITE_SELLER_URL as string) || 'http://localhost:5174';
                  const buyerId = buyerProfile?.buyer_id || '';
                  const userId = session?.user?.id || buyerProfile?.user_id || '';
                  const params = new URLSearchParams();
                  if (buyerId) params.set('buyer_id', buyerId);
                  if (userId) params.set('user_id', userId);
                  params.set('from', 'buyer');
                  const targetUrl = `${sellerUrl}/landing?${params.toString()}`;
                  console.log('[Become a Seller] ProfilePage button clicked:', {
                    buyerId,
                    userId,
                    sellerUrl,
                    targetUrl,
                    hasSession: Boolean(session),
                  });
                  window.location.href = targetUrl;
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-xs text-emerald-800 font-bold cursor-pointer transition-colors text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-emerald-700 stroke-[2.2]" />
                  <span>Become a Seller</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>

            <div className="p-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-neutral-700 hover:bg-neutral-50 font-semibold cursor-pointer transition-colors text-xs sm:text-sm"
              >
                <Power className="w-4 h-4 text-neutral-400 stroke-[2]" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>

        {/* ================= RIGHT MAIN CONTENT PANE ================= */}
        <div className="flex-1 min-w-0 bg-white rounded-xs shadow-xs border border-neutral-200/80 p-4 sm:p-7 min-h-[550px]">
          
          {/* TAB 1: PROFILE INFORMATION */}
          {activeTab === 'profile' && (
            <div className="space-y-7 max-w-2xl">
              
              {/* Section 1: Personal Information */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    Personal Information
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingPersonal(!editingPersonal)}
                    className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    {editingPersonal ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      disabled={!editingPersonal}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className={`w-full px-4 py-2.5 rounded-xs text-xs sm:text-sm border transition-all ${
                        editingPersonal
                          ? 'border-emerald-600 bg-white text-neutral-900 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none'
                          : 'border-neutral-200 bg-neutral-100/70 text-neutral-800 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      disabled={!editingPersonal}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className={`w-full px-4 py-2.5 rounded-xs text-xs sm:text-sm border transition-all ${
                        editingPersonal
                          ? 'border-emerald-600 bg-white text-neutral-900 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none'
                          : 'border-neutral-200 bg-neutral-100/70 text-neutral-800 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="mt-4">
                  <span className="block text-xs font-semibold text-neutral-600 mb-2">
                    Your Gender
                  </span>
                  <div className="flex items-center gap-6 text-xs sm:text-sm font-medium text-neutral-700">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={gender === 'Male'}
                        disabled={!editingPersonal}
                        onChange={() => setGender('Male')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Male</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={gender === 'Female'}
                        disabled={!editingPersonal}
                        onChange={() => setGender('Female')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Female</span>
                    </label>
                  </div>
                </div>

                {editingPersonal && (
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSavePersonal}
                      className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white px-8 py-2.5 rounded-xs font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all"
                    >
                      {saving ? 'SAVING...' : 'SAVE'}
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2: Email Address */}
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    Email Address
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingEmail(!editingEmail)}
                    className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    {editingEmail ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="max-w-sm">
                  <input
                    type="email"
                    disabled={!editingEmail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className={`w-full px-4 py-2.5 rounded-xs text-xs sm:text-sm border transition-all ${
                      editingEmail
                        ? 'border-emerald-600 bg-white text-neutral-900 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none'
                        : 'border-neutral-200 bg-neutral-100/70 text-neutral-800 cursor-not-allowed'
                    }`}
                  />
                </div>

                {editingEmail && (
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveEmail}
                      className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white px-8 py-2.5 rounded-xs font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all"
                    >
                      {saving ? 'SAVING...' : 'SAVE'}
                    </button>
                  </div>
                )}
              </div>

              {/* Section 3: Mobile Number */}
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    Mobile Number
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingPhone(!editingPhone)}
                    className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    {editingPhone ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="max-w-sm">
                  <input
                    type="tel"
                    disabled={!editingPhone}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 Mobile number"
                    className={`w-full px-4 py-2.5 rounded-xs text-xs sm:text-sm border transition-all ${
                      editingPhone
                        ? 'border-emerald-600 bg-white text-neutral-900 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none'
                        : 'border-neutral-200 bg-neutral-100/70 text-neutral-800 cursor-not-allowed'
                    }`}
                  />
                </div>

                {editingPhone && (
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSavePhone}
                      className="bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white px-8 py-2.5 rounded-xs font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all"
                    >
                      {saving ? 'SAVING...' : 'SAVE'}
                    </button>
                  </div>
                )}
              </div>

              {/* Section 4: FAQs */}
              <div className="pt-6 border-t border-neutral-100 space-y-4">
                <h4 className="text-sm sm:text-base font-bold text-neutral-900">
                  FAQs
                </h4>

                <div className="space-y-3 text-xs sm:text-[13px] leading-relaxed">
                  <div>
                    <p className="font-bold text-neutral-800">
                      What happens when I update my email address (or mobile number)?
                    </p>
                    <p className="text-neutral-500 mt-1">
                      Your login email id (or mobile number) changes, likewise. You'll receive all your account related communication on your updated email address (or mobile number).
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-neutral-800">
                      When will my YYME account be updated with the new email address (or mobile number)?
                    </p>
                    <p className="text-neutral-500 mt-1">
                      It happens as soon as you confirm the verification code sent to your email (or mobile) and save the changes.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-neutral-800">
                      What happens to my existing YYME account when I update my email address (or mobile number)?
                    </p>
                    <p className="text-neutral-500 mt-1">
                      Updating your email address (or mobile number) doesn't invalidate your account. Your account remains fully active with all your order history, wishlist, and preferences intact.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-100">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  My Orders ({orders.length})
                </h3>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-neutral-800">No Orders Found</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Orders placed via WhatsApp or Buy Now will appear here
                  </p>
                  <Link
                    to="/"
                    className="inline-block mt-4 bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xs hover:bg-emerald-800"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const img = order.product_images?.[0];
                    const dateStr = order.clicked_at
                      ? new Date(order.clicked_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '';

                    // Order ID display: uses DB order_number or deterministic fallback for older records
                    const orderDisplayId = order.order_number || (
                      order.order_id
                        ? `ORD${(Math.abs(order.order_id.split('-').reduce((acc, p) => acc + (parseInt(p, 16) || 0), 0)) % 900000) + 100000}`
                        : 'ORD100001'
                    );

                    return (
                      <div
                        key={order.order_id}
                        onClick={() => {
                          if (order.product_id) {
                            navigate(`/product/${order.product_id}`);
                          }
                        }}
                        className={`border border-neutral-200 rounded-xs p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all bg-white ${
                          order.product_id
                            ? 'cursor-pointer hover:border-emerald-600 hover:shadow-md group'
                            : 'hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-16 h-16 rounded-xs bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {img ? (
                              <img src={img} alt={order.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                            ) : (
                              <span className="text-2xl">📦</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-neutral-900 truncate group-hover:text-emerald-700 transition-colors">
                              {order.product_name}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Seller: {order.seller_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 text-xs font-mono font-bold border border-emerald-200">
                                <span className="text-[10px] uppercase font-sans font-semibold text-emerald-600">ID:</span>
                                {orderDisplayId}
                              </span>
                              <span className="text-xs text-neutral-400">
                                • Ordered on {dateStr}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                          <span className="text-sm sm:text-base font-black text-neutral-900">
                            {formatINR(order.item_price)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            {order.status || 'Initiated'}
                          </span>
                          {order.product_id && (
                            <span className="text-[11px] font-bold text-emerald-700 sm:inline-flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                              View Product <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY WISHLIST */}
          {activeTab === 'wishlist' && (
            <div>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-100">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  My Wishlist ({wishlist.length})
                </h3>
                <Link
                  to="/wishlist"
                  className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline transition-colors"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {wishlist.length === 0 ? (
                <div className="p-12 text-center border border-neutral-200 rounded-xs">
                  <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-neutral-800">Your Wishlist is Empty</p>
                  <p className="text-xs text-neutral-400 mt-1">Explore products and save items you love</p>
                  <Link
                    to="/"
                    className="inline-block mt-4 bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xs hover:bg-emerald-800"
                  >
                    Explore Products
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {wishlist.map((item) => (
                    <div key={item.product_id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image_urls?.[0] || ''}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl border border-neutral-200"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-neutral-500 mt-0.5">{item.seller_name}</p>
                          <span className="text-sm font-black text-neutral-900 mt-1 block">
                            {formatINR(item.price)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/product/${item.product_id}`}
                          className="text-xs font-bold text-emerald-700 border border-emerald-600 px-3.5 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
                        >
                          View Item
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(item.product_id)}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-100">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  Notification Preferences
                </h3>
              </div>

              <div className="divide-y divide-neutral-100 max-w-lg">
                {[
                  { label: 'Order Updates', desc: 'Real-time alerts on WhatsApp order confirmations and tracking' },
                  { label: 'Artisan & Product Deals', desc: 'Discounts and festive offers from verified local sellers' },
                  { label: 'Seller WhatsApp Alerts', desc: 'Direct messages regarding stock and delivery status' },
                ].map((pref, idx) => (
                  <div key={idx} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{pref.label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-neutral-300 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
