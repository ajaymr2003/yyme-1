import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from 'lucide-react';

const convertToWebP = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        resolve(blob || file);
      }, 'image/webp', 0.85);
    };
    img.onerror = () => resolve(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export function ProfilePage() {
  const { sellerProfile, refreshProfile } = useSellerAuth();
  const { tier, clicksRemaining, listingsRemaining } = useQuota();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sellerProfile) {
      setBusinessName(sellerProfile.business_name || '');
      setOwnerName(sellerProfile.owner_name || '');
      setWhatsappNumber(sellerProfile.whatsapp_number || '');
      setLogoUrl(sellerProfile.logo_url || '');
      setBannerUrl(sellerProfile.banner_url || '');
    }
  }, [sellerProfile]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUploadImage = async (file: File, type: 'logo' | 'banner') => {
    if (!sellerProfile) return;
    try {
      if (type === 'logo') setUploadingLogo(true);
      else setUploadingBanner(true);

      const webpBlob = await convertToWebP(file);
      const fileName = `${sellerProfile.seller_id}_${type}_${Date.now()}.webp`;
      const filePath = `seller_branding/${type}s/${fileName}`;

      // Try 'product-images' bucket first (standard public bucket in this system)
      let targetBucket = 'product-images';
      let uploadRes = await supabase.storage
        .from(targetBucket)
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadRes.error) {
        // Fallback to seller-assets or payment-receipts if bucket differs
        targetBucket = 'seller-assets';
        uploadRes = await supabase.storage
          .from(targetBucket)
          .upload(filePath, webpBlob, {
            contentType: 'image/webp',
            upsert: true,
          });
      }

      if (uploadRes.error) {
        throw new Error(uploadRes.error.message);
      }

      const { data } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        if (type === 'logo') {
          setLogoUrl(data.publicUrl);
        } else {
          setBannerUrl(data.publicUrl);
        }
        showToast('success', `${type === 'logo' ? 'Logo' : 'Cover banner'} uploaded! Click "Save Changes" to apply.`);
      }
    } catch (err: any) {
      console.error(`Error uploading ${type}:`, err);
      showToast('error', `Failed to upload image: ${err.message || 'Storage error'}`);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!sellerProfile) return;
    if (!businessName.trim() || !ownerName.trim() || !whatsappNumber.trim()) {
      showToast('error', 'Business name, owner name, and WhatsApp number are required');
      return;
    }

    setSaving(true);
    const updatePayload: any = {
      business_name: businessName.trim(),
      owner_name: ownerName.trim(),
      whatsapp_number: whatsappNumber.trim(),
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
    };

    let { error } = await supabase
      .from('sellers')
      .update(updatePayload)
      .eq('seller_id', sellerProfile.seller_id);

    // If logo_url/banner_url columns haven't been added yet in DB, notify user and save text fields
    if (error && (error.message?.includes('logo_url') || error.message?.includes('banner_url') || error.code === '42703' || error.code === 'PGRST204')) {
      delete updatePayload.logo_url;
      delete updatePayload.banner_url;
      const fallback = await supabase
        .from('sellers')
        .update(updatePayload)
        .eq('seller_id', sellerProfile.seller_id);
      
      setSaving(false);
      if (!fallback.error) {
        await refreshProfile();
        showToast('error', 'Text saved! To save images, run SQL in Supabase: ALTER TABLE public.sellers ADD COLUMN logo_url text, ADD COLUMN banner_url text;');
      } else {
        showToast('error', fallback.error.message);
      }
      return;
    }

    setSaving(false);

    if (error) {
      showToast('error', 'Failed to update profile: ' + error.message);
    } else {
      await refreshProfile();
      showToast('success', 'Store profile and images updated successfully!');
    }
  };

  if (!sellerProfile) return null;

  const statusColors: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending_verification: 'bg-amber-100 text-amber-700 border-amber-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
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
        <h1 className="text-xl font-bold text-neutral-900">Store Profile</h1>
        <p className="text-xs text-neutral-500 mt-1">Manage your storefront branding and business information</p>
      </div>

      {/* Store Branding Section (Banner & Logo) */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Storefront Branding</h3>
            <p className="text-xs text-neutral-500">Customise how your store appears to buyers</p>
          </div>
        </div>

        {/* Banner Cover Box */}
        <div className="relative bg-neutral-100 h-36 sm:h-48 w-full overflow-hidden group">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt="Store Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-emerald-800 to-teal-900 opacity-80 flex flex-col items-center justify-center text-white/80 p-4">
              <ImageIcon className="w-8 h-8 mb-1 opacity-70" />
              <p className="text-xs font-medium">No cover banner set</p>
              <p className="text-[10px] text-white/60">Recommended: 1200 x 400 px</p>
            </div>
          )}

          {/* Banner Upload / Change overlay button */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadImage(file, 'banner');
              }}
            />
            <button
              type="button"
              disabled={uploadingBanner}
              onClick={() => bannerInputRef.current?.click()}
              className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              {uploadingBanner ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <span>{bannerUrl ? 'Change Banner' : 'Upload Banner'}</span>
            </button>
            {bannerUrl && (
              <button
                type="button"
                onClick={() => setBannerUrl('')}
                className="p-1.5 bg-red-600/80 hover:bg-red-700 text-white rounded-lg text-xs backdrop-blur-xs transition-colors shadow-md cursor-pointer"
                title="Remove Banner"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Logo / Avatar (Absolute overlapping bottom-left) */}
          <div className="absolute -bottom-1 left-5 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden group/logo flex items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Store Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-emerald-50 text-emerald-800 font-extrabold text-2xl flex items-center justify-center">
                {businessName ? businessName.charAt(0).toUpperCase() : 'S'}
              </div>
            )}

            {/* Logo Upload Hover Overlay */}
            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadImage(file, 'logo');
              }}
            />
            <button
              type="button"
              disabled={uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
            >
              {uploadingLogo ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Edit Logo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Logo action bar under banner */}
        <div className="pt-8 pb-4 px-5 flex items-center justify-between">
          <div className="pl-1">
            <p className="text-xs font-bold text-neutral-800">Store Logo</p>
            <p className="text-[11px] text-neutral-500">Square 1:1 image (e.g. 300x300 px)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Remove Logo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
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
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
