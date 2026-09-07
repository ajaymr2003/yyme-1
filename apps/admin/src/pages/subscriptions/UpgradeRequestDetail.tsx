import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { invalidateCachePrefix } from '../../core/cache';
import { formatINR, formatDateTime } from '@ymenet/utils';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, CreditCard, User, Phone,
  Image as ImageIcon, FileText, Zap,
} from 'lucide-react';
import { UpgradeRequest } from '../../core/types';

export function UpgradeRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<UpgradeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!id) return;
    supabase.from('subscription_upgrade_requests')
      .select('*, seller:sellers(business_name, owner_name, whatsapp_number, phone_number), plan:subscription_plans(name, monthly_price, click_quota, listing_quota, description)')
      .eq('request_id', id)
      .single()
      .then(({ data, error }) => {
        setRequest((data as any) ?? null);
        setLoading(false);
      });
  }, [id]);

  async function handleApprove() {
    if (!request) return;
    setProcessing(true);
    const adminId = (await supabase.auth.getUser()).data.user?.id;

    await supabase.from('subscription_upgrade_requests').update({
      status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    }).eq('request_id', request.request_id);

    const newQuotas: Record<string, { clicks: number; listings: number }> = {
      standard: { clicks: 100, listings: 10 },
      premium: { clicks: 500, listings: 50 },
      extra_premium: { clicks: 2000, listings: 200 },
    };
    const q = newQuotas[request.target_plan_id];
    if (q) {
      await supabase.from('sellers').update({
        subscription_tier: request.target_plan_id,
        click_quota: q.clicks,
        remaining_click_quota: q.clicks,
        max_listing_quota: q.listings,
        tier_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('seller_id', request.seller_id);
    }

    await supabase.from('audit_logs').insert([{
      admin_id: adminId, action: 'APPROVE_UPGRADE', target_id: request.seller_id,
      details: { target_plan: request.target_plan_id, amount: request.amount_paid, utr: request.utr_reference_number },
    }]);

    invalidateCachePrefix('yyme_upgrades_');
    invalidateCachePrefix('yyme_dashboard_stats');
    setProcessing(false);
    navigate('/seller-upgrades');
  }

  async function handleReject() {
    if (!request || !rejectReason.trim()) return;
    setProcessing(true);
    const adminId = (await supabase.auth.getUser()).data.user?.id;

    await supabase.from('subscription_upgrade_requests').update({
      status: 'rejected', rejection_reason: rejectReason.trim(),
      reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    }).eq('request_id', request.request_id);

    await supabase.from('audit_logs').insert([{
      admin_id: adminId, action: 'REJECT_UPGRADE', target_id: request.seller_id,
      details: { reason: rejectReason.trim(), utr: request.utr_reference_number },
    }]);

    invalidateCachePrefix('yyme_upgrades_');
    invalidateCachePrefix('yyme_dashboard_stats');
    setProcessing(false);
    navigate('/seller-upgrades');
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-medium text-neutral-600">Request not found</p>
        <button onClick={() => navigate('/seller-upgrades')}
          className="mt-3 text-xs font-semibold text-emerald-600 hover:underline">Back to list</button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending_approval: 'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/seller-upgrades')}
          className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-neutral-900">Upgrade Request</h1>
          <p className="text-xs text-neutral-500">{formatDateTime(request.created_at)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${statusColors[request.status]}`}>
          {request.status.replace('_', ' ')}
        </span>
      </div>

      {/* Seller Info */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-lg font-bold text-emerald-700">
            {request.seller?.business_name?.charAt(0) ?? 'S'}
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">{request.seller?.business_name ?? 'Unknown'}</h3>
            <p className="text-xs text-neutral-500">Owner: {request.seller?.owner_name}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            <span>{request.seller?.whatsapp_number || request.seller?.phone_number || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <span>ID: {request.seller_id.slice(0, 8)}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-neutral-900">Payment Details</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Target Plan</p>
            <p className="text-sm font-semibold text-neutral-900 capitalize">{request.target_plan_id.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Amount Paid</p>
            <p className="text-sm font-bold text-emerald-700">{formatINR(request.amount_paid)}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">Payment Method</p>
            <p className="text-sm font-semibold text-neutral-900">{request.payment_method}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-medium">UTR Reference</p>
            <p className="text-sm font-semibold text-neutral-900 font-mono">{request.utr_reference_number}</p>
          </div>
        </div>
      </div>

      {/* Plan Benefits */}
      {request.plan && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-neutral-900">What's in this plan</h3>
          </div>
          {request.plan.description && (
            <p className="text-xs text-neutral-600 mb-3">{request.plan.description}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">{request.plan.click_quota}</p>
              <p className="text-[10px] text-emerald-600 font-semibold uppercase">Clicks / month</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">{request.plan.listing_quota}</p>
              <p className="text-[10px] text-emerald-600 font-semibold uppercase">Product listings</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof */}
      {request.payment_receipt_url && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900">Payment Proof</h3>
          </div>
          {request.payment_receipt_url.endsWith('.pdf') ? (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <iframe
                src={request.payment_receipt_url}
                className="w-full h-[500px]"
                title="Payment receipt PDF"
              />
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <img src={request.payment_receipt_url} alt="Payment proof"
                className="w-full max-h-80 object-contain bg-neutral-50" />
            </div>
          )}
        </div>
      )}

      {/* Rejection Reason */}
      {request.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-bold text-red-800 uppercase mb-1">Rejection Reason</p>
          <p className="text-sm text-red-700">{request.rejection_reason}</p>
        </div>
      )}

      {/* Actions */}
      {request.status === 'pending_approval' && (
        <div className="flex items-center gap-3">
          <button onClick={handleApprove} disabled={processing}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            <CheckCircle className="w-4 h-4" /> {processing ? 'Processing...' : 'Approve & Activate'}
          </button>
          <button onClick={() => setShowRejectModal(true)} disabled={processing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full z-10 p-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-3">Reject Upgrade Request</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
              placeholder="Enter rejection reason (shared with seller)..." />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={handleReject}
                disabled={!rejectReason.trim() || processing}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
