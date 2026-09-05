import React, { useEffect, useState } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { formatINR, formatDateTime } from '@ymenet/utils';
import { CreditCard, CheckCircle, XCircle, ExternalLink, Clock } from 'lucide-react';
import { UpgradeRequest } from '../../core/types';

export function UpgradeRequestsQueue() {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('pending_approval');
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function fetchRequests() {
    setLoading(true);
    let query = supabase.from('subscription_upgrade_requests')
      .select('*, seller:sellers(business_name, owner_name, whatsapp_number), plan:subscription_plans(name, monthly_price)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setRequests((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchRequests(); }, [filter]);

  async function handleApprove(req: UpgradeRequest) {
    setProcessingId(req.request_id);
    const adminId = (await supabase.auth.getUser()).data.user?.id;

    // 1. Update request status
    await supabase.from('subscription_upgrade_requests').update({
      status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    }).eq('request_id', req.request_id);

    // 2. Upgrade seller tier + reset quotas
    const newQuotas: Record<string, { clicks: number; listings: number }> = {
      standard: { clicks: 100, listings: 10 },
      premium: { clicks: 500, listings: 50 },
      extra_premium: { clicks: 2000, listings: 200 },
    };
    const q = newQuotas[req.target_plan_id];
    if (q) {
      await supabase.from('sellers').update({
        subscription_tier: req.target_plan_id,
        click_quota: q.clicks,
        remaining_click_quota: q.clicks,
        max_listing_quota: q.listings,
        tier_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('seller_id', req.seller_id);
    }

    // 3. Audit log
    await supabase.from('audit_logs').insert([{
      admin_id: adminId, action: 'APPROVE_UPGRADE', target_id: req.seller_id,
      details: { target_plan: req.target_plan_id, amount: req.amount_paid, utr: req.utr_reference_number },
    }]);

    fetchRequests();
    setProcessingId(null);
  }

  async function handleReject(req: UpgradeRequest, reason: string) {
    setProcessingId(req.request_id);
    const adminId = (await supabase.auth.getUser()).data.user?.id;

    await supabase.from('subscription_upgrade_requests').update({
      status: 'rejected', rejection_reason: reason,
      reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    }).eq('request_id', req.request_id);

    await supabase.from('audit_logs').insert([{
      admin_id: adminId, action: 'REJECT_UPGRADE', target_id: req.seller_id,
      details: { reason, utr: req.utr_reference_number },
    }]);

    fetchRequests();
    setProcessingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Subscription Upgrade Requests</h1>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          className="px-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="pending_approval">Pending</option>
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-600">No {filter === 'pending_approval' ? 'pending' : ''} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <UpgradeRequestCard key={req.request_id} request={req}
              onApprove={() => handleApprove(req)}
              onReject={(reason) => handleReject(req, reason)}
              processing={processingId === req.request_id} />
          ))}
        </div>
      )}
    </div>
  );
}

function UpgradeRequestCard({ request: req, onApprove, onReject, processing }: {
  request: UpgradeRequest; onApprove: () => void; onReject: (reason: string) => void; processing: boolean;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const statusColors: Record<string, string> = {
    pending_approval: 'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900">{req.seller?.business_name ?? 'Unknown'}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[req.status]}`}>{req.status.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">Owner: {req.seller?.owner_name}</p>
          </div>
          <span className="text-[10px] text-neutral-400">{formatDateTime(req.created_at)}</span>
        </div>

        <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-medium">Target Plan</p>
              <p className="text-xs font-semibold text-neutral-900 capitalize">{req.target_plan_id.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-medium">Amount Paid</p>
              <p className="text-xs font-semibold text-emerald-700">{formatINR(req.amount_paid)}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-medium">Payment Method</p>
              <p className="text-xs font-semibold text-neutral-900">{req.payment_method}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-medium">UTR Reference</p>
              <p className="text-xs font-semibold text-neutral-900 font-mono">{req.utr_reference_number}</p>
            </div>
          </div>
        </div>

        {req.status === 'pending_approval' && (
          <div className="flex items-center gap-3">
            <button onClick={onApprove} disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <CheckCircle className="w-4 h-4" /> {processing ? 'Processing...' : 'Approve & Activate'}
            </button>
            <button onClick={() => setShowRejectModal(true)} disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        )}

        {req.rejection_reason && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-[11px] text-red-700"><strong>Rejection reason:</strong> {req.rejection_reason}</p>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full z-10 p-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-3">Reject Upgrade Request</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
              placeholder="Enter rejection reason (shared with seller)..." />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button onClick={() => { onReject(rejectReason); setShowRejectModal(false); }}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
