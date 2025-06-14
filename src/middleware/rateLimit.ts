import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { env } from "@/lib/env";

/**
 * Rate limiting middleware for API routes
 * Uses Redis to track request counts per IP address
 */
export async function rateLimit(
  req: NextRequest,
  options: {
    maxRequests?: number;
    windowMs?: number;
    identifier?: string;
  } = {}
) {
  // Get client IP address
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";

  // Get options with defaults
  const maxRequests = options.maxRequests || parseInt(env.RATE_LIMIT_MAX || "100", 10);
  const windowMs = options.windowMs || parseInt(env.RATE_LIMIT_WINDOW_MS || "60000", 10);
  const identifier = options.identifier || "api";

  // Create a unique key for this IP and endpoint
  const key = `ratelimit:${identifier}:${ip}`;

  try {
    const redis = getRedis();

    // Get current count
    const currentCount = await redis.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    // Check if rate limit exceeded
    if (count >= maxRequests) {
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(windowMs / 1000).toString(),
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": (Date.now() + windowMs).toString(),
          },
        }
      );
    }

    // Increment count
    await redis.incr(key);

    // Set expiry if this is the first request
    if (count === 0) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    // Add rate limit headers to response
    const remainingRequests = Math.max(0, maxRequests - (count + 1));

    // Continue to the API route
    return NextResponse.next({
      headers: {
        "X-RateLimit-Limit": maxRequests.toString(),
        "X-RateLimit-Remaining": remainingRequests.toString(),
        "X-RateLimit-Reset": (Date.now() + windowMs).toString(),
      },
    });
  } catch (error) {
    console.error("Rate limiting error:", error);
    // If rate limiting fails, allow the request to proceed
    return NextResponse.next();
  }
}
