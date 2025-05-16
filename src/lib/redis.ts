import { Redis } from 'ioredis';
import { env } from '@/lib/env';

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
  
  // Use in-memory cache for development
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Using in-memory cache instead of Redis');
    return new MemoryCache() as unknown as Redis;
  }
  
  throw new Error('Redis URL is required in production');
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
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = 60
): Promise<T> {
  const redis = getRedis();
  
  try {
    // Try to get from cache
    const cached = await redis.get(key);
    
    if (cached) {
      return JSON.parse(cached) as T;
    }
    
    // Cache miss, execute function
    const result = await fn();
    
    // Store in cache
    await redis.set(
      key,
      JSON.stringify(result),
      'EX',
      ttl
    );
    
    return result;
  } catch (error) {
    console.error('Redis cache error:', error);
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
      return;
    }
    
    // For Redis, we can use scan to find keys matching the pattern
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      
      cursor = nextCursor;
      
      if (keys.length) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    console.error('Redis invalidation error:', error);
  }
}
