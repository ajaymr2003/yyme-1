import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { formatDateTime, formatINR, formatDate } from '@ymenet/utils';
import {
  ArrowLeft, Store, User, Phone, CreditCard, ShieldCheck,
  Zap, Package, Clock, MapPin, CheckCircle, XCircle,
  Edit3, X, Check, ShoppingBag, ExternalLink, Copy, AlertTriangle,
  FileText, Calendar, MessageSquare, ChevronRight, Layers, Eye, RefreshCw,
  Award, Shield, FileCheck, CheckCircle2, AlertOctagon, HelpCircle
} from 'lucide-react';
import { Seller, SellerVerification } from '../../core/types';
import { invalidateCachePrefix } from '../../core/cache';

export function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Core data states
  const [seller, setSeller] = useState<Seller | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [verification, setVerification] = useState<SellerVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'controls'>('overview');

  // Copy indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quota Modal State
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [savingQuota, setSavingQuota] = useState(false);
  const [quotaForm, setQuotaForm] = useState({
    max_listing_quota: 0,
    used_listing_count: 0,
    click_quota: 0,
    remaining_click_quota: 0,
  });

  // Status Modal State (for confirmation)
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openQuotaModal = () => {
    if (!seller) return;
    setQuotaForm({
      max_listing_quota: Number(seller.max_listing_quota ?? 3),
      used_listing_count: Number(seller.used_listing_count ?? 0),
      click_quota: Number(seller.click_quota ?? 20),
      remaining_click_quota: Number(seller.remaining_click_quota ?? 20),
    });
    setShowQuotaModal(true);
  };

  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;
    setSavingQuota(true);

    try {
      const updates = {
        max_listing_quota: Math.max(0, parseInt(String(quotaForm.max_listing_quota), 10) || 0),
        used_listing_count: Math.max(0, parseInt(String(quotaForm.used_listing_count), 10) || 0),
        click_quota: Math.max(0, parseInt(String(quotaForm.click_quota), 10) || 0),
        remaining_click_quota: Math.max(0, parseInt(String(quotaForm.remaining_click_quota), 10) || 0),
      };

      const { error: updateError } = await supabase
        .from('sellers')
        .update(updates)
        .eq('seller_id', seller.seller_id);

      if (updateError) throw updateError;

      setSeller((prev) => (prev ? { ...prev, ...updates } : null));
      invalidateCachePrefix('yyme_sellers_');
      setShowQuotaModal(false);
      showToast('Listing & quota balance updated successfully!');
    } catch (err: any) {
      alert('Failed to update quota: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingQuota(false);
    }
  };

  const openStatusConfirm = (status: string) => {
    setPendingStatus(status);
    setStatusReason('');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!seller || !pendingStatus) return;
    setUpdating(true);

    try {
      const normalizedStatus = pendingStatus === 'approved' ? 'active' : pendingStatus;
      const updates: any = { account_status: normalizedStatus };
      if (pendingStatus === 'rejected' || pendingStatus === 'suspended') {
        updates.rejection_reason = statusReason.trim() || 'Suspended by admin review.';
      } else if (pendingStatus === 'approved' || pendingStatus === 'active') {
        updates.rejection_reason = null;
      }

      const { error } = await supabase
        .from('sellers')
        .update(updates)
        .eq('seller_id', seller.seller_id);

      if (error) throw error;

      setSeller((prev) => (prev ? { ...prev, ...updates } : null));
      invalidateCachePrefix('yyme_sellers_');
      setShowStatusModal(false);
      showToast(`Seller account status changed to ${pendingStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      alert('Failed to update seller status: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  // Fetch full details
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // 1. Fetch Seller Record
    supabase.from('sellers')
      .select('*')
      .eq('seller_id', id)
      .single()
      .then(({ data }) => {
        setSeller((data as any) ?? null);
        setLoading(false);
      });

    // 2. Fetch Total Orders & Recent Orders
    supabase.from('orders')
      .select('*', { count: 'exact' })
      .eq('seller_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data, count }) => {
        setOrdersCount(count ?? 0);
        setRecentOrders(data || []);
      });

    // 3. Fetch Products & Count
    supabase.from('products')
      .select('*', { count: 'exact' })
      .eq('seller_id', id)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data, count }) => {
        setProducts(data || []);
        setProductsCount(count ?? 0);
      });

    // 4. Fetch Seller Verification Record
    supabase.from('seller_verifications')
      .select('*')
      .eq('seller_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setVerification((data as any) ?? null);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        <p className="text-sm font-semibold text-neutral-500">Loading seller profile...</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">Seller Not Found</h2>
        <p className="text-xs text-neutral-500 mt-1">The seller ID you requested does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/sellers')}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sellers List
        </button>
      </div>
    );
  }

  // Visual status indicators
  const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    active: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Active & Approved',
    },
    approved: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Active & Approved',
    },
    pending_verification: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Pending Review',
    },
    rejected: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
      label: 'Rejected',
    },
    frozen: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
      label: 'Account Frozen',
    },
    suspended: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-600',
      label: 'Suspended',
    },
  };

  const currentStatus = statusConfig[seller.account_status] || {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-200',
    dot: 'bg-neutral-400',
    label: seller.account_status.replace('_', ' '),
  };

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    free: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200' },
    standard: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    premium: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    extra_premium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  };

  const currentTierStyle = tierColors[seller.subscription_tier] || tierColors.free;

  // Percentage calculations
  const listingUsedPercent = seller.max_listing_quota > 0
    ? Math.min(100, Math.round((seller.used_listing_count / seller.max_listing_quota) * 100))
    : 0;

  const clickQuotaPercent = seller.click_quota > 0
    ? Math.min(100, Math.round((seller.remaining_click_quota / seller.click_quota) * 100))
    : 0;

  const listingsRemaining = Math.max(0, seller.max_listing_quota - seller.used_listing_count);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/sellers')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Sellers</span>
          </button>
          <span className="text-neutral-300">/</span>
          <span className="text-xs font-bold text-neutral-700 truncate max-w-[220px]">
            {seller.business_name}
          </span>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2">
          {seller.whatsapp_number && (
            <a
              href={`https://wa.me/91${seller.whatsapp_number.replace(/\D/g, '').slice(-10)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs"
              title="Open WhatsApp chat with seller"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          {seller.phone_number && (
            <a
              href={`tel:${seller.phone_number}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all shadow-2xs"
              title="Call seller"
            >
              <Phone className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Call</span>
            </a>
          )}
          <button
            onClick={openQuotaModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Adjust Balance</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO MERCHANT PROFILE CARD                                              */}
      {/* ========================================================================= */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Banner Decorative Header */}
        <div className="h-24 sm:h-28 bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-xs border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
              <span className={`w-2 h-2 rounded-full ${currentStatus.dot} animate-pulse`} />
              {currentStatus.label}
            </span>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-10 sm:-mt-12 mb-6">
            
            {/* Avatar & Name */}
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-black text-emerald-800 bg-emerald-50 shrink-0 select-none">
                {seller.business_name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                    {seller.business_name}
                  </h1>
                  {(seller.account_status === 'approved' || seller.account_status === 'active') && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Live in Marketplace
                    </span>
                  )}
                  {seller.is_disability_exempt && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                      <Award className="w-3 h-3 text-purple-600" />
                      Disability Exempted
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-neutral-600 flex items-center gap-2">
                  <span>Owner: <strong className="text-neutral-900 font-bold">{seller.owner_name}</strong></span>
                  <span className="text-neutral-300">•</span>
                  <span className="text-neutral-500 font-normal">Joined {formatDate(seller.created_at)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Contact & Geographic Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-neutral-100">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-50/70 border border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">WhatsApp</p>
                <p className="text-xs font-bold text-neutral-900 truncate">{seller.whatsapp_number || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-50/70 border border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100/60 text-blue-700 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Phone</p>
                <p className="text-xs font-bold text-neutral-900 truncate">{seller.phone_number || seller.whatsapp_number || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-50/70 border border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-purple-100/60 text-purple-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Shipping State</p>
                <p className="text-xs font-bold text-neutral-900 truncate">{seller.shipping_state || 'Not Specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-50/70 border border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">GST Status</p>
                <p className="text-xs font-bold text-neutral-900 truncate">{seller.is_gst_registered ? 'GST Registered' : 'Zero GST / Unregistered'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KEY PERFORMANCE METRICS (4 CARDS)                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Orders */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Total Marketplace Orders</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-neutral-900 tracking-tight">{ordersCount}</span>
              <span className="text-xs font-semibold text-emerald-700">Orders logged</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Direct buyer orders received</p>
          </div>
        </div>

        {/* Metric 2: Listing Capacity */}
        <div 
          onClick={openQuotaModal}
          className="bg-white border border-neutral-200/90 hover:border-emerald-400 rounded-2xl p-5 shadow-xs flex flex-col justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Listing Quota</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:bg-teal-100 transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-3xl font-black text-neutral-900 tracking-tight">{listingsRemaining}</span>
              <span className="text-xs font-bold text-neutral-500">
                {seller.used_listing_count} / {seller.max_listing_quota} used
              </span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  listingUsedPercent >= 90 ? 'bg-rose-500' : listingUsedPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${listingUsedPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              {listingsRemaining === 0 ? 'Quota exhausted — click to increase' : `${listingsRemaining} more slots available to publish`}
            </p>
          </div>
        </div>

        {/* Metric 3: Click Quota */}
        <div 
          onClick={openQuotaModal}
          className="bg-white border border-neutral-200/90 hover:border-amber-400 rounded-2xl p-5 shadow-xs flex flex-col justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Click Balance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-100 transition-colors">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-3xl font-black text-neutral-900 tracking-tight">{seller.remaining_click_quota}</span>
              <span className="text-xs font-bold text-neutral-500">
                of {seller.click_quota} total
              </span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${clickQuotaPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              {seller.remaining_click_quota <= 5 ? 'Low clicks remaining — click to replenish' : 'Customer inquiry click quota remaining'}
            </p>
          </div>
        </div>

        {/* Metric 4: Subscription Plan */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Subscription Tier</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${currentTierStyle.bg} ${currentTierStyle.text} ${currentTierStyle.border}`}>
                {seller.subscription_tier} PLAN
              </span>
            </div>
            <p className="text-xs font-semibold text-neutral-700 mt-2">
              {seller.tier_expires_at ? `Renews on ${formatDate(seller.tier_expires_at)}` : 'Lifetime Zero Fee Tier'}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {seller.is_disability_exempt ? 'Zero commission artisan account' : 'Standard marketplace terms'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB NAVIGATION BAR                                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-neutral-200/90 pb-px overflow-x-auto">
        {[
          { id: 'overview', label: 'Store Overview', icon: Store },
          { id: 'orders', label: `Orders (${ordersCount})`, icon: ShoppingBag },
          { id: 'products', label: `Products (${productsCount})`, icon: Package },
          { id: 'controls', label: 'Moderation & Actions', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-emerald-600 text-emerald-800 bg-white/70'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENTS                                                           */}
      {/* ========================================================================= */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Comprehensive Business Profile */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Rejection / Warning Alert Banner if applicable */}
            {seller.account_status === 'rejected' && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">Account Rejected</h4>
                  <p className="text-xs text-rose-700 mt-1">
                    {seller.rejection_reason || 'This account was rejected by an administrator during verification.'}
                  </p>
                </div>
              </div>
            )}

            {seller.account_status === 'suspended' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Account Suspended</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    {seller.rejection_reason || 'Store operations are temporarily halted for this merchant.'}
                  </p>
                </div>
              </div>
            )}

            {/* Business Information Card */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Commercial & Legal Details</h3>
                    <p className="text-[11px] text-neutral-400">Registered merchant credentials and profile details</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Business / Store Name</p>
                  <p className="text-sm font-bold text-neutral-900 mt-0.5">{seller.business_name}</p>
                </div>

                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Authorized Owner</p>
                  <p className="text-sm font-bold text-neutral-900 mt-0.5">{seller.owner_name}</p>
                </div>

                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Primary Phone</p>
                  <p className="text-sm font-semibold text-neutral-900 mt-0.5">{seller.phone_number || '—'}</p>
                </div>

                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">WhatsApp Business Contact</p>
                  <p className="text-sm font-semibold text-neutral-900 mt-0.5">{seller.whatsapp_number}</p>
                </div>

                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">GST Compliance</p>
                  <p className="text-sm font-semibold text-neutral-900 mt-0.5 flex items-center gap-1.5">
                    {seller.is_gst_registered ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> GSTIN Verified
                      </span>
                    ) : (
                      <span className="text-neutral-600">Enrolled / Exempted</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Fulfillment & Shipping State</p>
                  <p className="text-sm font-semibold text-neutral-900 mt-0.5">{seller.shipping_state || 'Not specified'}</p>
                </div>

                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Registration Timestamp</p>
                  <p className="text-xs font-semibold text-neutral-700 mt-0.5">{formatDateTime(seller.created_at)}</p>
                </div>
              </div>
            </div>

            {/* ID Proof & KYC Verification Card */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Identity & KYC Verification</h3>
                    <p className="text-[11px] text-neutral-400">Government ID documentation and compliance audit</p>
                  </div>
                </div>

                {verification ? (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    verification.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    verification.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {verification.status}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-neutral-100 text-neutral-600">
                    Self-Declared
                  </span>
                )}
              </div>

              {verification ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Document Type</p>
                    <p className="text-sm font-bold text-neutral-900 mt-0.5">{verification.verification_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Reference / Document ID</p>
                    <p className="text-sm font-mono font-bold text-neutral-800 mt-0.5">{verification.reference_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Uploaded Attachment</p>
                    {verification.document_url ? (
                      <a
                        href={verification.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Document</span>
                      </a>
                    ) : (
                      <p className="text-xs text-neutral-400 mt-1">No file uploaded</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neutral-50/70 border border-neutral-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-neutral-400" />
                    <div>
                      <p className="text-xs font-bold text-neutral-800">No external documents pending</p>
                      <p className="text-[11px] text-neutral-500">Seller registered under zero-GST / verified standard tier</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Compliant
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Management Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3.5">
                Administrative Controls
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={openQuotaModal}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-xl text-xs font-bold text-neutral-800 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Adjust Listing & Clicks</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>

                {seller.account_status !== 'approved' && (
                  <button
                    onClick={() => openStatusConfirm('approved')}
                    disabled={updating}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Seller Account</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  </button>
                )}

                {seller.account_status !== 'frozen' && (
                  <button
                    onClick={() => openStatusConfirm('frozen')}
                    disabled={updating}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Freeze Account Temporarily</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>
                )}

                {seller.account_status !== 'suspended' && (
                  <button
                    onClick={() => openStatusConfirm('suspended')}
                    disabled={updating}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Suspend Store Access</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Quota Summary Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Live Quota Summary</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Realtime</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Published Listings:</span>
                  <span className="font-bold text-neutral-900">{seller.used_listing_count} of {seller.max_listing_quota}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Remaining Listings:</span>
                  <span className="font-bold text-emerald-700">{listingsRemaining} available</span>
                </div>
                <div className="border-t border-emerald-200/60 pt-2 flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Inquiry Clicks:</span>
                  <span className="font-bold text-neutral-900">{seller.remaining_click_quota} of {seller.click_quota}</span>
                </div>
              </div>

              <button
                onClick={openQuotaModal}
                className="w-full mt-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center block"
              >
                Modify Quota Balances
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Orders Received by {seller.business_name}</h3>
              <p className="text-xs text-neutral-500">Customer purchases routed through the marketplace</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              {ordersCount} {ordersCount === 1 ? 'Total Order' : 'Total Orders'}
            </span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-700">No Orders Placed Yet</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Orders routed to this seller will appear here in real-time as buyers complete purchases.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                  {recentOrders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                        {order.order_number || order.order_id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {formatDateTime(order.created_at || order.clicked_at)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        {formatINR(Number(order.item_price) || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          order.status === 'shipped' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.status || 'Initiated'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => copyToClipboard(order.order_id, 'Order ID')}
                          className="px-2 py-1 text-[11px] font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors cursor-pointer"
                        >
                          Copy ID
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Products Catalog ({productsCount})</h3>
              <p className="text-xs text-neutral-500">Inventory and listings created by this merchant</p>
            </div>
            <span className="text-xs font-semibold text-neutral-500">
              Showing up to {products.length} latest products
            </span>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-700">No Products Published</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                This seller has not published any products to the marketplace catalog yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {products.map((p) => {
                const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image_url || '/placeholder.png');
                return (
                  <div key={p.product_id} className="border border-neutral-200 rounded-xl overflow-hidden hover:border-emerald-300 transition-all group flex flex-col justify-between">
                    <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                      <img
                        src={img}
                        alt={p.title || 'Product image'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as any).src = 'https://placehold.co/400x300?text=YYME'; }}
                      />
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shadow-xs ${
                        p.status === 'active' || p.status === 'approved' ? 'bg-emerald-600 text-white' : 'bg-neutral-900/80 text-white'
                      }`}>
                        {p.status || 'Active'}
                      </span>
                    </div>
                    <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{p.title}</h4>
                        <p className="text-xs font-bold text-emerald-700 mt-1">{formatINR(Number(p.price) || 0)}</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
                        <span>ID: {p.product_id.slice(0, 8)}</span>
                        <span>{formatDate(p.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MODERATION & CONTROLS */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-neutral-900 mb-1">Account Status Moderation</h3>
            <p className="text-xs text-neutral-500 mb-5">
              Change the operational lifecycle status of this seller on the YYME marketplace.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Action: Approve */}
              <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/40 flex flex-col justify-between space-y-3">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-950">Approve Seller</h4>
                  <p className="text-xs text-neutral-600 mt-1">
                    Grant full marketplace publishing and active order receiving privileges.
                  </p>
                </div>
                <button
                  onClick={() => openStatusConfirm('active')}
                  disabled={seller.account_status === 'approved' || seller.account_status === 'active' || updating}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {seller.account_status === 'approved' || seller.account_status === 'active' ? 'Currently Approved' : 'Activate & Approve'}
                </button>
              </div>

              {/* Action: Freeze */}
              <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/40 flex flex-col justify-between space-y-3">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-amber-950">Freeze Account</h4>
                  <p className="text-xs text-neutral-600 mt-1">
                    Temporarily hide listings from buyer search without deleting store data.
                  </p>
                </div>
                <button
                  onClick={() => openStatusConfirm('frozen')}
                  disabled={seller.account_status === 'frozen' || updating}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {seller.account_status === 'frozen' ? 'Currently Frozen' : 'Freeze Store'}
                </button>
              </div>

              {/* Action: Suspend */}
              <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/40 flex flex-col justify-between space-y-3">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-rose-950">Suspend Account</h4>
                  <p className="text-xs text-neutral-600 mt-1">
                    Completely disable merchant portal access and remove all public store visibility.
                  </p>
                </div>
                <button
                  onClick={() => openStatusConfirm('suspended')}
                  disabled={seller.account_status === 'suspended' || updating}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {seller.account_status === 'suspended' ? 'Currently Suspended' : 'Suspend Merchant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODALS & DIALOGS                                                       */}
      {/* ========================================================================= */}

      {/* MODAL 1: Quota & Listing Balance Adjustment */}
      {showQuotaModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">Adjust Quota & Listing Limits</h2>
                <p className="text-xs text-neutral-500">{seller.business_name} (ID: {seller.seller_id.slice(0, 8)})</p>
              </div>
              <button
                onClick={() => setShowQuotaModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="mt-5 space-y-5">
              {/* Listings Balance Section */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">Listing Capacity</span>
                  </div>
                  <div className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-center shadow-xs">
                    <span className="text-[11px] text-neutral-500 font-medium">Calculated Remaining: </span>
                    <span className="text-xs font-black text-emerald-800">
                      {Math.max(0, Number(quotaForm.max_listing_quota) - Number(quotaForm.used_listing_count))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Max Listing Quota
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.max_listing_quota}
                      onChange={(e) =>
                        setQuotaForm({ ...quotaForm, max_listing_quota: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      required
                    />
                    <span className="text-[10px] text-neutral-500">Maximum allowed listings</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Used Listing Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.used_listing_count}
                      onChange={(e) =>
                        setQuotaForm({ ...quotaForm, used_listing_count: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      required
                    />
                    <span className="text-[10px] text-neutral-500">Currently published</span>
                  </div>
                </div>

                {/* Shortcuts */}
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Quick Quota Boost</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[3, 5, 10, 20].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() =>
                          setQuotaForm((prev) => ({
                            ...prev,
                            max_listing_quota: Number(prev.max_listing_quota) + inc,
                          }))
                        }
                        className="px-2.5 py-1 text-xs font-bold bg-white border border-emerald-200 text-emerald-800 rounded-lg hover:bg-emerald-100/60 transition-colors cursor-pointer"
                      >
                        +{inc} Quota
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setQuotaForm((prev) => ({
                          ...prev,
                          used_listing_count: 0,
                        }))
                      }
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      Reset Used to 0
                    </button>
                  </div>
                </div>
              </div>

              {/* Click Quota Section */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">Inquiry Click Quota</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Remaining Clicks
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.remaining_click_quota}
                      onChange={(e) =>
                        setQuotaForm({ ...quotaForm, remaining_click_quota: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Total Click Quota
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.click_quota}
                      onChange={(e) =>
                        setQuotaForm({ ...quotaForm, click_quota: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[20, 50, 100].map((clicks) => (
                    <button
                      key={clicks}
                      type="button"
                      onClick={() =>
                        setQuotaForm((prev) => ({
                          ...prev,
                          remaining_click_quota: Number(prev.remaining_click_quota) + clicks,
                          click_quota: Number(prev.click_quota) + clicks,
                        }))
                      }
                      className="px-2.5 py-1 text-xs font-bold bg-white border border-amber-200 text-amber-900 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      +{clicks} Clicks
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuotaModal(false)}
                  disabled={savingQuota}
                  className="px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuota}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {savingQuota ? 'Saving Updates...' : 'Save Balance Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Status Change Confirmation */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                pendingStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                pendingStatus === 'frozen' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                {pendingStatus === 'approved' ? <CheckCircle className="w-5 h-5" /> :
                 pendingStatus === 'frozen' ? <Clock className="w-5 h-5" /> :
                 <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Confirm Status Change: <span className="uppercase text-emerald-800">{pendingStatus}</span>
                </h3>
                <p className="text-xs text-neutral-500">Update account standing for {seller.business_name}</p>
              </div>
            </div>

            {(pendingStatus === 'suspended' || pendingStatus === 'rejected') && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Reason for Suspension / Rejection (optional)
                </label>
                <textarea
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Enter notes explaining why this account was suspended..."
                  className="w-full p-3 text-xs border border-neutral-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                disabled={updating}
                className="px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={updating}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                  pendingStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  pendingStatus === 'frozen' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {updating ? 'Processing...' : `Confirm ${pendingStatus.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border border-neutral-800 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
