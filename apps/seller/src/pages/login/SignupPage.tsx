import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSellerAuth, uploadSellerDocument } from '../../core/contexts/SellerAuthContext';
import { ArrowRight, ArrowLeft, KeyRound, Store, ShieldCheck, FileUp, Check, AlertCircle, MessageCircle, CreditCard, Sparkles } from 'lucide-react';

const IDENTITY_PROOF_OPTIONS = [
  { id: 'AADHAAR', name: 'Aadhaar Card', placeholder: 'Enter 12-digit Aadhaar number' },
  { id: 'PAN', name: 'PAN Card', placeholder: 'Enter 10-character PAN (e.g. ABCDE1234F)' },
  { id: 'DRIVING_LICENCE', name: 'Driving Licence', placeholder: 'Enter Driving Licence number' },
  { id: 'VOTER_ID', name: 'Voter ID (EPIC)', placeholder: 'Enter Voter ID number' },
  { id: 'PASSPORT', name: 'Passport', placeholder: 'Enter Passport number' },
];

export function SignupPage() {
  const { signUp, verifyOtp, completeRegistration } = useSellerAuth();
  const [searchParams] = useSearchParams();
  const paramPhone = searchParams.get('phone') || '';
  const paramName = searchParams.get('name') || '';
  const paramUserId = searchParams.get('user_id') || '';
  const paramBuyerId = searchParams.get('buyer_id') || '';

  const cleanInitialPhone = paramPhone.replace(/\D/g, '').slice(-10);

  const [step, setStep] = useState<'phone' | 'otp' | 'store' | 'identity'>('phone');
  const [phone, setPhone] = useState(cleanInitialPhone);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(paramName);
  const [registeredPhone, setRegisteredPhone] = useState(cleanInitialPhone);
  const [whatsappNumber, setWhatsappNumber] = useState(cleanInitialPhone);
  const [sameAsRegistered, setSameAsRegistered] = useState(true);

  const [idProofType, setIdProofType] = useState('AADHAAR');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true);
    setError('');
    console.log('[Seller Signup] 📱 Step 1: Submitting phone for registration:', phone);
    try {
      await signUp(phone);
      setStep('otp');
      setOtp('123456');
      setRegisteredPhone(phone);
      setWhatsappNumber(phone);
      setSameAsRegistered(true);
      console.log('[Seller Signup] Moving to Step 2: OTP verification');
    } catch (err: any) { 
      console.error('[Seller Signup] Phone submit error:', err);
      setError(err.message); 
    }
    setLoading(false);
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError('Enter a valid 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    console.log('[Seller Signup] 🔑 Step 2: Verifying OTP for phone:', phone, 'otp:', otp);
    try {
      await verifyOtp(phone, otp);
      setStep('store');
      setRegisteredPhone(phone);
      setWhatsappNumber(phone);
      setSameAsRegistered(true);
      console.log('[Seller Signup] Moving to Step 3: Store details form');
    } catch (err: any) { 
      console.error('[Seller Signup] OTP verify error:', err);
      setError(err.message); 
    }
    setLoading(false);
  }

  function handleStoreNext(e: React.FormEvent) {
    e.preventDefault();
    const finalPhone = (registeredPhone || phone).replace(/\D/g, '').slice(-10);
    const finalWhatsapp = (sameAsRegistered ? finalPhone : whatsappNumber).replace(/\D/g, '').slice(-10);

    console.log('[Seller Signup] 🏪 Step 3: Validating store details:', {
      businessName,
      ownerName,
      finalPhone,
      finalWhatsapp,
    });

    if (!businessName.trim()) { setError('Please enter your Business / Store Name'); return; }
    if (!ownerName.trim()) { setError('Please enter the Owner Name'); return; }
    if (finalPhone.length !== 10) { setError('Please enter a valid 10-digit Phone Number'); return; }
    if (finalWhatsapp.length !== 10) { setError('Please enter a valid 10-digit WhatsApp Number'); return; }

    setError('');
    setStep('identity');
    console.log('[Seller Signup] Moving to Step 4: Identity verification');
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalPhone = (registeredPhone || phone).replace(/\D/g, '').slice(-10);
    const finalWhatsapp = (sameAsRegistered ? finalPhone : whatsappNumber).replace(/\D/g, '').slice(-10);

    if (!idProofNumber.trim()) {
      setError(`Please enter your ${IDENTITY_PROOF_OPTIONS.find(o => o.id === idProofType)?.name || 'ID'} number`);
      return;
    }

    setLoading(true);
    setError('');

    const registrationPayload = {
      phone: finalPhone,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      whatsappNumber: finalWhatsapp,
      idProofType,
      idProofNumber: idProofNumber.trim(),
      userId: paramUserId || undefined,
      buyerId: paramBuyerId || undefined,
      is_both: true,
    };

    console.log('[Seller Signup] 🚀 Step 4: Submitting final registration payload (setting is_both: true):', registrationPayload);

    try {
      let docUrl = '';
      if (documentFile) {
        console.log('[Seller Signup] Uploading document file...');
        docUrl = await uploadSellerDocument(documentFile, finalPhone);
      }

      await completeRegistration({
        ...registrationPayload,
        idDocumentUrl: docUrl || undefined,
      });

      console.log('[Seller Signup] ✅ Registration succeeded! Redirecting to seller dashboard (/)');
      navigate('/');
    } catch (err: any) {
      console.error('[Seller Signup] ❌ Final registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  }

  const stepTitle =
    step === 'store' || step === 'identity'
      ? 'Complete Store Setup'
      : 'Create Seller Account';

  const stepSubtitle =
    step === 'store'
      ? 'Step 1 of 2 — Fill in your store details'
      : step === 'identity'
      ? 'Step 2 of 2 — Verify your identity'
      : 'Start selling on YYMEE marketplace';

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
                {step === 'phone' || step === 'otp'
                  ? 'Start your selling journey on YYMEE'
                  : 'Set up your store in minutes'}
              </h1>
              <p className="text-lg text-neutral-600 font-medium leading-relaxed mb-8">
                {step === 'phone' || step === 'otp'
                  ? 'List unlimited products, reach crores of buyers, and grow your business — all at zero listing fees.'
                  : 'Complete your store profile and identity verification to start receiving orders from buyers across India.'}
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
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">{stepTitle}</h2>
                <p className="text-sm text-neutral-500 mt-1">{stepSubtitle}</p>

                {(paramBuyerId || paramUserId) && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Connected with your YYME buyer account</span>
                  </div>
                )}

                {(step === 'store' || step === 'identity') && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      step === 'store'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <Store className="w-3.5 h-3.5" />
                      <span>1. Store</span>
                    </div>
                    <div className="w-6 h-0.5 bg-neutral-200 rounded-full" />
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      step === 'identity'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>2. Identity</span>
                    </div>
                  </div>
                )}
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
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs text-red-600 font-medium">{error}</p>
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
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                      Sign in
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
                      <>Verify & Continue Setup <ArrowRight className="w-4 h-4" /></>
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

              {/* STEP 1 OF 2: STORE DETAILS */}
              {step === 'store' && (
                <form onSubmit={handleStoreNext} className="space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Store className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-neutral-900">Store Profile</span>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                      Free Tier
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Business / Store Name *
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Malabar Handicrafts & Spices"
                      required
                      className="w-full min-w-0 px-4 border border-neutral-200 rounded-xl text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-neutral-400"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      required
                      className="w-full min-w-0 px-4 border border-neutral-200 rounded-xl text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-neutral-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Phone Number (Registered Mobile) *
                    </label>
                    <div className="flex gap-2 w-full">
                      <span className="flex items-center px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-700 shrink-0 select-none h-11">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={registeredPhone || phone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setRegisteredPhone(val);
                          if (sameAsRegistered) setWhatsappNumber(val);
                        }}
                        placeholder="9876543210"
                        required
                        className="min-w-0 flex-1 w-full px-4 border border-neutral-200 rounded-xl text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-neutral-50/60 placeholder:text-neutral-400"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1.5">
                      Primary mobile number associated with your seller account
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      WhatsApp Orders Number *
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl cursor-pointer mb-2 hover:bg-emerald-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={sameAsRegistered}
                        onChange={e => {
                          const checked = e.target.checked;
                          setSameAsRegistered(checked);
                          if (checked) setWhatsappNumber(registeredPhone || phone);
                        }}
                        className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                      <span className="text-xs font-semibold text-emerald-900 select-none">
                        Same as registered number (+91 {registeredPhone || phone})
                      </span>
                    </label>

                    <div className="flex gap-2 w-full">
                      <span className="flex items-center px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-700 shrink-0 select-none h-11">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={sameAsRegistered ? (registeredPhone || phone) : whatsappNumber}
                        disabled={sameAsRegistered}
                        onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        required
                        className={`min-w-0 flex-1 w-full px-4 border border-neutral-200 rounded-xl text-sm h-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                          sameAsRegistered ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1.5">
                      Buyers will send WhatsApp orders directly to this number
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 text-white h-12 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5"
                    >
                      Continue to Identity Verification <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep('phone'); setError(''); }}
                      className="w-full text-center text-sm text-neutral-500 hover:text-neutral-800 font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2 OF 2: IDENTITY PROOF & DOCUMENT UPLOAD */}
              {step === 'identity' && (
                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-neutral-900">Identity Verification</span>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-full font-semibold">
                      KYC
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Select Identity Proof *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {IDENTITY_PROOF_OPTIONS.map(option => (
                        <label
                          key={option.id}
                          onClick={() => setIdProofType(option.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            idProofType === option.id
                              ? 'border-emerald-500 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-500/20'
                              : 'border-neutral-200 hover:border-neutral-300 bg-white'
                          }`}
                        >
                          <span className={`text-sm font-medium ${idProofType === option.id ? 'text-emerald-900' : 'text-neutral-700'}`}>{option.name}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            idProofType === option.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-300'
                          }`}>
                            {idProofType === option.id && <Check className="w-3 h-3" />}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {IDENTITY_PROOF_OPTIONS.find(o => o.id === idProofType)?.name} Number *
                    </label>
                    <input
                      type="text"
                      value={idProofNumber}
                      onChange={e => setIdProofNumber(e.target.value)}
                      placeholder={IDENTITY_PROOF_OPTIONS.find(o => o.id === idProofType)?.placeholder}
                      required
                      className="w-full min-w-0 px-4 border border-neutral-200 rounded-xl text-sm h-11 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all uppercase placeholder:normal-case placeholder:text-neutral-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Upload Document Copy (Optional)
                    </label>
                    <label className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      documentFile ? 'border-emerald-500 bg-emerald-50/40' : 'border-neutral-200 hover:border-emerald-400 bg-neutral-50/50 hover:bg-emerald-50/20'
                    }`}>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setDocumentFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                        documentFile ? 'bg-emerald-100' : 'bg-neutral-100'
                      }`}>
                        <FileUp className={`w-6 h-6 ${documentFile ? 'text-emerald-600' : 'text-neutral-400'}`} />
                      </div>
                      {documentFile ? (
                        <div>
                          <p className="text-sm font-bold text-emerald-800 break-all">{documentFile.name}</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {(documentFile.size / 1024).toFixed(1)} KB — Click to change
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-neutral-700">Click to upload document photo or PDF</p>
                          <p className="text-xs text-neutral-400 mt-0.5">JPG, PNG or PDF (Max 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 text-white h-12 rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Setting up...
                        </div>
                      ) : (
                        <>Complete Setup & Enter Dashboard <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep('store'); setError(''); }}
                      className="w-full text-center text-sm text-neutral-500 hover:text-neutral-800 font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Store Details
                    </button>
                  </div>
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
