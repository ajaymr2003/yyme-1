import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { useQuota } from '../../core/contexts/QuotaContext';
import { formatINR } from '@ymenet/utils';
import { ArrowLeft, Check, Upload, Zap, Clock, AlertTriangle, Image as ImageIcon, X, Copy, CheckCircle } from 'lucide-react';

const TIER_ORDER = ['free', 'standard', 'premium', 'extra_premium'];

interface Plan {
  plan_id: string;
  name: string;
  monthly_price: number;
  click_quota: number;
  listing_quota: number;
  description: string;
}

export function SubscriptionPage() {
  const { sellerProfile, refreshProfile } = useSellerAuth();
  const { tier } = useQuota();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<Record<string, string>>({});
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  useEffect(() => {
    if (!sellerProfile) return;
    supabase.from('subscription_upgrade_requests')
      .select('*, plan:subscription_plans(name)')
      .eq('seller_id', sellerProfile.seller_id)
      .eq('status', 'pending_approval')
      .maybeSingle()
      .then(({ data }) => setPendingRequest(data));

    supabase.from('platform_config').select('key, value')
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          (data as { key: string; value: string }[]).forEach((e) => { map[e.key] = e.value; });
          setPaymentConfig(map);
        }
      });
    supabase.from('subscription_plans').select('*').order('monthly_price')
      .then(({ data }) => { setPlans((data as any) ?? []); setLoading(false); });
  }, []);

  function handleSelectPlan(planId: string) {
    if (planId === tier || pendingRequest) return;
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  }

  function copyPaymentDetails() {
    const text = paymentMethod === 'UPI'
      ? `UPI ID: ${paymentConfig.upi_id || '—'}`
      : `Bank: ${paymentConfig.bank_name || '—'}\nHolder: ${paymentConfig.account_holder_name || '—'}\nA/C: ${paymentConfig.bank_account_number || '—'}\nIFSC: ${paymentConfig.bank_ifsc || '—'}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB');
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function removeProof() {
    setProofFile(null);
    setProofPreview(null);
  }

  async function handleSubmitUpgrade(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || !sellerProfile || !utrNumber.trim()) return;
    setSubmitting(true);

    let receiptUrl: string | null = null;
    if (proofFile) {
      setUploading(true);
      const ext = proofFile.name.split('.').pop() || 'jpg';
      const filePath = `receipts/${sellerProfile.seller_id}_${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, proofFile);
      setUploading(false);
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('payment-receipts').getPublicUrl(filePath);
        receiptUrl = urlData.publicUrl;
      }
    }

    const plan = plans.find(p => p.plan_id === selectedPlan);
    const { error } = await supabase.from('subscription_upgrade_requests').insert([{
      seller_id: sellerProfile.seller_id,
      target_plan_id: selectedPlan,
      amount_paid: plan?.monthly_price ?? 0,
      payment_method: paymentMethod,
      utr_reference_number: utrNumber.trim(),
      payment_receipt_url: receiptUrl,
    }]);

    if (!error) {
      const plan = plans.find(p => p.plan_id === selectedPlan);
      setPendingRequest({
        target_plan_id: selectedPlan,
        plan: plan ? { name: plan.name } : null,
        created_at: new Date().toISOString(),
      });
      setSubmitSuccess(true);
      setTimeout(() => { setShowUpgradeModal(false); setSubmitSuccess(false); setUtrNumber(''); setProofFile(null); setProofPreview(null); }, 3000);
    }
    setSubmitting(false);
  }

  const currentTierIndex = TIER_ORDER.indexOf(tier);

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Subscription Plans</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Current plan: <span className="font-semibold text-emerald-600 capitalize">{tier}</span></p>
        </div>
      </div>

      {/* Pending Upgrade Banner */}
      {pendingRequest && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Upgrade to {pendingRequest.plan?.name || 'higher tier'} is pending approval
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Admin will review your payment and activate your new tier within 24 hours.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {plans.map((plan, idx) => {
          const isCurrent = plan.plan_id === tier;
          const isUpgrade = TIER_ORDER.indexOf(plan.plan_id) > currentTierIndex;
          const isDowngrade = TIER_ORDER.indexOf(plan.plan_id) < currentTierIndex;

          return (
            <div key={plan.plan_id}
              className={`bg-white border-2 rounded-xl overflow-hidden transition-all ${isCurrent ? 'border-emerald-500 shadow-lg shadow-emerald-100' : isDowngrade ? 'border-neutral-200 opacity-60' : 'border-neutral-200 hover:border-emerald-300 hover:shadow-md'}`}>
              {isCurrent && <div className="bg-emerald-600 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">Current Plan</div>}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-neutral-900">{formatINR(plan.monthly_price)}</p>
                    <p className="text-[10px] text-neutral-400">/month</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-neutral-700">Clicks</span>
                    </div>
                    <p className="text-lg font-bold text-neutral-900">{plan.click_quota}</p>
                    <p className="text-[10px] text-neutral-400">per month</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs">📦</span>
                      <span className="text-xs font-semibold text-neutral-700">Listings</span>
                    </div>
                    <p className="text-lg font-bold text-neutral-900">{plan.listing_quota}</p>
                    <p className="text-[10px] text-neutral-400">products</p>
                  </div>
                </div>

                {isCurrent ? (
                  <div className="w-full py-2.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-lg text-center border border-emerald-200">
                    ✓ Active Plan
                  </div>
                ) : isUpgrade ? (
                  pendingRequest ? (
                    <div className="w-full py-2.5 bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg text-center border border-amber-200 cursor-not-allowed flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" /> Request Under Review
                    </div>
                  ) : (
                    <button onClick={() => handleSelectPlan(plan.plan_id)}
                      className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                      Upgrade to {plan.name}
                    </button>
                  )
                ) : (
                  <div className="w-full py-2.5 bg-neutral-100 text-neutral-400 text-sm font-semibold rounded-lg text-center cursor-not-allowed">
                    Downgrade
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => !submitting && setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full border border-neutral-200 z-10">
            {submitSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Upgrade Request Sent!</h3>
                <p className="text-sm text-neutral-500 mt-2">Admin will review your payment and activate your new tier within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitUpgrade}>
                <div className="px-6 py-4 border-b border-neutral-100">
                  <h3 className="text-base font-semibold text-neutral-900">Upgrade to {plans.find(p => p.plan_id === selectedPlan)?.name}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Amount: {formatINR(plans.find(p => p.plan_id === selectedPlan)?.monthly_price ?? 0)}/month</p>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Payment Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Bank / UPI Details */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider">Send Payment To</p>
                      <button type="button" onClick={copyPaymentDetails}
                        className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                        {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    {paymentMethod === 'UPI' ? (
                      <p className="text-sm font-semibold text-neutral-900">UPI ID: {paymentConfig.upi_id || '—'}</p>
                    ) : (
                      <>
                        <p className="text-xs text-neutral-700"><strong>Bank:</strong> {paymentConfig.bank_name || '—'}</p>
                        {paymentConfig.account_holder_name && <p className="text-xs text-neutral-700"><strong>Holder:</strong> {paymentConfig.account_holder_name}</p>}
                        <p className="text-xs text-neutral-700"><strong>A/C:</strong> {paymentConfig.bank_account_number || '—'}</p>
                        <p className="text-xs text-neutral-700"><strong>IFSC:</strong> {paymentConfig.bank_ifsc || '—'}</p>
                      </>
                    )}
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Please send the payment to the above {paymentMethod === 'UPI' ? 'UPI ID' : 'bank account'} first.
                      Then enter the UTR number and upload the payment screenshot as proof.
                      Your upgrade will be activated after admin verification.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">UTR / Reference Number *</label>
                    <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter 12-digit UTR number" />
                    <p className="text-[10px] text-neutral-400 mt-1">Transaction reference number from your bank/UPI app</p>
                  </div>

                  {/* Payment Proof Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Payment Proof *</label>
                    {proofPreview ? (
                      <div className="relative border border-neutral-200 rounded-lg overflow-hidden">
                        {proofFile?.type === 'application/pdf' ? (
                          <div className="flex items-center gap-3 p-4 bg-neutral-50">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold text-red-600">PDF</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-neutral-900 truncate">{proofFile.name}</p>
                              <p className="text-[10px] text-neutral-500">{(proofFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                        ) : (
                          <img src={proofPreview} alt="Payment proof" className="w-full max-h-48 object-contain bg-neutral-50" />
                        )}
                        <button type="button" onClick={removeProof}
                          className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow hover:bg-red-50 text-neutral-500 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                        <ImageIcon className="w-8 h-8 text-neutral-400" />
                        <span className="text-xs font-medium text-neutral-500">Click to upload screenshot or PDF</span>
                        <span className="text-[10px] text-neutral-400">JPG, PNG, PDF up to 5MB</span>
                        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
                  <button type="button" onClick={() => setShowUpgradeModal(false)} disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || uploading || !utrNumber.trim() || !proofFile}
                    className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                    {submitting ? 'Submitting...' : 'Submit Upgrade Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
