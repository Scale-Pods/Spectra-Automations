/**
 * High-performance client-side and server-side in-memory cache for instant module navigation.
 * Implements Stale-While-Revalidate (SWR) so switching between modules renders in 0ms.
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Retrieve cached data for a key. Returns cached data even if stale so UI renders instantly.
 */
export function getCachedData<T>(key: string, maxAgeMs = 120000): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    return entry.data as T;
}

/**
 * Check if the cached entry has expired beyond maxAgeMs.
 */
export function isCacheStale(key: string, maxAgeMs = 30000): boolean {
    const entry = memoryCache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > maxAgeMs;
}

/**
 * Store data in the memory cache.
 */
export function setCachedData<T>(key: string, data: T): void {
    if (data === undefined || data === null) return;
    memoryCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Clear cached entries, optionally matching a key prefix.
 */
export function clearCache(keyPrefix?: string): void {
    if (!keyPrefix) {
        memoryCache.clear();
        return;
    }
    for (const key of memoryCache.keys()) {
        if (key.startsWith(keyPrefix)) {
            memoryCache.delete(key);
        }
    }
}

