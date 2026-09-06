import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, supabase } from '../../core/contexts/AuthContext';
import { ArrowRight, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';

export function LoginPage() {
  const { loginWithPhone } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      // Check if user exists in database
      const fullPhone = `+91${cleanPhone}`;
      const { data: existingUser, error: checkErr } = await supabase
        .from('users')
        .select('user_id, phone_number')
        .or(`phone_number.eq.${fullPhone},phone_number.eq.${cleanPhone}`)
        .maybeSingle();

      if (checkErr) throw checkErr;

      if (!existingUser) {
        setError('This mobile number is not registered yet. Please create an account first.');
        setLoading(false);
        return;
      }

      // Transition to OTP verification step
      setStep('otp');
      setOtp('123456'); // Pre-fill dev OTP for convenient instant 1-click test
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError('Please enter a 6-digit OTP code.');
      return;
    }

    setLoading(true);

    try {
      await loginWithPhone(cleanPhone, otp.trim());
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#f8faf9]">
      <div className="w-full max-w-sm">
        {/* Logo and Headings matching screenshot */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#009661] text-white font-black text-2xl rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            Y
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Sign in to YYME marketplace</p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            /* PHONE NUMBER STEP */
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
                disabled={loading || cleanPhone.length < 10}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                  cleanPhone.length === 10
                    ? 'bg-[#009661] hover:bg-emerald-700 text-white'
                    : 'bg-[#6dbf9e] text-white opacity-80 cursor-not-allowed'
                }`}
              >
                {loading ? 'Checking...' : 'Send OTP'} <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-neutral-500">New here? </span>
                <Link
                  to="/signup"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Create account
                </Link>
              </div>
            </form>
          ) : (
            /* OTP VERIFICATION STEP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">
                    ENTER OTP CODE
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError(null);
                    }}
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
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError(null);
                  }}
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
                {loading ? 'Verifying...' : 'Verify & Sign In'}{' '}
                <ShieldCheck className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError(null);
                }}
                className="w-full py-1 text-xs text-neutral-500 hover:text-neutral-800 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Phone Number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
