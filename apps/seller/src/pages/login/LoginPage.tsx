import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../core/contexts/SellerAuthContext';
import { ArrowRight, ArrowLeft, KeyRound, Store, MessageCircle, CreditCard, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { loginWithOtp, verifyOtp } = useSellerAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true);
    setError('');
    try {
      await loginWithOtp(phone);
      setStep('otp');
      setOtp('123456');
    } catch (err: any) {
      setError(err.message || 'No seller account found with this phone number.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError('Enter a valid 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phone, otp);
      if (res?.isNewSeller) {
        setError('No seller account found with this phone number. Please register first.');
        return;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="YYMEE Logo" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain shrink-0 transform group-hover:scale-105 transition-transform" />
            <span className="text-lg sm:text-xl font-black tracking-tight text-neutral-900">
              YYMEE<span className="text-emerald-600">.</span>
            </span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-neutral-600 hover:text-emerald-600 transition-colors">
            Back to home
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[30%] -right-[15%] w-[60%] h-[120%] bg-emerald-50/60 rounded-l-[120px] transform rotate-3" />
          <div className="absolute top-[10%] -right-[8%] w-[50%] h-[90%] bg-emerald-100/30 rounded-l-[100px] transform -rotate-2" />
        </div>

        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* LEFT: Branding */}
          <div className="hidden lg:block">
            <div className="max-w-md">
              <img src="/logo.png" alt="YYMEE" className="w-14 h-14 rounded-2xl object-contain mb-6 shadow-sm" />
              <h1 className="text-4xl font-black text-neutral-900 leading-tight tracking-tight mb-4">
                Welcome back to YYMEE
              </h1>
              <p className="text-lg text-neutral-600 font-medium leading-relaxed mb-8">
                Sign in to manage your store, track orders, and grow your business on YYMEE.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Store, label: 'Zero listing fees', desc: 'List unlimited products for free' },
                  { icon: MessageCircle, label: 'WhatsApp orders', desc: 'Receive orders directly on WhatsApp' },
                  { icon: CreditCard, label: 'Secure payments', desc: 'Get paid directly to your bank account' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{item.label}</p>
                      <p className="text-xs text-neutral-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Form Card */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="lg:hidden text-center mb-6">
              <img src="/logo.png" alt="YYMEE Logo" className="w-12 h-12 rounded-xl object-contain mx-auto mb-3" />
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl shadow-neutral-200/50 p-6 sm:p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Seller Login</h2>
                <p className="text-sm text-neutral-500 mt-1">Welcome back to YYMEE</p>
              </div>

              {/* STEP: PHONE */}
              {step === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2 w-full">
                      <span className="flex items-center px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-700 shrink-0 select-none h-12">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                        className="min-w-0 flex-1 w-full px-4 border border-neutral-200 rounded-xl text-sm font-medium h-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-neutral-400"
                        placeholder="9876543210"
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-medium leading-relaxed">{error}</p>
                      </div>
                      {(error.toLowerCase().includes('no seller account') || error.toLowerCase().includes('register') || error.toLowerCase().includes('not found')) && (
                        <div className="pl-6">
                          <Link to="/signup" className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1">
                            Create a new seller account <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full bg-emerald-600 text-white h-12 rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <>Send OTP <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <p className="text-center text-sm text-neutral-500 pt-1">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                      Create account
                    </Link>
                  </p>
                </form>
              )}

              {/* STEP: OTP */}
              {step === 'otp' && (
                <form onSubmit={handleOtpVerify} className="space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="w-7 h-7 text-emerald-600" />
                    </div>
                    <p className="text-sm text-neutral-600">
                      OTP sent to <span className="font-bold text-neutral-900">+91 {phone}</span>
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-xs font-bold text-emerald-800">SMS Bypass Mode Active</p>
                    </div>
                    <p className="text-sm text-emerald-700 font-semibold">Enter test OTP: <span className="font-black">123456</span></p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                      className="w-full px-4 border border-neutral-200 rounded-xl text-lg text-center tracking-[0.5em] font-mono font-bold h-14 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-neutral-300 placeholder:tracking-widest"
                      placeholder="------"
                      autoFocus
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full bg-emerald-600 text-white h-12 rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      <>Verify & Sign In <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                    className="w-full text-sm text-neutral-500 hover:text-neutral-800 font-medium text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Change phone number
                  </button>
                </form>
              )}
            </div>

            <p className="text-center text-xs text-neutral-400 mt-6">
              By continuing, you agree to YYMEE's{' '}
              <a href="#" className="text-emerald-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
