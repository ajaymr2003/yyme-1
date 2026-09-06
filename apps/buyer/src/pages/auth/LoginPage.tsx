import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/contexts/AuthContext';
import { Phone, ArrowRight, KeyRound } from 'lucide-react';

export function LoginPage() {
  const { loginWithPhone } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true);
    setError('');
    try {
      setStep('otp');
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError('Enter a valid 6-digit OTP (e.g. 123456)'); return; }
    setLoading(true);
    setError('');
    try {
      await loginWithPhone(phone, otp);
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
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-neutral-500 mt-1">Sign in to YYME marketplace</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700">+91</span>
                  <input type="tel" value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="9876543210" />
                </div>
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button type="submit" disabled={loading || phone.length < 10}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-xs text-neutral-500">
                New here? <Link to="/signup" className="text-emerald-600 font-semibold hover:underline">Create account</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Enter OTP sent to +91{phone}</label>
                <input type="text" value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="123456" autoFocus />
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {loading ? 'Verifying...' : 'Verify & Sign In'} <KeyRound className="w-4 h-4" />
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
