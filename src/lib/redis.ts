import { Redis } from "ioredis";
import { env } from "@/lib/env";

// Cache statistics for monitoring
export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  sets: number;
  deletes: number;
}

// Global cache statistics
export const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  sets: 0,
  deletes: 0,
};

// Cache key prefixes for different data types
export const CacheKeys = {
  POST: "post:",
  POSTS: "posts:",
  POPULAR_POSTS: "popular:posts:",
  COMMUNITY: "community:",
  COMMUNITIES: "communities:",
  USER: "user:",
  USERS: "users:",
  COMMENT: "comment:",
  COMMENTS: "comments:",
  FEED: "feed:",
  SEARCH: "search:",
  STATS: "stats:",
};

// Cache TTL (Time To Live) in seconds for different data types
export const CacheTTL = {
  POST: 60 * 5, // 5 minutes
  POSTS: 60 * 2, // 2 minutes
  POPULAR_POSTS: 60 * 10, // 10 minutes
  COMMUNITY: 60 * 5, // 5 minutes
  COMMUNITIES: 60 * 15, // 15 minutes
  USER: 60 * 5, // 5 minutes
  USERS: 60 * 10, // 10 minutes
  COMMENT: 60 * 5, // 5 minutes
  COMMENTS: 60 * 2, // 2 minutes
  FEED: 60, // 1 minute
  SEARCH: 60 * 30, // 30 minutes
  STATS: 60 * 60, // 1 hour
};

// In-memory cache for development if Redis URL is not provided
class MemoryCache {
  private cache: Map<string, { value: string; expiry: number | null }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);

    if (!item) return null;

    // Check if item has expired
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + ttl * 1000 : null;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async flushall(): Promise<void> {
    this.cache.clear();
  }
}

// Determine which cache implementation to use
const getRedisInstance = () => {
  if (env.REDIS_URL) {
    return new Redis(env.REDIS_URL);
  }

  // Use in-memory cache for development and as fallback in production
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️ Using in-memory cache instead of Redis in development");
  } else {
    console.warn("⚠️ REDIS_URL not set - using in-memory cache. Rate limiting and caching will not persist across restarts.");
  }
  
  return new MemoryCache() as unknown as Redis;
};

// Create a singleton instance
let redisInstance: Redis | null = null;

export const getRedis = () => {
  if (!redisInstance) {
    redisInstance = getRedisInstance();
  }
  return redisInstance;
};

/**
 * Cache wrapper for API handlers
 * @param key Cache key
 * @param fn Function to execute if cache miss
 * @param ttl Time to live in seconds (default: 60)
 * @param skipCache Whether to skip the cache and force a refresh
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = 60,
  skipCache = false
): Promise<T> {
  const redis = getRedis();

  try {
    // Skip cache if requested
    if (!skipCache) {
      // Try to get from cache
      const cached = await redis.get(key);

      if (cached) {
        try {
          // Increment hit counter
          cacheStats.hits++;
          return JSON.parse(cached) as T;
        } catch (parseError) {
          console.error("Redis cache parse error:", parseError);
          // If parsing fails, invalidate the cache entry
          await redis.del(key);
          cacheStats.errors++;
        }
      } else {
        // Increment miss counter
        cacheStats.misses++;
      }
    }

    // Cache miss or skip cache, execute function
    const result = await fn();

    // Store in cache
    try {
      await redis.set(key, JSON.stringify(result), "EX", ttl);
      cacheStats.sets++;
    } catch (setError) {
      console.error("Redis set error:", setError);
      cacheStats.errors++;
      // Continue without caching
    }

    return result;
  } catch (error) {
    console.error("Redis cache error:", error);
    cacheStats.errors++;
    // If cache fails, just execute the function
    return fn();
  }
}

/**
 * Invalidate cache keys matching a pattern
 * @param pattern Cache key pattern to invalidate
 */
export async function invalidateCache(pattern: string): Promise<void> {
  const redis = getRedis();

  try {
    if (redis instanceof MemoryCache) {
      // For memory cache, we'll just clear everything
      await redis.flushall();
      cacheStats.deletes++;
      return;
    }

    // For Redis, we can use scan to find keys matching the pattern
    let cursor = "0";
    let deletedKeys = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);

      cursor = nextCursor;

      if (keys.length) {
        await redis.del(...keys);
        deletedKeys += keys.length;
        cacheStats.deletes += keys.length;
      }
    } while (cursor !== "0");

    console.log(`Invalidated ${deletedKeys} cache keys matching pattern: ${pattern}`);
  } catch (error) {
    console.error("Redis invalidation error:", error);
    cacheStats.errors++;
  }
}

/**
 * Get cache statistics
 * @returns Current cache statistics
 */
export function getCacheStats(): CacheStats {
  return { ...cacheStats };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.errors = 0;
  cacheStats.sets = 0;
  cacheStats.deletes = 0;
}

/**
 * Calculate cache hit rate
 * @returns Cache hit rate as a percentage
 */
export function getCacheHitRate(): number {
  const total = cacheStats.hits + cacheStats.misses;
  if (total === 0) return 0;
  return (cacheStats.hits / total) * 100;
}

/**
 * Prefetch and cache data
 * @param key Cache key
 * @param fn Function to execute to get the data
 * @param ttl Time to live in seconds
 */
export async function prefetchCache<T>(key: string, fn: () => Promise<T>, ttl = 60): Promise<void> {
  try {
    const result = await fn();
    const redis = getRedis();

    await redis.set(key, JSON.stringify(result), "EX", ttl);

    cacheStats.sets++;
    console.log(`Prefetched cache for key: ${key}`);
  } catch (error) {
    console.error(`Error prefetching cache for key: ${key}`, error);
    cacheStats.errors++;
  }
}
