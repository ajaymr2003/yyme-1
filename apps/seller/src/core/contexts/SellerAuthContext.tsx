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

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('sellers').select('*').eq('user_id', userId).maybeSingle();
    setSellerProfile(data);
    setLoading(false);
  }

  async function signUp(phone: string) {
    const phoneClean = phone.replace(/\D/g, '').slice(-10);
    const { error } = await supabase.functions.invoke('create-seller-bypass', {
      body: { phone: phoneClean },
    });
    if (error) throw error;
    await supabase.auth.signInWithOtp({ phone: `+91${phoneClean}` });
  }

  async function loginWithOtp(phone: string) {
    const phoneClean = phone.replace(/\D/g, '').slice(-10);
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phoneClean}` });
    if (error) throw error;
  }

  async function verifyOtp(phone: string, otp: string) {
    const phoneClean = phone.replace(/\D/g, '').slice(-10);
    const { error } = await supabase.auth.verifyOtp({ phone: `+91${phoneClean}`, token: otp, type: 'sms' });
    if (error) throw error;
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
