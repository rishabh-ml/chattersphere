import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimit {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async check(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = identifier;

    // Clean up expired entries
    if (this.store[key] && now > this.store[key].resetTime) {
      delete this.store[key];
    }

    // Initialize if not exists
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }

    const current = this.store[key];
    current.count++;

    const remaining = Math.max(0, this.maxRequests - current.count);
    const success = current.count <= this.maxRequests;

    return {
      success,
      limit: this.maxRequests,
      remaining,
      resetTime: current.resetTime,
    };
  }
}

// Create different rate limiters for different use cases
export const authRateLimit = new RateLimit(900000, 5); // 5 requests per 15 minutes for auth
export const apiRateLimit = new RateLimit(60000, 100); // 100 requests per minute for general API
export const uploadRateLimit = new RateLimit(60000, 10); // 10 uploads per minute

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
  return ip;
}

// Main rate limit middleware function
export async function rateLimit(
  request: NextRequest,
  limiter: RateLimit = apiRateLimit
): Promise<Response | null> {
  try {
    const identifier = getClientIdentifier(request);
    const result = await limiter.check(identifier);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // No rate limit exceeded
  } catch (error) {
    console.error('Rate limit error:', error);
    return null; // Allow request on error
  }
}
