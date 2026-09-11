import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { formatDateTime } from '@ymenet/utils';
import {
  ArrowLeft, Store, User, Phone, CreditCard, ShieldCheck,
  Zap, Package, Clock, MapPin, CheckCircle, XCircle,
  Edit3, X, Check, ShoppingBag
} from 'lucide-react';
import { Seller } from '../../core/types';
import { invalidateCachePrefix } from '../../core/cache';

export function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Quota & Listing Balance Modal State
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [savingQuota, setSavingQuota] = useState(false);
  const [quotaForm, setQuotaForm] = useState({
    max_listing_quota: 0,
    used_listing_count: 0,
    click_quota: 0,
    remaining_click_quota: 0,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  useEffect(() => {
    if (!id) return;
    supabase.from('sellers')
      .select('*')
      .eq('seller_id', id)
      .single()
      .then(({ data }) => {
        setSeller((data as any) ?? null);
        setLoading(false);
      });

    // Fetch total orders count for this seller
    supabase.from('orders')
      .select('order_id', { count: 'exact', head: true })
      .eq('seller_id', id)
      .then(({ count }) => {
        setOrdersCount(count ?? 0);
      });
  }, [id]);

  async function updateStatus(status: string) {
    if (!seller) return;
    setUpdating(true);
    await supabase.from('sellers').update({ account_status: status }).eq('seller_id', seller.seller_id);
    setSeller({ ...seller, account_status: status });
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-medium text-neutral-600">Seller not found</p>
        <button onClick={() => navigate('/sellers')}
          className="mt-3 text-xs font-semibold text-emerald-600 hover:underline">Back to list</button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending_verification: 'bg-amber-50 text-amber-700 border border-amber-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
    frozen: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
    suspended: 'bg-red-50 text-red-700 border border-red-200',
  };

  const tierColors: Record<string, string> = {
    free: 'bg-neutral-100 text-neutral-600',
    standard: 'bg-blue-50 text-blue-700',
    premium: 'bg-purple-50 text-purple-700',
    extra_premium: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sellers')}
          className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-neutral-900">{seller.business_name}</h1>
          <p className="text-xs text-neutral-500">Seller ID: {seller.seller_id.slice(0, 8)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${statusColors[seller.account_status] || 'bg-neutral-100 text-neutral-600'}`}>
          {seller.account_status.replace('_', ' ')}
        </span>
      </div>

      {/* Business Info */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-neutral-900">Business Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Business Name</p>
            <p className="text-sm font-semibold text-neutral-900">{seller.business_name}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Owner Name</p>
            <p className="text-sm font-semibold text-neutral-900">{seller.owner_name}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">WhatsApp Number</p>
            <p className="text-sm font-semibold text-neutral-900">{seller.whatsapp_number}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Phone Number</p>
            <p className="text-sm font-semibold text-neutral-900">{seller.phone_number || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">GST Registered</p>
            <p className="text-sm font-semibold text-neutral-900">{seller.is_gst_registered ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Shipping State</p>
            <p className="text-sm font-semibold text-neutral-900">{seller.shipping_state || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Joined</p>
            <p className="text-sm font-semibold text-neutral-900">{formatDateTime(seller.created_at)}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">User ID</p>
            <p className="text-xs font-mono text-neutral-600 truncate">{seller.user_id}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Total Orders</p>
            <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>{ordersCount} {ordersCount === 1 ? 'Order' : 'Orders'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Subscription & Quota */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900">Subscription & Quota</h3>
          </div>
          <button
            onClick={openQuotaModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Adjust Balance
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-neutral-50 rounded-lg p-3">
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Current Tier</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tierColors[seller.subscription_tier] || 'bg-neutral-100 text-neutral-600'}`}>
              {seller.subscription_tier}
            </span>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3">
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Tier Expires</p>
            <p className="text-sm font-semibold text-neutral-900 mt-1">
              {seller.tier_expires_at
                ? new Date(seller.tier_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-emerald-700">{ordersCount}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Total Orders</p>
            <p className="text-[10px] text-neutral-400">via marketplace</p>
          </div>
          <div 
            onClick={openQuotaModal}
            className="bg-emerald-50 border border-emerald-200 hover:border-emerald-300 rounded-lg p-3 text-center relative group cursor-pointer transition-all"
            title="Click to adjust quota"
          >
            <div className="absolute top-2 right-2 text-emerald-600 opacity-40 group-hover:opacity-100 transition-opacity">
              <Edit3 className="w-3 h-3" />
            </div>
            <p className="text-lg font-bold text-emerald-700">{seller.remaining_click_quota}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Clicks Remaining</p>
            <p className="text-[10px] text-neutral-400">of {seller.click_quota}</p>
          </div>
          <div 
            onClick={openQuotaModal}
            className="bg-emerald-50 border border-emerald-200 hover:border-emerald-400 rounded-lg p-3 text-center relative group cursor-pointer transition-all shadow-sm hover:shadow"
            title="Click to update listing count balance"
          >
            <div className="absolute top-2 right-2 text-emerald-600 opacity-40 group-hover:opacity-100 transition-opacity">
              <Edit3 className="w-3 h-3" />
            </div>
            <p className="text-lg font-bold text-emerald-700">{seller.max_listing_quota - seller.used_listing_count}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Listings Remaining</p>
            <p className="text-[10px] text-neutral-400">of {seller.max_listing_quota}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-neutral-900">Actions</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={openQuotaModal}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
          >
            <Package className="w-4 h-4 text-emerald-400" /> Adjust Listing Quota
          </button>
          {seller.account_status !== 'approved' && (
            <button onClick={() => updateStatus('approved')} disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <CheckCircle className="w-4 h-4" /> {updating ? 'Processing...' : 'Approve'}
            </button>
          )}
          {seller.account_status !== 'frozen' && seller.account_status !== 'suspended' && (
            <button onClick={() => updateStatus('frozen')} disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors">
              <Clock className="w-4 h-4" /> {updating ? 'Processing...' : 'Freeze'}
            </button>
          )}
          {seller.account_status !== 'suspended' && (
            <button onClick={() => updateStatus('suspended')} disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              <XCircle className="w-4 h-4" /> {updating ? 'Processing...' : 'Suspend'}
            </button>
          )}
        </div>
      </div>

      {/* Quota & Listing Balance Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Adjust Listing & Quota Balance</h2>
                <p className="text-xs text-neutral-500">{seller.business_name} (ID: {seller.seller_id.slice(0, 8)})</p>
              </div>
              <button
                onClick={() => setShowQuotaModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="mt-5 space-y-5">
              {/* Listings Section */}
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Listing Balance</span>
                  </div>
                  <div className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-center shadow-xs">
                    <span className="text-xs text-neutral-500 font-medium">Calculated Remaining: </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {Math.max(0, Number(quotaForm.max_listing_quota) - Number(quotaForm.used_listing_count))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Max Listing Quota
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.max_listing_quota}
                      onChange={(e) =>
                        setQuotaForm({ ...quotaForm, max_listing_quota: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      required
                    />
                    <span className="text-[10px] text-neutral-400">Total allowed listings</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Used Listing Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.used_listing_count}
                      onChange={(e) =>
                        setQuotaForm({ ...quotaForm, used_listing_count: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      required
                    />
                    <span className="text-[10px] text-neutral-400">Currently published</span>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div>
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Quick Adjustments</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setQuotaForm((prev) => ({
                          ...prev,
                          max_listing_quota: Number(prev.max_listing_quota) + 3,
                        }))
                      }
                      className="px-2 py-1 text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      +3 Quota
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQuotaForm((prev) => ({
                          ...prev,
                          max_listing_quota: Number(prev.max_listing_quota) + 5,
                        }))
                      }
                      className="px-2 py-1 text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      +5 Quota
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQuotaForm((prev) => ({
                          ...prev,
                          max_listing_quota: Number(prev.max_listing_quota) + 10,
                        }))
                      }
                      className="px-2 py-1 text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      +10 Quota
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQuotaForm((prev) => ({
                          ...prev,
                          used_listing_count: 0,
                        }))
                      }
                      className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
                    >
                      Reset Used to 0
                    </button>
                  </div>
                </div>
              </div>

              {/* Click Quota Section */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">Click Quota</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Remaining Clicks
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.remaining_click_quota}
                      onChange={(e) =>
                        setQuotaForm({ ...quotaForm, remaining_click_quota: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Total Click Quota
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.click_quota}
                      onChange={(e) =>
                        setQuotaForm({ ...quotaForm, click_quota: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setQuotaForm((prev) => ({
                        ...prev,
                        remaining_click_quota: Number(prev.remaining_click_quota) + 20,
                        click_quota: Number(prev.click_quota) + 20,
                      }))
                    }
                    className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    +20 Clicks
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQuotaForm((prev) => ({
                        ...prev,
                        remaining_click_quota: Number(prev.remaining_click_quota) + 50,
                        click_quota: Number(prev.click_quota) + 50,
                      }))
                    }
                    className="px-2 py-1 text-[11px] font-semibold bg-white border border-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    +50 Clicks
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuotaModal(false)}
                  disabled={savingQuota}
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuota}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {savingQuota ? 'Saving...' : 'Save Balance Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium border border-neutral-800 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
