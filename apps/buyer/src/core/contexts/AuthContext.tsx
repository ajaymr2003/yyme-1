import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface BuyerProfile {
  buyer_id: string;
  user_id: string;
  full_name: string;
  default_address_id: string | null;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  buyerProfile: BuyerProfile | null;
  loading: boolean;
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
  signUpWithPhone: (name: string, email: string, phone: string) => Promise<void>;
  confirmOtp: (phone: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchBuyerProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchBuyerProfile(session.user.id);
      else { setBuyerProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchBuyerProfile(userId: string) {
    const { data } = await supabase.from('buyers').select('buyer_id, user_id, full_name, default_address_id').eq('user_id', userId).maybeSingle();
    setBuyerProfile(data);
    setLoading(false);
  }

  async function signUpWithPhone(name: string, email: string, phone: string) {
    const phoneClean = phone.replace(/\D/g, '').slice(-10);
    const { error } = await supabase.functions.invoke('create-buyer-bypass', {
      body: { phone: phoneClean, name, email },
    });
    if (error) throw error;
    await supabase.auth.signInWithOtp({ phone: `+91${phoneClean}` });
  }

  async function confirmOtp(phone: string, otp: string) {
    const phoneClean = phone.replace(/\D/g, '').slice(-10);
    const { error } = await supabase.auth.verifyOtp({ phone: `+91${phoneClean}`, token: otp, type: 'sms' });
    if (error) throw error;
  }

  async function loginWithPhone(phone: string, otp: string) {
    const phoneClean = phone.replace(/\D/g, '').slice(-10);
    const { error } = await supabase.auth.verifyOtp({ phone: `+91${phoneClean}`, token: otp, type: 'sms' });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setBuyerProfile(null);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, buyerProfile, loading, loginWithPhone, signUpWithPhone, confirmOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
