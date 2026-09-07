import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function generateUUIDFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  const hex = digits.padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}

export function getSellerShadowCredentials(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  return {
    cleanPhone,
    email: `${cleanPhone}@ymenet.com`,
    password: `TempPass_${cleanPhone}_yymee`,
  };
}

export interface SellerProfile {
  seller_id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  whatsapp_number: string;
  phone_number?: string | null;
  id_proof_type?: string | null;
  id_proof_number?: string | null;
  id_document_url?: string | null;
  account_status: string;
  is_gst_registered: boolean;
  shipping_state?: string | null;
  subscription_tier: string;
  is_disability_exempt: boolean;
  click_quota: number;
  remaining_click_quota: number;
  max_listing_quota: number;
  used_listing_count: number;
  tier_expires_at: string | null;
  rejection_reason: string | null;
}

export interface RegisterSellerInput {
  phone: string;
  businessName: string;
  ownerName: string;
  whatsappNumber: string;
  shippingState?: string;
  idProofType?: string;
  idProofNumber?: string;
  idDocumentUrl?: string;
  isGstRegistered?: boolean;
  verificationType?: 'GST' | 'ENROLLMENT_ID';
  referenceNumber?: string;
  isDisabilityExempt?: boolean;
}

export async function uploadSellerDocument(file: File, phoneClean: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${phoneClean}_${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('seller-documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.warn('Document storage upload note:', uploadError.message);
      return '';
    }

    const { data: publicUrlData } = supabase.storage
      .from('seller-documents')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || '';
  } catch (err) {
    console.warn('uploadSellerDocument error:', err);
    return '';
  }
}

