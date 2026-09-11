import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://mbtrmxnrxvvifeyvaqeb.supabase.co') as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idHJteG5yeHZ2aWZleXZhcWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDQ3ODQsImV4cCI6MjEwNDE4MDc4NH0.VxNtqjQ3up_fsAoR-uJkWAx3MaPdsEmIoduI56clYqc') as string;
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
  userId?: string;
  buyerId?: string;
}

export interface TransitionResult {
  action: 'dashboard' | 'signup';
  params?: {
    phone?: string;
    name?: string;
    userId?: string;
    buyerId?: string;
  };
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
  checkSellerExists: (phone: string) => Promise<SellerProfile | null>;
  signUp: (phone: string) => Promise<void>;
  loginWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<{ isNewSeller: boolean }>;
  completeRegistration: (input: RegisterSellerInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkAndHandleBuyerTransition: (buyerId: string, paramUserId?: string) => Promise<TransitionResult>;
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

  async function checkSellerExists(phone: string): Promise<SellerProfile | null> {
    const { cleanPhone } = getSellerShadowCredentials(phone);
    const formattedPhone = `+91${cleanPhone}`;

    // 1. Check in sellers directly
    try {
      const { data: sellerDirect } = await supabase
        .from('sellers')
        .select('*')
        .or(`phone_number.eq.${formattedPhone},phone_number.eq.${cleanPhone},whatsapp_number.eq.${cleanPhone},whatsapp_number.eq.${formattedPhone}`)
        .maybeSingle();

      if (sellerDirect) return sellerDirect;
    } catch (e) {
      console.warn('Direct seller lookup note:', e);
    }

    // 2. Check via users table
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .or(`phone_number.eq.${formattedPhone},phone_number.eq.${cleanPhone}`)
        .maybeSingle();

      if (existingUser?.user_id) {
        const { data: sellerViaUser } = await supabase
          .from('sellers')
          .select('*')
          .eq('user_id', existingUser.user_id)
          .maybeSingle();
        if (sellerViaUser) return sellerViaUser;
      }
    } catch (e) {
      console.warn('User-linked seller lookup note:', e);
    }

    return null;
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

    const seller = await checkSellerExists(phone);
    if (!seller) {
      throw new Error('No seller account found with this phone number. Please check your number or create a new account.');
    }
  }

