import React, { useState, useEffect } from 'react';
import { useSellerAuth, supabase } from '../../core/contexts/SellerAuthContext';
import { useQuota } from '../../core/contexts/QuotaContext';
import {
  User,
  Store,
  Phone,
  CreditCard,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';

export function ProfilePage() {
  const { sellerProfile, refreshProfile } = useSellerAuth();
  const { tier, clicksRemaining, listingsRemaining } = useQuota();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (sellerProfile) {
      setBusinessName(sellerProfile.business_name || '');
      setOwnerName(sellerProfile.owner_name || '');
      setWhatsappNumber(sellerProfile.whatsapp_number || '');
    }
  }, [sellerProfile]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!sellerProfile) return;
    if (!businessName.trim() || !ownerName.trim() || !whatsappNumber.trim()) {
      showToast('error', 'Business name, owner name, and WhatsApp number are required');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('sellers')
      .update({
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        whatsapp_number: whatsappNumber.trim(),
      })
      .eq('seller_id', sellerProfile.seller_id);

    setSaving(false);

    if (error) {
      showToast('error', 'Failed to update profile: ' + error.message);
    } else {
      await refreshProfile();
      showToast('success', 'Profile updated successfully');
    }
  };

  if (!sellerProfile) return null;

  const statusColors: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending_verification: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-700 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Profile</h1>
        <p className="text-xs text-neutral-500 mt-1">Manage your business information</p>
      </div>

      {/* Account Status */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{sellerProfile.business_name}</p>
              <p className="text-[11px] text-neutral-500">ID: {sellerProfile.seller_id.slice(0, 8)}</p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
              statusColors[sellerProfile.account_status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'
            }`}
          >
            {sellerProfile.account_status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-neutral-900">Subscription</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-neutral-500 uppercase font-semibold">Tier</p>
            <p className="text-sm font-bold text-neutral-900 capitalize mt-0.5">{tier}</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-neutral-500 uppercase font-semibold">Clicks Left</p>
            <p className="text-sm font-bold text-neutral-900 mt-0.5">{clicksRemaining}</p>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-neutral-500 uppercase font-semibold">Listings Left</p>
            <p className="text-sm font-bold text-neutral-900 mt-0.5">{listingsRemaining}</p>
          </div>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900">Business Information</h3>

        <div>
          <label className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Store className="w-3.5 h-3.5 text-neutral-400" /> Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <User className="w-3.5 h-3.5 text-neutral-400" /> Owner Name
          </label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Phone className="w-3.5 h-3.5 text-neutral-400" /> WhatsApp Number
          </label>
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Read-only Info */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-neutral-900">Account Details</h3>

        <div className="flex items-center justify-between py-2 border-b border-neutral-100">
          <span className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Registered Phone
          </span>
          <span className="text-xs font-semibold text-neutral-900">{sellerProfile.phone_number || '—'}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-neutral-100">
          <span className="text-xs text-neutral-500 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> GST Registered
          </span>
          <span className="text-xs font-semibold text-neutral-900">
            {sellerProfile.is_gst_registered ? 'Yes' : 'No'}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-neutral-100">
          <span className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> ID Proof
          </span>
          <span className="text-xs font-semibold text-neutral-900">
            {sellerProfile.id_proof_type
              ? `${sellerProfile.id_proof_type} (${sellerProfile.id_proof_number || '—'})`
              : 'Not submitted'}
          </span>
        </div>


      </div>
    </div>
  );
}
