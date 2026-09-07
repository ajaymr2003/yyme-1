interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string, ttlMs: number): T | null {
  // 1. In-memory cache (instant)
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.timestamp < ttlMs) {
    return mem.data as T;
  }

  // 2. localStorage fallback (persists across refresh/tabs)
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < ttlMs) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {
    // corrupted entry, ignore
  }

  return null;
}

export function setCached<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // storage full, ignore
  }
}

export function invalidateCache(key: string): void {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function invalidateCachePrefix(prefix: string): void {
  // In-memory
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) memoryCache.delete(k);
  }
  // localStorage
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}