  async function verifyOtp(phone: string, otp: string): Promise<{ isNewSeller: boolean }> {
    if (otp.trim() !== '123456') {
      throw new Error('Invalid OTP code. Please enter 123456');
    }

    const { cleanPhone, email, password } = getSellerShadowCredentials(phone);
    const formattedPhone = `+91${cleanPhone}`;

    const existingSeller = await checkSellerExists(phone);

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

  function activateSellerSession(userRecord: any, sellerRecord: SellerProfile, userId: string) {
    const rawPhone = userRecord?.phone_number || sellerRecord?.phone_number || sellerRecord?.whatsapp_number || '9999999999';
    const { cleanPhone, email } = getSellerShadowCredentials(rawPhone);
    const formattedPhone = `+91${cleanPhone}`;

    const mockUser: User = {
      id: userId,
      app_metadata: {},
      user_metadata: { phone: formattedPhone },
      aud: 'authenticated',
      created_at: userRecord?.created_at || new Date().toISOString(),
      email: userRecord?.email || email,
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
    setSellerProfile(sellerRecord);
    localStorage.setItem('yyme_seller_bypass_session', JSON.stringify({ user: mockUser, session: mockSession }));
  }

  async function checkAndHandleBuyerTransition(buyerId: string, paramUserId?: string): Promise<TransitionResult> {
    console.log('[SellerAuth] 🔍 Initiating checkAndHandleBuyerTransition:', { buyerId, paramUserId });
    try {
      // 1. Fetch buyer record from public.buyers if buyerId provided
      let buyerRecord: { buyer_id: string; user_id: string; full_name?: string } | null = null;
      if (buyerId) {
        const { data: b } = await supabase
          .from('buyers')
          .select('buyer_id, user_id, full_name')
          .eq('buyer_id', buyerId)
          .maybeSingle();
        buyerRecord = b;
        console.log('[SellerAuth] 📦 Fetched buyer profile from DB:', buyerRecord);
      }

      const resolvedUserId = buyerRecord?.user_id || paramUserId;
      console.log('[SellerAuth] 🔑 Resolved userId for buyer transition:', resolvedUserId);
      if (!resolvedUserId) {
        console.warn('[SellerAuth] ⚠️ No resolved userId found, redirecting to signup');
        return { action: 'signup', params: { buyerId } };
      }

      // 2. Fetch user and seller info from DB
      let userRecord: any = null;
      try {
        const { data: u } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', resolvedUserId)
          .maybeSingle();
        userRecord = u;
        console.log('[SellerAuth] 👤 Fetched user record from public.users:', userRecord);
      } catch (e) {
        console.warn('[SellerAuth] users lookup note:', e);
      }

      let sellerRecord: SellerProfile | null = null;
      try {
        const { data: s } = await supabase
          .from('sellers')
          .select('*')
          .eq('user_id', resolvedUserId)
          .maybeSingle();
        sellerRecord = s;
        console.log('[SellerAuth] 🏪 Fetched seller record from public.sellers:', sellerRecord);
      } catch (e) {
        console.warn('[SellerAuth] sellers lookup note:', e);
      }

      // Check current live session in local state/storage
      const savedBypass = localStorage.getItem('yyme_seller_bypass_session');
      let currentActiveUserId = session?.user?.id;
      if (!currentActiveUserId && savedBypass) {
        try {
          const parsed = JSON.parse(savedBypass);
          currentActiveUserId = parsed?.user?.id;
        } catch {}
      }
      console.log('[SellerAuth] 🔐 Session comparison check:', {
        currentActiveUserId,
        resolvedUserId,
        isSameUser: currentActiveUserId === resolvedUserId,
        hasSellerRecord: Boolean(sellerRecord),
      });

      // Condition 1: Check if there is already an active session for this same buyer/user
      // If yes, user has a seller account and live session -> directly land to dashboard
      if (currentActiveUserId === resolvedUserId && sellerRecord) {
        console.log('[SellerAuth] ✅ CONDITION 1 MATCHED: Active seller session already exists for this buyer. Direct landing on dashboard!');
        activateSellerSession(userRecord, sellerRecord, resolvedUserId);
        return { action: 'dashboard' };
      }

      // Condition 2: No active session (or logged into different account):
      // Check whether user is_both in DB. If both -> directly land to dashboard, NO OTP validation!
      const isBoth = Boolean(userRecord?.is_both) || (Boolean(sellerRecord) && Boolean(buyerRecord));
      console.log('[SellerAuth] ⚖️ Checking is_both in database:', {
        is_both_column: userRecord?.is_both,
        has_seller_and_buyer: Boolean(sellerRecord) && Boolean(buyerRecord),
        evaluated_isBoth: isBoth,
      });

      if (isBoth && sellerRecord) {
        console.log('[SellerAuth] ✅ CONDITION 2 MATCHED: User is marked as "both" with seller profile in DB. Auto-login WITHOUT OTP -> Direct landing on dashboard!');
        if (!userRecord?.is_both) {
          try {
            await supabase.from('users').update({ is_both: true }).eq('user_id', resolvedUserId);
            console.log('[SellerAuth] Synchronized is_both=true to public.users');
          } catch {}
        }
        activateSellerSession(userRecord, sellerRecord, resolvedUserId);
        return { action: 'dashboard' };
      }

      // Condition 3: is_both is false (or seller record does not exist yet)
      // Must face registration: mobile number, otp, register form. is_both: true on complete
      console.log('[SellerAuth] 📝 CONDITION 3 MATCHED: is_both is false (or no seller record exists). Routing to registration steps...');
      const phoneClean = (userRecord?.phone_number || '').replace(/\D/g, '').slice(-10);
      const signupParams = {
        phone: phoneClean,
        name: buyerRecord?.full_name || '',
        userId: resolvedUserId,
        buyerId: buyerId || buyerRecord?.buyer_id || '',
      };
      console.log('[SellerAuth] Forwarding to signup with prefilled params:', signupParams);
      return {
        action: 'signup',
        params: signupParams,
      };
    } catch (err) {
      console.error('[SellerAuth] ❌ checkAndHandleBuyerTransition error:', err);
      return { action: 'signup', params: { buyerId } };
    }
  }

  async function completeRegistration(input: RegisterSellerInput) {
    console.log('[SellerAuth] 🚀 Starting completeRegistration:', input);
    const { cleanPhone, email } = getSellerShadowCredentials(input.phone);
    const formattedPhone = `+91${cleanPhone}`;

    let userId: string = input.userId && UUID_REGEX.test(input.userId) ? input.userId : '';
    if (!userId) {
      // Check if user already exists with this phone in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .or(`phone_number.eq.${formattedPhone},phone_number.eq.${cleanPhone}`)
        .maybeSingle();
      if (existingUser?.user_id) {
        userId = existingUser.user_id;
        console.log('[SellerAuth] Found existing user_id for phone:', userId);
      } else {
        userId = generateUUIDFromPhone(cleanPhone);
        console.log('[SellerAuth] Generated new UUID for phone:', userId);
      }
    } else {
      console.log('[SellerAuth] Reusing existing linked buyer user_id:', userId);
    }

    // 1. Upsert public.users with is_both: true
    const userPayload: any = {
      user_id: userId,
      phone_number: formattedPhone,
      email,
      user_type: 'both',
      is_both: true,
      is_active: true,
      last_login_at: new Date().toISOString(),
    };

    console.log('[SellerAuth] Upserting public.users with is_both=true:', userPayload);
    let { error: userErr } = await supabase.from('users').upsert([userPayload], { onConflict: 'user_id' });

    if (userErr && (userErr.message?.includes('is_both') || userErr.code === 'PGRST204')) {
      console.warn('[SellerAuth] is_both column not found in public.users, retrying without it');
      delete userPayload.is_both;
      userPayload.user_type = 'seller';
      const fallback = await supabase.from('users').upsert([userPayload], { onConflict: 'user_id' });
      userErr = fallback.error;
    }

    if (userErr) {
      console.error('[SellerAuth] ❌ public.users upsert error:', userErr);
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
      account_status: 'approved',
      is_gst_registered: false,
      subscription_tier: 'free',
      is_disability_exempt: false,
      click_quota: 20,
      remaining_click_quota: 20,
      max_listing_quota: 3,
      used_listing_count: 0,
    };

    console.log('[SellerAuth] Upserting public.sellers:', sellerPayload);

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
      account_status: 'approved',
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
    <SellerAuthContext.Provider value={{ session, user, sellerProfile, loading, checkSellerExists, signUp, loginWithOtp, verifyOtp, completeRegistration, signOut, refreshProfile, checkAndHandleBuyerTransition }}>
      {children}
    </SellerAuthContext.Provider>
  );
};

export function useSellerAuth() {
  const ctx = useContext(SellerAuthContext);
  if (!ctx) throw new Error('useSellerAuth must be inside AuthProvider');
  return ctx;
}
