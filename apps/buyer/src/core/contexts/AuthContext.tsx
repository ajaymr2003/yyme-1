import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getShadowCredentials(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  return {
    email: `${cleanPhone}@buyer.yymee.com`,
    password: `TempPass_${cleanPhone}_yymee`,
  };
}

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
      if (session?.user) {
        fetchBuyerProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchBuyerProfile(session.user.id);
      } else {
        setBuyerProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchBuyerProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('buyers')
        .select('buyer_id, user_id, full_name, default_address_id')
        .eq('user_id', userId)
        .maybeSingle();
      setBuyerProfile(data);
    } catch (e) {
      console.warn('Error fetching buyer profile:', e);
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithPhone(name: string, email: string, phone: string) {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const { email: shadowEmail, password: shadowPassword } = getShadowCredentials(cleanPhone);
    const finalEmail = email.trim() || shadowEmail;

    // 1. Sign up Supabase Auth user
    let authUserId = '';
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: shadowEmail,
      password: shadowPassword,
    });

    if (authError && authError.message?.toLowerCase().includes('already registered')) {
      const signInRes = await supabase.auth.signInWithPassword({
        email: shadowEmail,
        password: shadowPassword,
      });
      if (signInRes.error) throw authError;
      authUserId = signInRes.data.user?.id || '';
    } else if (authError) {
      throw authError;
    } else {
      authUserId = authData.user?.id || '';
    }

    if (!authUserId) {
      throw new Error('Could not authenticate new user.');
    }

    // 2. Sign in to set session
    await supabase.auth.signInWithPassword({
      email: shadowEmail,
      password: shadowPassword,
    });

    // 3. Upsert user in public.users
    await supabase.from('users').upsert({
      user_id: authUserId,
      phone_number: `+91${cleanPhone}`,
      email: finalEmail,
      user_type: 'buyer',
      is_active: true,
      last_login_at: new Date().toISOString(),
    });

    // 4. Upsert buyer in public.buyers
    await supabase.from('buyers').upsert({
      user_id: authUserId,
      full_name: name.trim(),
    });

    await fetchBuyerProfile(authUserId);
  }

  async function confirmOtp(phone: string, otp: string) {
    await loginWithPhone(phone, otp);
  }

  async function loginWithPhone(phone: string, otp: string) {
    if (otp !== '123456') {
      throw new Error('Invalid OTP code. Please enter 123456.');
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const { email, password } = getShadowCredentials(cleanPhone);

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let user = data?.user;

    if (error) {
      // Auto-create in Auth if record exists in users
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw error;
      user = signUpData.user;
    }

    if (user) {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', user.id);
      await fetchBuyerProfile(user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setBuyerProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        buyerProfile,
        loading,
        loginWithPhone,
        signUpWithPhone,
        confirmOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
