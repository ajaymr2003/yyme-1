import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { useQuota } from '../../core/contexts/QuotaContext';
import { formatINR } from '@ymenet/utils';
import { ArrowLeft, Check, Upload, Zap, Clock } from 'lucide-react';

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

  useEffect(() => {
    supabase.from('subscription_plans').select('*').order('monthly_price')
      .then(({ data }) => { setPlans((data as any) ?? []); setLoading(false); });
  }, []);

  function handleSelectPlan(planId: string) {
    if (planId === tier) return;
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  }

  async function handleSubmitUpgrade(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || !sellerProfile || !utrNumber.trim()) return;
    setSubmitting(true);

    const plan = plans.find(p => p.plan_id === selectedPlan);
    const { error } = await supabase.from('subscription_upgrade_requests').insert([{
      seller_id: sellerProfile.seller_id,
      target_plan_id: selectedPlan,
      amount_paid: plan?.monthly_price ?? 0,
      payment_method: paymentMethod,
      utr_reference_number: utrNumber.trim(),
    }]);

    if (!error) {
      setSubmitSuccess(true);
      setTimeout(() => { setShowUpgradeModal(false); setSubmitSuccess(false); setUtrNumber(''); }, 3000);
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
                  <button onClick={() => handleSelectPlan(plan.plan_id)}
                    className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                    Upgrade to {plan.name}
                  </button>
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
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">UTR / Reference Number *</label>
                    <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter 12-digit UTR number" />
                    <p className="text-[10px] text-neutral-400 mt-1">After making payment, enter the transaction reference number</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-[11px] text-amber-700">
                      <strong>Payment Details:</strong> UPI ID: yymee@upi | Bank: YYME Marketplace Pvt Ltd
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
                  <button type="button" onClick={() => setShowUpgradeModal(false)} disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || !utrNumber.trim()}
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
