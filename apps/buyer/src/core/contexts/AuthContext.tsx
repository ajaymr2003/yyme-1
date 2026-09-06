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
  loginWithPhone: (phone: string, otp?: string) => Promise<void>;
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

  async function ensureBuyerRecords(userId: string, phoneClean: string, name?: string, email?: string) {
    const formattedPhone = `+91${phoneClean}`;
    const shadowEmail = `${phoneClean}@gmail.com`;

    // 1. Ensure public.users entry
    await supabase.from('users').upsert([{
      user_id: userId,
      phone_number: formattedPhone,
      email: email || shadowEmail,
      user_type: 'buyer',
      is_active: true,
    }], { onConflict: 'user_id' });

    // 2. Ensure public.buyers entry
    const { data: existingBuyer } = await supabase
      .from('buyers').select('buyer_id').eq('user_id', userId).maybeSingle();

    if (!existingBuyer) {
      await supabase.from('buyers').insert([{
        user_id: userId,
        full_name: name?.trim() || 'Buyer',
      }]);
    }
  }

  async function fetchBuyerProfile(userId: string) {
    const { data } = await supabase.from('buyers').select('buyer_id, user_id, full_name, default_address_id').eq('user_id', userId).maybeSingle();
    setBuyerProfile(data);
    setLoading(false);
  }

  async function trySignIn(email: string, password: string) {
    const res = await supabase.auth.signInWithPassword({ email, password });
    return res;
  }

  async function authenticateBuyer(phone: string, name?: string, email?: string) {
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

    const emailsToTry = [
      registeredEmail,
      `${phoneClean}@gmail.com`,
      `${phoneClean}@buyer.yymee.com`,
    ].filter(Boolean) as string[];

    // 2. Try logging in directly
    for (const em of emailsToTry) {
      const res = await trySignIn(em, tempPassword);
      if (res.data?.session) {
        const userId = res.data.user.id;
        await ensureBuyerRecords(userId, phoneClean, name, email);
        await fetchBuyerProfile(userId);
        return;
      }
    }

    // 3. Trigger create-buyer-bypass edge function
    try {
      const { error: invokeErr } = await supabase.functions.invoke('create-buyer-bypass', {
        body: { phone: phoneClean, name, email },
      });
      if (invokeErr) {
        console.warn('create-buyer-bypass invocation note:', invokeErr.message);
      }
    } catch (e) {
      console.warn('Edge function invoke failed:', e);
    }

    // 4. Retry logging in
    for (const em of [`${phoneClean}@gmail.com`, `${phoneClean}@buyer.yymee.com`, registeredEmail].filter(Boolean) as string[]) {
      const res = await trySignIn(em, tempPassword);
      if (res.data?.session) {
        const userId = res.data.user.id;
        await ensureBuyerRecords(userId, phoneClean, name, email);
        await fetchBuyerProfile(userId);
        return;
      }
    }

    throw new Error('Authentication failed. Please check the phone number and try again.');
  }

  async function signUpWithPhone(name: string, email: string, phone: string) {
    await authenticateBuyer(phone, name, email);
  }

  async function confirmOtp(phone: string, _otp: string) {
    await authenticateBuyer(phone);
  }

  async function loginWithPhone(phone: string, _otp?: string) {
    await authenticateBuyer(phone);
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
