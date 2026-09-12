/**
 * YYME Marketplace: Buyer Client-Side Cache Service
 * Provides dual-tier caching (In-Memory + SessionStorage) with
 * Stale-While-Revalidate (SWR) support and configurable TTLs.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // in milliseconds
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const CACHE_TTL = {
  LONG: 15 * 60 * 1000,    // 15 minutes (Categories master hierarchy)
  MEDIUM: 10 * 60 * 1000,  // 10 minutes (Hero marketing banners)
  SHORT: 3 * 60 * 1000,    // 3 minutes (Product details & variants)
  DYNAMIC: 2 * 60 * 1000,  // 2 minutes (Catalog listings & search)
};

export const CACHE_KEYS = {
  CATEGORIES_ALL: 'yyme_buyer_categories_all',
  CATEGORIES_L1: 'yyme_buyer_categories_l1',
  BANNERS: 'yyme_buyer_banners',
  FEATURED_PRODUCTS: 'yyme_buyer_featured_prods',
  ACTIVE_SELLERS: 'yyme_buyer_active_sellers',
  PRODUCT_DETAIL: (id: string) => `yyme_buyer_prod_${id}`,
  PRODUCT_VARIANTS: (id: string) => `yyme_buyer_vars_${id}`,
  CATEGORY_PRODUCTS: (catId: string) => `yyme_buyer_catprods_${catId}`,
  SHOP_PRODUCTS: (key: string) => `yyme_buyer_shop_${key}`,
};

export const cacheService = {
  /**
   * Get an entry from Memory or SessionStorage.
   * If allowStale is true, returns data even if past TTL, marking isStale: true.
   */
  get<T>(key: string, allowStale = false): { data: T; isStale: boolean } | null {
    // 1. Try In-Memory first (fastest, 0ms)
    let entry: CacheEntry<T> | undefined = memoryCache.get(key);

    // 2. Fallback to SessionStorage if not in memory
    if (!entry && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          entry = JSON.parse(raw);
          if (entry) {
            memoryCache.set(key, entry);
          }
        }
      } catch (err) {
        // Ignore storage read errors (e.g. private mode)
      }
    }

    if (!entry) return null;

    const isStale = (Date.now() - entry.timestamp > entry.ttl) || (Array.isArray(entry.data) && entry.data.length === 0);
    if (!allowStale && isStale) return null;

    return { data: entry.data, isStale };
  },

  /**
   * Set an entry into Memory and SessionStorage
   */
  set<T>(key: string, data: T, ttl = CACHE_TTL.SHORT): void {
    // Avoid caching empty lists for long TTLs
    const effectiveTtl = (Array.isArray(data) && data.length === 0) ? 1000 : ttl;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: effectiveTtl,
    };

    memoryCache.set(key, entry);

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        if (Array.isArray(data) && data.length === 0) {
          sessionStorage.removeItem(key);
        } else {
          sessionStorage.setItem(key, JSON.stringify(entry));
        }
      } catch (err) {
        // If quota exceeded, clear stale entries from sessionStorage
        try {
          sessionStorage.clear();
          if (!Array.isArray(data) || data.length > 0) {
            sessionStorage.setItem(key, JSON.stringify(entry));
          }
        } catch {
          // Ignore
        }
      }
    }
  },

  /**
   * Fetch with Stale-While-Revalidate (SWR) behavior.
   * If cached data is available, returns immediately.
   * If data is stale or missing, fetches fresh data from remote.
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttl?: number;
      swr?: boolean;
      onBackgroundUpdate?: (fresh: T) => void;
    }
  ): Promise<T> {
    const ttl = options?.ttl ?? CACHE_TTL.SHORT;
    const swr = options?.swr ?? true;

    // Check cache
    const cached = this.get<T>(key, swr);

    if (cached && (!Array.isArray(cached.data) || cached.data.length > 0)) {
      // If stale and SWR is active, trigger background revalidation
      if (cached.isStale && swr) {
        fetcher()
          .then((fresh) => {
            this.set(key, fresh, ttl);
            if (options?.onBackgroundUpdate) {
              options.onBackgroundUpdate(fresh);
            }
          })
          .catch((err) => {
            console.warn(`[Cache] Background revalidation failed for ${key}:`, err);
          });
      }
      return cached.data;
    }

    // Cache miss or empty: execute fetcher
    const fresh = await fetcher();
    this.set(key, fresh, ttl);
    return fresh;
  },

  /**
   * Invalidate specific key or keys matching pattern
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      memoryCache.clear();
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.clear();
      }
      return;
    }

    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.includes(pattern)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        // Ignore
      }
    }
  },
};
