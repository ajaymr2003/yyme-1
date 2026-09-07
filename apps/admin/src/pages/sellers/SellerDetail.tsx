import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { formatDateTime } from '@ymenet/utils';
import {
  ArrowLeft, Store, User, Phone, CreditCard, ShieldCheck,
  Zap, Package, Clock, MapPin, CheckCircle, XCircle,
} from 'lucide-react';
import { Seller } from '../../core/types';

export function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
        </div>
      </div>

      {/* Subscription & Quota */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-neutral-900">Subscription & Quota</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-emerald-700">{seller.remaining_click_quota}</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Clicks Remaining</p>
            <p className="text-[10px] text-neutral-400">of {seller.click_quota}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
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
    </div>
  );
}
