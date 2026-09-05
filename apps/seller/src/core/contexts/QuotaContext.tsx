import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSellerAuth, supabase } from './SellerAuthContext';

interface QuotaCtx {
  clicksUsed: number;
  clicksRemaining: number;
  listingsUsed: number;
  listingsRemaining: number;
  tier: string;
  tierExpiresAt: string | null;
  isQuotaExhausted: boolean;
  isListingFull: boolean;
  refresh: () => Promise<void>;
}

const QuotaContext = createContext<QuotaCtx | undefined>(undefined);

export const QuotaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sellerProfile, refreshProfile } = useSellerAuth();
  const [quota, setQuota] = useState({
    clicksUsed: 0, clicksRemaining: 20, listingsUsed: 0, listingsRemaining: 3,
    tier: 'free', tierExpiresAt: null as string | null,
  });

  const refresh = useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (!sellerProfile) return;
    const clicksUsed = sellerProfile.click_quota - sellerProfile.remaining_click_quota;
    setQuota({
      clicksUsed,
      clicksRemaining: sellerProfile.remaining_click_quota,
      listingsUsed: sellerProfile.used_listing_count,
      listingsRemaining: sellerProfile.max_listing_quota - sellerProfile.used_listing_count,
      tier: sellerProfile.subscription_tier,
      tierExpiresAt: sellerProfile.tier_expires_at,
    });
  }, [sellerProfile]);

  return (
    <QuotaContext.Provider value={{
      ...quota,
      isQuotaExhausted: quota.clicksRemaining <= 0,
      isListingFull: quota.listingsRemaining <= 0,
      refresh,
    }}>
      {children}
    </QuotaContext.Provider>
  );
};

export function useQuota() {
  const ctx = useContext(QuotaContext);
  if (!ctx) throw new Error('useQuota must be inside QuotaProvider');
  return ctx;
}
