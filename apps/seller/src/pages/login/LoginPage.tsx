import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../core/contexts/SellerAuthContext';
import { ArrowRight, KeyRound } from 'lucide-react';

export function LoginPage() {
  const { signUp, loginWithOtp, verifyOtp } = useSellerAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true);
    setError('');
    try {
      if (isSignup) {
        await loginWithOtp(phone);
      } else {
        await loginWithOtp(phone);
      }
      setStep('otp');
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError('Enter a valid 6-digit OTP (e.g. 123456)'); return; }
    setLoading(true);
    setError('');
    try {
      if (isSignup) {
        await signUp(phone);
      } else {
        await verifyOtp(phone, otp);
      }
      navigate('/');
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">Y</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            {isSignup ? 'Create Seller Account' : 'Seller Login'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isSignup ? 'Start selling on YYME marketplace' : 'Welcome back to YYME'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700">+91</span>
                  <input type="tel" value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="9876543210" />
                </div>
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button type="submit" disabled={loading || phone.length < 10}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-xs text-neutral-500">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button type="button" onClick={() => { setIsSignup(!isSignup); setError(''); }}
                  className="text-emerald-600 font-semibold hover:underline">
                  {isSignup ? 'Sign in' : 'Create account'}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="text-center">
                <KeyRound className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">OTP sent to <span className="font-semibold text-neutral-900">+91{phone}</span></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Enter OTP</label>
                <input type="text" value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="123456" autoFocus />
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full text-xs text-neutral-500 hover:text-neutral-800 underline">Change phone number</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
