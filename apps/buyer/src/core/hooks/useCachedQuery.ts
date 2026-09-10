import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService, CACHE_TTL } from '../services/cacheService';

interface UseCachedQueryOptions<T> {
  ttl?: number;
  swr?: boolean;
  enabled?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
}

export function useCachedQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options?: UseCachedQueryOptions<T>
) {
  const enabled = options?.enabled ?? true;
  const ttl = options?.ttl ?? CACHE_TTL.SHORT;
  const swr = options?.swr ?? true;

  // Initialize data synchronously from cache if present (eliminates spinner flash!)
  const initialCache = key ? cacheService.get<T>(key, swr) : null;
  const [data, setData] = useState<T | null>(initialCache ? initialCache.data : (options?.initialData ?? null));
  const [loading, setLoading] = useState<boolean>(!initialCache && enabled && !!key);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const executeFetch = useCallback(async (skipCache = false) => {
    if (!key || !enabled) return;

    // Check cache
    if (!skipCache) {
      const cached = cacheService.get<T>(key, swr);
      if (cached) {
        setData(cached.data);
        setLoading(false);

        // If not stale, we are done
        if (!cached.isStale) {
          return cached.data;
        }

        // It is stale, revalidate in background
        setIsRevalidating(true);
      } else {
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    try {
      const fresh = await fetcherRef.current();
      cacheService.set(key, fresh, ttl);
      setData(fresh);
      setError(null);
      if (options?.onSuccess) {
        options.onSuccess(fresh);
      }
      return fresh;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.warn(`[useCachedQuery] Error fetching ${key}:`, err);
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [key, enabled, ttl, swr]);

  useEffect(() => {
    executeFetch();
  }, [executeFetch]);

  const refetch = useCallback(() => {
    return executeFetch(true);
  }, [executeFetch]);

  return {
    data,
    setData,
    loading,
    isRevalidating,
    error,
    refetch,
  };
}
