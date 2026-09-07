import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerAuth, uploadSellerDocument } from '../../core/contexts/SellerAuthContext';
import { Phone, ArrowRight, ArrowLeft, KeyRound, Store, User, ShieldCheck, FileUp, Check, AlertCircle } from 'lucide-react';

const IDENTITY_PROOF_OPTIONS = [
  { id: 'AADHAAR', name: 'Aadhaar Card', placeholder: 'Enter 12-digit Aadhaar number' },
  { id: 'PAN', name: 'PAN Card', placeholder: 'Enter 10-character PAN (e.g. ABCDE1234F)' },
  { id: 'DRIVING_LICENCE', name: 'Driving Licence', placeholder: 'Enter Driving Licence number' },
  { id: 'VOTER_ID', name: 'Voter ID (EPIC)', placeholder: 'Enter Voter ID number' },
  { id: 'PASSPORT', name: 'Passport', placeholder: 'Enter Passport number' },
];

export function LoginPage() {
  const { signUp, loginWithOtp, verifyOtp, completeRegistration } = useSellerAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'store' | 'identity'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Store profile fields
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sameAsRegistered, setSameAsRegistered] = useState(true);

  // Step 2: Identity proof fields
  const [idProofType, setIdProofType] = useState('AADHAAR');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true);
    setError('');
    try {
      if (isSignup) await signUp(phone);
      else await loginWithOtp(phone);
      setStep('otp');
      setOtp('123456');
      setRegisteredPhone(phone);
      setWhatsappNumber(phone);
      setSameAsRegistered(true);
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setError('Enter a valid 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phone, otp);
      if (isSignup || res.isNewSeller) {
        setStep('store');
        setRegisteredPhone(phone);
        setWhatsappNumber(phone);
        setSameAsRegistered(true);
      } else {
        navigate('/');
      }
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  function handleStoreNext(e: React.FormEvent) {
    e.preventDefault();
    const finalPhone = (registeredPhone || phone).replace(/\D/g, '').slice(-10);
    const finalWhatsapp = (sameAsRegistered ? finalPhone : whatsappNumber).replace(/\D/g, '').slice(-10);

    if (!businessName.trim()) { setError('Please enter your Business / Store Name'); return; }
    if (!ownerName.trim()) { setError('Please enter the Owner Name'); return; }
    if (finalPhone.length !== 10) { setError('Please enter a valid 10-digit Phone Number'); return; }
    if (finalWhatsapp.length !== 10) { setError('Please enter a valid 10-digit WhatsApp Number'); return; }

    setError('');
    setStep('identity');
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

    try {
      let docUrl = '';
      if (documentFile) {
        docUrl = await uploadSellerDocument(documentFile, finalPhone);
      }

      await completeRegistration({
        phone: finalPhone,
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        whatsappNumber: finalWhatsapp,
        idProofType,
        idProofNumber: idProofNumber.trim(),
        idDocumentUrl: docUrl || undefined,
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20">
            <span className="text-white font-black text-2xl">Y</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            {step === 'store' || step === 'identity'
              ? 'Complete Store Setup'
              : isSignup
              ? 'Create Seller Account'
              : 'Seller Login'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {step === 'store'
              ? 'Step 1 of 2: Fill in your store details'
              : step === 'identity'
              ? 'Step 2 of 2: Verify your identity & upload document'
              : isSignup
              ? 'Start selling on YYME marketplace'
              : 'Welcome back to YYME'}
          </p>

          {/* Setup Progress Pills */}
          {(step === 'store' || step === 'identity') && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                step === 'store'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                <Store className="w-3.5 h-3.5" />
                <span>1. Store Profile</span>
              </div>
              <div className="w-4 h-0.5 bg-neutral-200" />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                step === 'identity'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-500'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>2. Identity Proof</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-7">
          {/* STEP: PHONE */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="flex gap-2 w-full">
                  <span className="flex items-center px-3 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 shrink-0 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    className="min-w-0 flex-1 w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="9876543210"
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-neutral-500 pt-1">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignup(!isSignup); setError(''); }}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  {isSignup ? 'Sign in' : 'Create account'}
                </button>
              </p>
            </form>
          )}

          {/* STEP: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="text-center">
                <KeyRound className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">
                  OTP sent to <span className="font-semibold text-neutral-900">+91{phone}</span>
                </p>
                <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs text-emerald-800 font-medium">SMS Bypass Mode Active</p>
                  <p className="text-[11px] text-emerald-600">Enter test OTP: <span className="font-bold">123456</span></p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">{phone}@ymenet.com</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="123456"
                  autoFocus
                />
              </div>

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? 'Verifying...' : isSignup ? 'Verify & Continue Setup' : 'Verify & Sign In'} <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full text-xs text-neutral-500 hover:text-neutral-800 underline text-center"
              >
                Change phone number
              </button>
            </form>
          )}

          {/* STEP 1 OF 2: STORE DETAILS */}
          {step === 'store' && (
            <form onSubmit={handleStoreNext} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-bold text-neutral-900">Store Profile</span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                  Free Tier (20 Clicks + 3 Listings)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Malabar Handicrafts & Spices"
                  required
                  className="w-full min-w-0 px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  required
                  className="w-full min-w-0 px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Phone Number (Registered Mobile) *
                </label>
                <div className="flex gap-2 w-full">
                  <span className="flex items-center px-3 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 shrink-0 select-none">
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
                    className="min-w-0 flex-1 w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-neutral-50/60"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Primary mobile number associated with your seller account
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    WhatsApp Orders Number *
                  </label>
                </div>

                {/* Same as registered number toggle checkbox */}
                <label className="flex items-center gap-2.5 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg cursor-pointer mb-2 hover:bg-emerald-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={sameAsRegistered}
                    onChange={e => {
                      const checked = e.target.checked;
                      setSameAsRegistered(checked);
                      if (checked) {
                        setWhatsappNumber(registeredPhone || phone);
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <span className="text-xs font-medium text-emerald-950 select-none">
                    Same as registered number (+91 {registeredPhone || phone})
                  </span>
                </label>

                <div className="flex gap-2 w-full">
                  <span className="flex items-center px-3 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 shrink-0 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={sameAsRegistered ? (registeredPhone || phone) : whatsappNumber}
                    disabled={sameAsRegistered}
                    onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    required
                    className={`min-w-0 flex-1 w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      sameAsRegistered ? 'bg-neutral-100 text-neutral-600 cursor-not-allowed' : 'bg-white'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Buyers will send WhatsApp orders directly to this number
                </p>
              </div>

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  Continue to Identity Verification <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setError(''); }}
                  className="w-full text-center text-xs text-neutral-500 hover:text-neutral-800 underline"
                >
                  Cancel & Return to Login
                </button>
              </div>
            </form>
          )}

          {/* STEP 2 OF 2: IDENTITY PROOF & DOCUMENT UPLOAD */}
          {step === 'identity' && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-bold text-neutral-900">Identity Verification</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md font-medium">
                  KYC Requirement
                </span>
              </div>

              {/* Select Proof Type */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Select Identity Proof *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {IDENTITY_PROOF_OPTIONS.map(option => (
                    <label
                      key={option.id}
                      onClick={() => setIdProofType(option.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        idProofType === option.id
                          ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-medium shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      <span className="text-xs">{option.name}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        idProofType === option.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-300'
                      }`}>
                        {idProofType === option.id && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Identity Document Number */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  {IDENTITY_PROOF_OPTIONS.find(o => o.id === idProofType)?.name} Number *
                </label>
                <input
                  type="text"
                  value={idProofNumber}
                  onChange={e => setIdProofNumber(e.target.value)}
                  placeholder={IDENTITY_PROOF_OPTIONS.find(o => o.id === idProofType)?.placeholder}
                  required
                  className="w-full min-w-0 px-3 py-2.5 border border-neutral-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase"
                />
              </div>

              {/* Document File Upload */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Upload Document Copy (Optional / Recommended)
                </label>
                <label className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  documentFile ? 'border-emerald-500 bg-emerald-50/40' : 'border-neutral-200 hover:border-emerald-400 bg-neutral-50/50'
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
                  <FileUp className={`w-7 h-7 mb-1.5 ${documentFile ? 'text-emerald-600' : 'text-neutral-400'}`} />
                  {documentFile ? (
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 break-all">{documentFile.name}</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        {(documentFile.size / 1024).toFixed(1)} KB &bull; Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-neutral-700">Click to upload document photo or PDF</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">JPG, PNG or PDF (Max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? 'Submitting & Creating Store...' : 'Complete Setup & Enter Dashboard'} <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('store'); setError(''); }}
                  className="w-full text-center text-xs text-neutral-500 hover:text-neutral-800 flex items-center justify-center gap-1 py-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Store Details
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

