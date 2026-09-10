import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../contexts/SellerAuthContext';
import { getCached, setCache, invalidateCachePrefix, CACHE_TTL } from '../cache';

interface UseSupabaseQueryOptions {
  cacheKey?: string;
  ttl?: number;
  enabled?: boolean;
}

export function useSupabaseQuery<T>(
  queryFn: (client: typeof supabase) => Promise<{ data: T | null; error: any }>,
  deps: unknown[],
  options: UseSupabaseQueryOptions = {},
) {
  const { cacheKey, ttl = CACHE_TTL.MINUTE_5, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }

    const cached = cacheKey ? getCached<T>(cacheKey, ttl) : null;
    if (cached !== null) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: result, error: err } = await queryFn(supabase);

    if (err) {
      setError(err.message || 'Failed to fetch data');
    } else {
      setData(result);
      if (cacheKey) setCache(cacheKey, result);
    }
    setLoading(false);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute();
  }, [execute]);

  const refetch = useCallback(() => {
    if (cacheKey) invalidateCachePrefix(cacheKey);
    execute();
  }, [cacheKey, execute]);

  return { data, loading, error, refetch };
}
