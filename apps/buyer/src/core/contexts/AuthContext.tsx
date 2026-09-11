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

interface BuyerProfile {
  buyer_id: string;
  user_id: string;
  full_name: string;
  default_address_id?: string | null;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  buyerProfile: BuyerProfile | null;
  loading: boolean;
  verifyOtp: (phone: string, otp: string) => Promise<{ isNewUser: boolean }>;
  completeRegistration: (phone: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved bypass session first
    const savedBypass = localStorage.getItem('yyme_buyer_bypass_session');
    if (savedBypass) {
      try {
        const parsed = JSON.parse(savedBypass);
        if (!parsed.user?.id || !UUID_REGEX.test(parsed.user.id)) {
          const validId = generateUUIDFromPhone(parsed.user?.phone || parsed.user?.id || '9999999999');
          parsed.user.id = validId;
          if (parsed.session?.user) parsed.session.user.id = validId;
          localStorage.setItem('yyme_buyer_bypass_session', JSON.stringify(parsed));
        }
        setSession(parsed.session);
        setUser(parsed.user);
        fetchBuyerProfile(parsed.user.id);
        return;
      } catch {}
    }

    // Check Supabase session as fallback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchBuyerProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchBuyerProfile(session.user.id);
      } else {
        const saved = localStorage.getItem('yyme_buyer_bypass_session');
        if (!saved) {
          setSession(null);
          setUser(null);
          setBuyerProfile(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchBuyerProfile(userId: string) {
    if (!userId || !UUID_REGEX.test(userId)) {
      userId = generateUUIDFromPhone(userId || '9999999999');
    }
    try {
      const { data } = await supabase
        .from('buyers')
        .select('buyer_id, user_id, full_name')
        .eq('user_id', userId)
        .maybeSingle();
      setBuyerProfile(data);
    } catch (e) {
      console.warn('Error fetching buyer profile:', e);
    } finally {
      setLoading(false);
    }
  }

  function createMockSession(phone: string, userId: string) {
    const formattedPhone = `+91${phone.replace(/\D/g, '').slice(-10)}`;
    const email = `${phone.replace(/\D/g, '').slice(-10)}@ymenet.com`;

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
    return { mockUser, mockSession };
  }

  async function verifyOtp(phone: string, otp: string): Promise<{ isNewUser: boolean }> {
    if (otp !== '123456') {
      throw new Error('Invalid OTP code. Please enter 123456.');
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = `+91${cleanPhone}`;
    const email = `${cleanPhone}@ymenet.com`;

    // 1. Check if user exists in DB
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .or(`phone_number.eq.${formattedPhone},phone_number.eq.${cleanPhone}`)
      .maybeSingle();

    let existingProfile: BuyerProfile | null = null;
    if (existingUser?.user_id) {
      const { data: b } = await supabase
        .from('buyers')
        .select('buyer_id, user_id, full_name')
        .eq('user_id', existingUser.user_id)
        .maybeSingle();
      existingProfile = b;
    }

    // 2. If buyer profile exists, log in directly
    if (existingProfile) {
      const userId = existingProfile.user_id || generateUUIDFromPhone(cleanPhone);
      const { mockUser, mockSession } = createMockSession(cleanPhone, userId);

      setSession(mockSession);
      setUser(mockUser);
      setBuyerProfile(existingProfile);
      localStorage.setItem('yyme_buyer_bypass_session', JSON.stringify({ user: mockUser, session: mockSession }));

      // Update last login
      await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('user_id', userId);

      return { isNewUser: false };
    }

    // 3. New user — need name
    return { isNewUser: true };
  }

  async function completeRegistration(phone: string, name: string) {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = `+91${cleanPhone}`;
    const email = `${cleanPhone}@ymenet.com`;
    const userId = generateUUIDFromPhone(cleanPhone);

    // 1. Upsert public.users
    const { error: userErr } = await supabase.from('users').upsert({
      user_id: userId,
      phone_number: formattedPhone,
      email,
      user_type: 'buyer',
      is_active: true,
      last_login_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (userErr) {
      console.error('Failed to create user record:', userErr);
      throw new Error(userErr.message || 'Failed to create user account');
    }

    // 2. Upsert public.buyers
    const { error: buyerErr } = await supabase.from('buyers').upsert({
      user_id: userId,
      full_name: name.trim(),
    }, { onConflict: 'user_id' });

    if (buyerErr) {
      console.error('Failed to create buyer profile:', buyerErr);
      if (buyerErr.code === '42501') {
        throw new Error('Database permission error (RLS): Run supabase/FIX_BUYERS_TABLE.sql in your Supabase SQL Editor to allow writing to the buyers table.');
      }
      throw new Error(buyerErr.message || 'Failed to save buyer profile');
    }

    // 3. Create mock session
    const { mockUser, mockSession } = createMockSession(cleanPhone, userId);

    setSession(mockSession);
    setUser(mockUser);
    localStorage.setItem('yyme_buyer_bypass_session', JSON.stringify({ user: mockUser, session: mockSession }));

    // 4. Fetch profile
    await fetchBuyerProfile(userId);
  }

  async function signOut() {
    localStorage.removeItem('yyme_buyer_bypass_session');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setBuyerProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        buyerProfile,
        loading,
        verifyOtp,
        completeRegistration,
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