interface SellerAuthCtx {
  session: Session | null;
  user: User | null;
  sellerProfile: SellerProfile | null;
  loading: boolean;
  signUp: (phone: string) => Promise<void>;
  loginWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<{ isNewSeller: boolean }>;
  completeRegistration: (input: RegisterSellerInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SellerAuthContext = createContext<SellerAuthCtx | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        const savedBypass = localStorage.getItem('yyme_seller_bypass_session');
        if (savedBypass) {
          try {
            const parsed = JSON.parse(savedBypass);
            if (!parsed.user?.id || !UUID_REGEX.test(parsed.user.id)) {
              const validId = generateUUIDFromPhone(parsed.user?.phone || parsed.user?.id || '9999999999');
              parsed.user.id = validId;
              if (parsed.session?.user) parsed.session.user.id = validId;
              localStorage.setItem('yyme_seller_bypass_session', JSON.stringify(parsed));
            }
            setSession(parsed.session);
            setUser(parsed.user);
            fetchProfile(parsed.user.id);
            return;
          } catch {}
        }
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        const savedBypass = localStorage.getItem('yyme_seller_bypass_session');
        if (!savedBypass) {
          setSession(null);
          setUser(null);
          setSellerProfile(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    if (!userId || !UUID_REGEX.test(userId)) {
      userId = generateUUIDFromPhone(userId || '9999999999');
    }
    try {
      const { data } = await supabase.from('sellers').select('*').eq('user_id', userId).maybeSingle();
      if (data) {
        setSellerProfile(data);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }

  async function signUp(phone: string) {
    const { cleanPhone } = getSellerShadowCredentials(phone);
    if (cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit phone number.');
    }
  }

  async function loginWithOtp(phone: string) {
    const { cleanPhone } = getSellerShadowCredentials(phone);
    if (cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit phone number.');
    }
  }

  async function verifyOtp(phone: string, otp: string): Promise<{ isNewSeller: boolean }> {
    if (otp.trim() !== '123456') {
      throw new Error('Invalid OTP code. Please enter 123456');
    }

    const { cleanPhone, email, password } = getSellerShadowCredentials(phone);
    const formattedPhone = `+91${cleanPhone}`;

    // 1. Check if user already exists in DB
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .or(`phone_number.eq.${formattedPhone},phone_number.eq.${cleanPhone}`)
      .maybeSingle();

    let existingSeller: SellerProfile | null = null;
    if (existingUser?.user_id) {
      const { data: s } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', existingUser.user_id)
        .maybeSingle();
      existingSeller = s;
    }

    // If no existing seller record, signal that the seller must complete registration
    if (!existingSeller) {
      return { isNewSeller: true };
    }

    const userId = existingSeller.user_id || generateUUIDFromPhone(cleanPhone);

    const mockUser: User = {
      id: userId,
      app_metadata: {},
      user_metadata: { phone: formattedPhone },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email,
      phone: formattedPhone,
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };
    const mockSession: Session = {
      access_token: 'bypass-token',
      refresh_token: 'bypass-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    };
    setSession(mockSession);
    setUser(mockUser);
    setSellerProfile(existingSeller);
    localStorage.setItem('yyme_seller_bypass_session', JSON.stringify({ user: mockUser, session: mockSession }));

    return { isNewSeller: false };
  }

  async function completeRegistration(input: RegisterSellerInput) {
    const { cleanPhone, email } = getSellerShadowCredentials(input.phone);
    const formattedPhone = `+91${cleanPhone}`;
    const userId = generateUUIDFromPhone(cleanPhone);

    // 1. Upsert public.users
    const { error: userErr } = await supabase.from('users').upsert([{
      user_id: userId,
      phone_number: formattedPhone,
      email,
      user_type: 'seller',
      is_active: true,
      last_login_at: new Date().toISOString(),
    }], { onConflict: 'user_id' });

    if (userErr) {
      console.error('public.users upsert error:', userErr);
      if (userErr.code === '42501') {
        throw new Error("Database permission error (RLS): Run supabase/FIX_RLS_POLICIES.sql in your Supabase SQL Editor to allow writing to the database.");
      }
      throw new Error(userErr.message);
    }

    // 2. Insert/Upsert public.sellers with registered details
    let createdSeller: SellerProfile | null = null;
    const sellerPayload: any = {
      user_id: userId,
      business_name: input.businessName.trim(),
      owner_name: input.ownerName.trim(),
      whatsapp_number: input.whatsappNumber.trim() || cleanPhone,
      phone_number: formattedPhone,
      account_status: 'pending_verification',
      is_gst_registered: false,
      subscription_tier: 'free',
      is_disability_exempt: false,
      click_quota: 20,
      remaining_click_quota: 20,
      max_listing_quota: 3,
      used_listing_count: 0,
    };

    let { data: newSeller, error: sellerErr } = await supabase
      .from('sellers')
      .upsert([sellerPayload], { onConflict: 'user_id' })
      .select('*')
      .single();

    // If shipping_state is still required by legacy NOT NULL constraint before drop
    if (sellerErr && (sellerErr.message?.includes('shipping_state') || sellerErr.code === '23502')) {
      sellerPayload.shipping_state = 'Not Specified';
      const retryState = await supabase
        .from('sellers')
        .upsert([sellerPayload], { onConflict: 'user_id' })
        .select('*')
        .single();
      newSeller = retryState.data;
      sellerErr = retryState.error;
    }

    // If phone_number column hasn't been added yet, retry without it
    if (sellerErr && (sellerErr.message?.includes('phone_number') || sellerErr.code === 'PGRST204')) {
      delete sellerPayload.phone_number;
      delete sellerPayload.shipping_state;
      const retry = await supabase
        .from('sellers')
        .upsert([sellerPayload], { onConflict: 'user_id' })
        .select('*')
        .single();
      newSeller = retry.data;
      sellerErr = retry.error;
    }

    if (sellerErr) {
      console.error('public.sellers upsert error:', sellerErr);
      if (sellerErr.code === '42501') {
        throw new Error("Database permission error (RLS): Run supabase/FIX_RLS_POLICIES.sql in your Supabase SQL Editor to allow writing to the database.");
      }
      throw new Error(sellerErr.message);
    }

    createdSeller = newSeller;

    // 3. Insert verification record for admin review queue
    if (createdSeller?.seller_id) {
      const { error: verifErr } = await supabase.from('seller_verifications').insert([{
        seller_id: createdSeller.seller_id,
        verification_type: input.idProofType || 'AADHAAR',
        reference_number: input.idProofNumber?.trim() || 'N/A',
        document_url: input.idDocumentUrl || null,
        status: 'pending',
      }]);
      if (verifErr) console.warn('verification insert note:', verifErr);
    }

    // 4. Update session & profile state
    const finalProfile: SellerProfile = createdSeller || {
      seller_id: userId,
      user_id: userId,
      business_name: input.businessName.trim(),
      owner_name: input.ownerName.trim(),
      whatsapp_number: input.whatsappNumber.trim() || cleanPhone,
      phone_number: formattedPhone,
      id_proof_type: input.idProofType || null,
      id_proof_number: input.idProofNumber?.trim() || null,
      id_document_url: input.idDocumentUrl || null,
      account_status: 'pending_verification',
      is_gst_registered: input.isGstRegistered ?? false,
      shipping_state: input.shippingState || null,
      subscription_tier: 'free',
      is_disability_exempt: input.isDisabilityExempt ?? false,
      click_quota: 20,
      remaining_click_quota: 20,
      max_listing_quota: 3,
      used_listing_count: 0,
      tier_expires_at: null,
      rejection_reason: null,
    };

    setSellerProfile(finalProfile);

    const mockUser: User = {
      id: userId,
      app_metadata: {},
      user_metadata: { phone: formattedPhone },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email,
      phone: formattedPhone,
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };
    const mockSession: Session = {
      access_token: 'bypass-token',
      refresh_token: 'bypass-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    };
    setSession(mockSession);
    setUser(mockUser);
    localStorage.setItem('yyme_seller_bypass_session', JSON.stringify({ user: mockUser, session: mockSession }));
  }

  async function signOut() {
    localStorage.removeItem('yyme_seller_bypass_session');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setSellerProfile(null);
  }

  async function refreshProfile() {
    if (!user) return;
    await fetchProfile(user.id);
  }

  return (
    <SellerAuthContext.Provider value={{ session, user, sellerProfile, loading, signUp, loginWithOtp, verifyOtp, completeRegistration, signOut, refreshProfile }}>
      {children}
    </SellerAuthContext.Provider>
  );
};

export function useSellerAuth() {
  const ctx = useContext(SellerAuthContext);
  if (!ctx) throw new Error('useSellerAuth must be inside AuthProvider');
  return ctx;
}
