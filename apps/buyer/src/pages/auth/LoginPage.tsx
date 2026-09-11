import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../core/contexts/AuthContext';
import { ArrowRight, ShieldCheck, ArrowLeft, User, Phone, CheckCircle2, Lock, Sparkles } from 'lucide-react';

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
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your full name.');
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

  const handleBack = () => {
    if (step === 'name') {
      setStep('otp');
    } else if (step === 'otp') {
      setStep('phone');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-emerald-50/70 via-stone-50/50 to-teal-50/50 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Left Back Button */}
      <button
        type="button"
        onClick={handleBack}
        className="fixed top-5 left-5 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-white/90 hover:bg-white border border-neutral-200/90 shadow-xs hover:shadow-md text-neutral-700 hover:text-neutral-900 flex items-center gap-1.5 transition-all z-30 cursor-pointer backdrop-blur-xs text-xs sm:text-sm font-semibold"
        title="Go Back"
        aria-label="Go Back"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="YYMEE"
              className="h-12 sm:h-14 w-auto object-contain drop-shadow-xs"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.logo-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'logo-fallback flex items-center gap-1 font-black text-3xl text-neutral-900 tracking-tight';
                  fallback.innerHTML = '<span class="text-emerald-600">YY</span>MEE';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>


          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            {step === 'name' ? 'Almost There!' : step === 'otp' ? 'Verify Code' : 'Welcome Back'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-xs mx-auto">
            {step === 'name'
              ? 'Tell us your name to personalize your orders'
              : step === 'otp'
              ? `We sent a 6-digit OTP code to +91 ${cleanPhone}`
              : 'Sign in to access your orders, cart, and wishlists'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <span className="shrink-0 text-rose-600 font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Phone */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="flex items-center justify-center gap-1.5 px-3.5 py-3 bg-neutral-100 border border-neutral-200 rounded-l-xl text-sm font-bold text-neutral-700 select-none shrink-0 border-r-0">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError(null);
                    }}
                    placeholder="Enter 10-digit mobile number"
                    autoFocus
                    required
                    className="flex-1 min-w-0 px-4 py-3 border border-neutral-300 rounded-r-xl text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all bg-neutral-50/50 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-neutral-400" />
                  Your phone number is safe with 256-bit encryption
                </p>
              </div>

              <button
                type="submit"
                disabled={cleanPhone.length < 10}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                  cleanPhone.length === 10
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99] shadow-emerald-600/20'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Enter Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setError(null); }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                  placeholder="• • • • • •"
                  autoFocus
                  required
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl text-xl font-mono font-bold tracking-[0.4em] text-center text-neutral-900 focus:outline-none transition-all bg-neutral-50/50 focus:bg-white"
                />

                <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-center">
                  <p className="text-xs text-emerald-800 font-medium">
                    ⚡ Demo Mode: Default OTP is <strong className="font-mono font-bold text-emerald-950">123456</strong>
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
              >
                {loading ? 'Verifying Code...' : 'Verify & Continue'}
                <ShieldCheck className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setError(null); }}
                className="w-full py-1 text-xs text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Phone Number
              </button>
            </form>
          )}

          {/* Step 3: Name (new user) */}
          {step === 'name' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(null); }}
                    placeholder="e.g. Rahul Sharma"
                    autoFocus
                    required
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none transition-all bg-neutral-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mobile verified: <strong>+91 {cleanPhone}</strong></span>
              </div>

              <button
                type="submit"
                disabled={loading || !fullName.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
              >
                {loading ? 'Setting up Profile...' : 'Complete & Start Shopping'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Trust Badges */}
          <div className="mt-6 pt-5 border-t border-neutral-100 grid grid-cols-3 gap-2 text-center text-[10px] text-neutral-500 font-medium">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Sellers</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>100% Privacy</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Fast Checkout</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-neutral-400 mt-6 leading-relaxed">
          By continuing, you agree to YYMEE's{' '}
          <span className="text-neutral-600 font-semibold hover:underline cursor-pointer">Terms of Service</span>{' '}
          and{' '}
          <span className="text-neutral-600 font-semibold hover:underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
