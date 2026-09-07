import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../core/contexts/AdminAuthContext';
import { formatDateTime } from '@ymenet/utils';
import {
  ArrowLeft, ShieldCheck, CheckCircle2, XCircle, ExternalLink,
  Store, User, Phone, FileText, Clock, AlertTriangle, Eye, ZoomIn
} from 'lucide-react';
import { SellerVerification } from '../../core/types';

const PROOF_NAMES: Record<string, string> = {
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  DRIVING_LICENCE: 'Driving Licence',
  VOTER_ID: 'Voter ID',
  PASSPORT: 'Passport',
  GST: 'GST Certificate',
  ENROLLMENT_ID: 'Enrolment ID',
  DISABILITY_PROOF: 'Disability Certificate',
};

export function VerificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [verification, setVerification] = useState<SellerVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    async function fetchDetail() {
      if (!id) return;
      setLoading(true);
      setError('');

      try {
        if (id.startsWith('synthetic-')) {
          const sellerId = id.replace('synthetic-', '');
          const { data: seller } = await supabase
            .from('sellers')
            .select('*')
            .eq('seller_id', sellerId)
            .single();

          if (seller) {
            setVerification({
              record_id: id,
              seller_id: seller.seller_id,
              verification_type: 'AADHAAR',
              reference_number: 'New Store Application',
              document_url: null,
              status: 'pending',
              verified_on: null,
              rejection_reason: null,
              created_at: seller.created_at || new Date().toISOString(),
              seller,
            });
          } else {
            setError('Seller record not found');
          }
        } else {
          const { data, error: fetchErr } = await supabase
            .from('seller_verifications')
            .select('*, seller:sellers(*)')
            .eq('record_id', id)
            .single();

          if (fetchErr) throw fetchErr;
          setVerification(data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load verification details');
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [id]);

  async function handleApprove() {
    if (!verification) return;
    setProcessing(true);

    try {
      if (verification.record_id.startsWith('synthetic-')) {
        await supabase.from('seller_verifications').insert([{
          seller_id: verification.seller_id,
          verification_type: 'AADHAAR',
          reference_number: 'Approved by Admin',
          status: 'verified',
          verified_on: new Date().toISOString(),
        }]);
      } else {
        await supabase.from('seller_verifications')
          .update({ status: 'verified', verified_on: new Date().toISOString() })
          .eq('record_id', verification.record_id);
      }

      await supabase.from('sellers')
        .update({ account_status: 'active' })
        .eq('seller_id', verification.seller_id);

      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user?.id) {
          await supabase.from('audit_logs').insert([{
            admin_id: authData.user.id,
            action: 'VERIFY_IDENTITY',
            target_id: verification.seller_id,
            details: { verification_type: verification.verification_type, reference_number: verification.reference_number }
          }]);
        }
      } catch {
        // Non-blocking
      }

      navigate('/verifications');
    } catch (err: any) {
      alert('Error approving seller: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!verification || !rejectReason.trim()) return;
    setProcessing(true);

    try {
      if (verification.record_id.startsWith('synthetic-')) {
        await supabase.from('seller_verifications').insert([{
          seller_id: verification.seller_id,
          verification_type: 'AADHAAR',
          reference_number: 'N/A',
          status: 'rejected',
          rejection_reason: rejectReason.trim(),
        }]);
      } else {
        await supabase.from('seller_verifications')
          .update({ status: 'rejected', rejection_reason: rejectReason.trim() })
          .eq('record_id', verification.record_id);
      }

      await supabase.from('sellers')
        .update({ account_status: 'rejected', rejection_reason: rejectReason.trim() })
        .eq('seller_id', verification.seller_id);

      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user?.id) {
          await supabase.from('audit_logs').insert([{
            admin_id: authData.user.id,
            action: 'REJECT_IDENTITY',
            target_id: verification.seller_id,
            details: { reason: rejectReason.trim() }
          }]);
        }
      } catch {
        // Non-blocking
      }

      navigate('/verifications');
    } catch (err: any) {
      alert('Error rejecting seller: ' + (err.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
        <p className="text-xs text-neutral-500 mt-3 font-medium">Loading verification details...</p>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-neutral-900">Verification Not Found</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">{error || 'Unable to retrieve this record.'}</p>
        <Link
          to="/verifications"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Queue
        </Link>
      </div>
    );
  }

  const v = verification;
  const isImageDoc = v.document_url && (
    v.document_url.includes('.png') ||
    v.document_url.includes('.jpg') ||
    v.document_url.includes('.jpeg') ||
    v.document_url.includes('.webp')
  );

  const statusBadges: Record<string, { bg: string; label: string }> = {
    pending: { bg: 'bg-amber-50 border-amber-200 text-amber-800', label: 'Pending Review' },
    verified: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', label: 'Approved & Active' },
    rejected: { bg: 'bg-red-50 border-red-200 text-red-800', label: 'Rejected' },
  };

  const badge = statusBadges[v.status] || statusBadges.pending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/verifications')}
            className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 text-neutral-700 transition-colors shadow-sm"
            title="Back to queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900">{v.seller?.business_name || 'Store Application'}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Submitted on {formatDateTime(v.created_at)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {v.status === 'pending' ? (
            <>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                <XCircle className="w-4 h-4" /> Reject Application
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={processing}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> {processing ? 'Approving...' : 'Approve Seller'}
              </button>
            </>
          ) : (
            v.status === 'rejected' && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Change to Approved
              </button>
            )
          )}
        </div>
      </div>

      {/* Rejection notice if rejected */}
      {v.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-red-900">Application Rejected</h4>
            <p className="text-xs text-red-800 mt-0.5"><strong>Reason:</strong> {v.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Layout: Left (Details) & Right (Document) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Store & Identity Information (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Store & Contact Information */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <Store className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900">Store & Contact Profile</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Business / Store Name</p>
                <p className="text-sm font-semibold text-neutral-900 mt-0.5">{v.seller?.business_name || 'N/A'}</p>
              </div>

              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Owner Name</p>
                <p className="text-sm font-medium text-neutral-800 mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" /> {v.seller?.owner_name || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Registered Mobile Number</p>
                <p className="text-sm font-mono font-medium text-neutral-900 mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" /> {v.seller?.phone_number || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">WhatsApp Orders Number</p>
                <p className="text-sm font-mono font-medium text-emerald-800 mt-0.5 flex items-center gap-1.5">
                  +91 {v.seller?.whatsapp_number || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Tier</p>
                <p className="text-xs font-semibold text-neutral-700 mt-0.5 uppercase">
                  {v.seller?.subscription_tier || 'Free Tier'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Identity Proof Details */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900">Identity Proof Information</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Document Type</p>
                <p className="text-sm font-bold text-neutral-900 mt-0.5">
                  {PROOF_NAMES[v.verification_type] || v.verification_type || 'Aadhaar Card'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Document / ID Number</p>
                <p className="text-base font-mono font-bold text-emerald-900 mt-0.5 tracking-wider">
                  {v.reference_number || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Verification Status</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mt-1 ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>

              {v.document_url && (
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Direct Link</p>
                  <a
                    href={v.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold rounded-lg text-xs hover:bg-emerald-100 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Document in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Uploaded Document Viewer (7 cols, sticky on desktop) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-3 lg:sticky lg:top-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900">Uploaded Document Copy</h3>
            </div>
            {v.document_url && (
              <a
                href={v.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full File
              </a>
            )}
          </div>

          {v.document_url ? (
            isImageDoc ? (
              <div className="bg-neutral-50 rounded-xl p-3 flex flex-col items-center justify-center border border-neutral-200">
                <img
                  src={v.document_url}
                  alt="Document Preview"
                  className="max-h-[720px] w-auto max-w-full rounded-lg shadow-sm object-contain"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-full h-[600px] sm:h-[720px] bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 shadow-inner">
                  <iframe
                    src={v.document_url}
                    title="Document Preview"
                    className="w-full h-full border-0"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 text-right">
                  If the document does not display automatically, you can{' '}
                  <a
                    href={v.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 underline font-medium"
                  >
                    open it in a new window
                  </a>
                  .
                </p>
              </div>
            )
          ) : (
            <div className="py-16 text-center bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-400">No document file was uploaded with this application.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-neutral-900 mb-1">Reject Seller Application</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Enter the reason for rejection. This reason will be shown to the seller on their login screen so they can re-upload correct documents.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
              placeholder="e.g. Document image is blurry. Please upload a clear photo of your Aadhaar card."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
