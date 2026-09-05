import React, { useEffect, useState } from 'react';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { formatDateTime } from '@ymenet/utils';
import { ShieldCheck, CheckCircle, XCircle, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { SellerVerification } from '../../core/types';

export function IdentityQueue() {
  const [verifications, setVerifications] = useState<SellerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function fetchVerifications() {
    setLoading(true);
    let query = supabase.from('seller_verifications').select('*, seller:sellers(business_name, owner_name, whatsapp_number, account_status)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setVerifications((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchVerifications(); }, [filter]);

  async function handleApprove(verification: SellerVerification) {
    setProcessingId(verification.record_id);
    await supabase.from('seller_verifications').update({ status: 'verified', verified_on: new Date().toISOString() }).eq('record_id', verification.record_id);
    await supabase.from('sellers').update({ account_status: 'active' }).eq('seller_id', verification.seller_id);
    await supabase.from('audit_logs').insert([{ admin_id: (await supabase.auth.getUser()).data.user?.id, action: 'VERIFY_IDENTITY', target_id: verification.seller_id, details: { verification_type: verification.verification_type, reference_number: verification.reference_number } }]);
    fetchVerifications();
    setProcessingId(null);
  }

  async function handleReject(verification: SellerVerification, reason: string) {
    setProcessingId(verification.record_id);
    await supabase.from('seller_verifications').update({ status: 'rejected', rejection_reason: reason }).eq('record_id', verification.record_id);
    await supabase.from('sellers').update({ account_status: 'rejected', rejection_reason: reason }).eq('seller_id', verification.seller_id);
    await supabase.from('audit_logs').insert([{ admin_id: (await supabase.auth.getUser()).data.user?.id, action: 'REJECT_IDENTITY', target_id: verification.seller_id, details: { reason } }]);
    fetchVerifications();
    setProcessingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Identity Verification Queue</h1>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          className="px-3 py-2 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="pending">Pending Review</option>
          <option value="all">All</option>
          <option value="verified">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-12">
          <ShieldCheck className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-600">No {filter === 'pending' ? 'pending' : ''} verifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map(v => (
            <VerificationCard key={v.record_id} verification={v}
              onApprove={() => handleApprove(v)}
              onReject={(reason) => handleReject(v, reason)}
              processing={processingId === v.record_id} />
          ))}
        </div>
      )}
    </div>
  );
}

function VerificationCard({ verification: v, onApprove, onReject, processing }: {
  verification: SellerVerification; onApprove: () => void; onReject: (reason: string) => void; processing: boolean;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-900">{v.seller?.business_name ?? 'Unknown Seller'}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[v.status]}`}>{v.status}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">Owner: {v.seller?.owner_name} · WhatsApp: {v.seller?.whatsapp_number}</p>
          </div>
          <span className="text-[10px] text-neutral-400">{formatDateTime(v.created_at)}</span>
        </div>

        <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 mb-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-medium">Document Type</p>
              <p className="text-xs font-semibold text-neutral-900">{v.verification_type}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-medium">Reference Number</p>
              <p className="text-xs font-semibold text-neutral-900">{v.reference_number}</p>
            </div>
          </div>
          {v.document_url && (
            <a href={v.document_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
              <ExternalLink className="w-3 h-3" /> View Document
            </a>
          )}
        </div>

        {v.status === 'pending' && (
          <div className="flex items-center gap-3">
            <button onClick={onApprove} disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <CheckCircle className="w-4 h-4" /> {processing ? 'Processing...' : 'Approve'}
            </button>
            <button onClick={() => setShowRejectModal(true)} disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        )}

        {v.rejection_reason && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-[11px] text-red-700"><strong>Rejection reason:</strong> {v.rejection_reason}</p>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full z-10 p-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-3">Reject Verification</h3>
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
