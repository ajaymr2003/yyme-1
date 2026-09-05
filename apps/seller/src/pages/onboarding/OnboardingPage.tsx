import React from 'react';
import { useSellerAuth } from '../../core/contexts/SellerAuthContext';
import { Clock, ShieldAlert, FileText, AlertTriangle } from 'lucide-react';

export function OnboardingPage() {
  const { sellerProfile, signOut } = useSellerAuth();

  const isRejected = sellerProfile?.account_status === 'rejected';

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">Y</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            {isRejected ? 'Verification Rejected' : 'Account Under Review'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          {isRejected ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Your application was not approved</h3>
                  <p className="text-xs text-red-700 mt-1">{sellerProfile?.rejection_reason ?? 'Please contact support for details.'}</p>
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Please ensure your identity documents (GST Certificate or Enrollment ID) are clear and valid. You may need to re-apply with correct documents.
              </p>
              <button onClick={signOut}
                className="w-full bg-neutral-100 text-neutral-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-neutral-200 transition-colors">
                Sign Out & Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-800">Verification in Progress</h3>
                  <p className="text-xs text-amber-700 mt-1">Our team is reviewing your identity documents. This usually takes 24-48 hours.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">What happens next?</h4>
                {[
                  { icon: <FileText className="w-4 h-4 text-blue-600" />, text: 'Admin reviews your submitted documents' },
                  { icon: <ShieldAlert className="w-4 h-4 text-blue-600" />, text: 'Once approved, your account becomes active' },
                  { icon: <Clock className="w-4 h-4 text-blue-600" />, text: 'You receive 20 free clicks + 3 product listings' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-100">
                    {item.icon}
                    <p className="text-xs text-neutral-600">{item.text}</p>
                  </div>
                ))}
              </div>

              <button onClick={signOut}
                className="w-full bg-neutral-100 text-neutral-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-neutral-200 transition-colors">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
