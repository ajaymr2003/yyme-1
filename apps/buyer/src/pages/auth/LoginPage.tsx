import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../core/contexts/AuthContext';
import { ArrowRight, ShieldCheck, ArrowLeft, User } from 'lucide-react';

export function LoginPage() {
  const { verifyOtp, completeRegistration } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setStep('otp');
    setOtp('123456');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.trim().length !== 6) {
      setError('Please enter a 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOtp(cleanPhone, otp.trim());
      if (result.isNewUser) {
        setStep('name');
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    setLoading(true);
    try {
      await completeRegistration(cleanPhone, fullName.trim());
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#f8faf9]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#009661] text-white font-black text-2xl rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            Y
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            {step === 'name' ? 'Almost Done' : 'Welcome'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {step === 'name' ? 'Enter your name to finish setup' : 'Sign in to YYME marketplace'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Step 1: Phone */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">
                  PHONE NUMBER
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-3.5 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-700 select-none">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError(null);
                    }}
                    placeholder="9876543210"
                    autoFocus
                    required
                    className="flex-1 px-3.5 py-2.5 border border-emerald-500 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={cleanPhone.length < 10}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                  cleanPhone.length === 10
                    ? 'bg-[#009661] hover:bg-emerald-700 text-white'
                    : 'bg-[#6dbf9e] text-white opacity-80 cursor-not-allowed'
                }`}
              >
                Send OTP <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">
                    ENTER OTP CODE
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setError(null); }}
                    className="text-[11px] font-semibold text-emerald-600 hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mb-2">Sent to +91 {cleanPhone}</p>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                  placeholder="123456"
                  autoFocus
                  required
                  className="w-full px-4 py-2.5 border border-emerald-500 rounded-xl text-base font-mono font-bold tracking-widest text-center text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg font-medium text-center mt-2 border border-emerald-100">
                  Demo Mode: Default OTP is <strong>123456</strong>
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-[#009661] hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'} <ShieldCheck className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(null); }}
                className="w-full py-1 text-xs text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Phone Number
              </button>
            </form>
          )}

          {/* Step 3: Name (new user) */}
          {step === 'name' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(null); }}
                    placeholder="e.g. Ajay M R"
                    autoFocus
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 border border-neutral-300 focus:border-emerald-500 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mobile verified: <strong>+91 {cleanPhone}</strong></span>
              </div>
              <button
                type="submit"
                disabled={loading || !fullName.trim()}
                className="w-full bg-[#009661] hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Start Shopping'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
