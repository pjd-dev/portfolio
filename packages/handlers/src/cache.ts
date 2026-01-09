/**
 * Lightweight in-memory cache with TTL support.
 * Mirrors the behavior of the MCP VaultCache to reuse graph logic.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class VaultCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(defaultTTLSeconds: number = 300, maxSize: number = 1000) {
    this.defaultTTL = defaultTTLSeconds * 1000;
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // simple eviction: delete oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }
}
