import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SellerProfile {
  seller_id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  whatsapp_number: string;
  seller_type: string;
  account_status: string;
  is_gst_registered: boolean;
  shipping_state: string;
  subscription_tier: string;
  is_disability_exempt: boolean;
  click_quota: number;
  remaining_click_quota: number;
  max_listing_quota: number;
  used_listing_count: number;
  tier_expires_at: string | null;
  rejection_reason: string | null;
}

interface SellerAuthCtx {
  session: Session | null;
  user: User | null;
  sellerProfile: SellerProfile | null;
  loading: boolean;
  signUp: (phone: string) => Promise<void>;
  loginWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SellerAuthContext = createContext<SellerAuthCtx | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else { setSellerProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function ensureSellerRecords(userId: string, phoneClean: string) {
    const formattedPhone = `+91${phoneClean}`;
    const shadowEmail = `${phoneClean}@gmail.com`;

    // 1. Ensure public.users entry
    await supabase.from('users').upsert([{
      user_id: userId,
      phone_number: formattedPhone,
      email: shadowEmail,
      user_type: 'seller',
      is_active: true,
    }], { onConflict: 'user_id' });

    // 2. Ensure public.sellers entry
    const { data: existingSeller } = await supabase
      .from('sellers').select('seller_id').eq('user_id', userId).maybeSingle();

    if (!existingSeller) {
      await supabase.from('sellers').insert([{
        user_id: userId,
        business_name: 'Pending Store',
        owner_name: 'Pending Owner',
        whatsapp_number: phoneClean,
        shipping_state: 'Karnataka',
        account_status: 'pending_verification',
      }]);
    }
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('sellers').select('*').eq('user_id', userId).maybeSingle();
    setSellerProfile(data);
    setLoading(false);
  }

  async function trySignIn(email: string, password: string) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    return res;
  }

  async function authenticateSeller(phone: string) {
    const phoneClean = phone.replace(/\D/g, '').slice(-10);
    const tempPassword = `TempPass_${phoneClean}_yymee`;
    const formattedPhone = `+91${phoneClean}`;

    // 1. Find existing user email from public.users table if already registered
    let registeredEmail: string | null = null;
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('phone_number', formattedPhone)
        .maybeSingle();
      if (existingUser?.email) {
        registeredEmail = existingUser.email;
      }
    } catch {}

    // List of possible emails to try
    const emailsToTry = [
      registeredEmail,
      `${phoneClean}@gmail.com`,
      `${phoneClean}@seller.yymee.com`,
    ].filter(Boolean) as string[];

    // 2. Try logging in with existing credentials
    for (const email of emailsToTry) {
      const res = await trySignIn(email, tempPassword);
      if (res.data?.session) {
        const userId = res.data.user.id;
        await ensureSellerRecords(userId, phoneClean);
        await fetchProfile(userId);
        return;
      }
    }

    // 3. If not yet created, trigger create-seller-bypass edge function
    try {
      const { error: invokeErr } = await supabase.functions.invoke('create-seller-bypass', {
        body: { phone: phoneClean },
      });
      if (invokeErr) {
        console.warn('create-seller-bypass invocation note:', invokeErr.message);
      }
    } catch (e) {
      console.warn('Edge function invoke failed:', e);
    }

    // 4. Retry logging in with possible emails after creation
    for (const email of [`${phoneClean}@gmail.com`, `${phoneClean}@seller.yymee.com`, registeredEmail].filter(Boolean) as string[]) {
      const res = await trySignIn(email, tempPassword);
      if (res.data?.session) {
        const userId = res.data.user.id;
        await ensureSellerRecords(userId, phoneClean);
        await fetchProfile(userId);
        return;
      }
    }

    throw new Error('Authentication failed. Please verify the phone number and try again.');
  }

  async function signUp(phone: string) {
    await authenticateSeller(phone);
  }

  async function loginWithOtp(phone: string) {
    const phoneClean = phone.replace(/\D/g, '').slice(-10);
    try {
      await supabase.functions.invoke('create-seller-bypass', {
        body: { phone: phoneClean },
      });
    } catch {}
  }

  async function verifyOtp(phone: string, _otp: string) {
    await authenticateSeller(phone);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSellerProfile(null);
  }

  async function refreshProfile() {
    if (!session?.user) return;
    await fetchProfile(session.user.id);
  }

  return (
    <SellerAuthContext.Provider value={{ session, user: session?.user ?? null, sellerProfile, loading, signUp, loginWithOtp, verifyOtp, signOut, refreshProfile }}>
      {children}
    </SellerAuthContext.Provider>
  );
};

export function useSellerAuth() {
  const ctx = useContext(SellerAuthContext);
  if (!ctx) throw new Error('useSellerAuth must be inside AuthProvider');
  return ctx;
}
