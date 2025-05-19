import { NextRequest, NextResponse } from 'next/server';
import { withRequestLogging } from '@/middleware/requestLogger';
import { withPerformanceMonitoring } from '@/middleware/performanceMonitoring';
import { rateLimit } from '@/middleware/rateLimit';

/**
 * Wraps an API handler with common middleware
 * - Request logging
 * - Performance monitoring
 * - Rate limiting (optional)
 * - Error handling
 *
 * @param handler The API handler function
 * @param options Configuration options
 * @returns Wrapped handler function
 */
export function withApiMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    enableRateLimit?: boolean;
    maxRequests?: number;
    windowMs?: number;
    identifier?: string;
  } = {}
) {
  // Apply request logging middleware
  let wrappedHandler = withRequestLogging(handler);

  // Apply performance monitoring middleware
  wrappedHandler = withPerformanceMonitoring(wrappedHandler);

  // Apply rate limiting if enabled
  if (options.enableRateLimit) {
    const originalHandler = wrappedHandler;
    wrappedHandler = async (req: NextRequest) => {
      const rateLimitResponse = await rateLimit(req, {
        maxRequests: options.maxRequests || 100,
        windowMs: options.windowMs || 60000, // 1 minute
        identifier: options.identifier || req.nextUrl.pathname,
      });

      // If rate limit response is not 'next', return it
      if (rateLimitResponse.status !== 200) {
        return rateLimitResponse;
      }

      // Otherwise, continue with the original handler
      return originalHandler(req);
    };
  }

  // Add error handling wrapper
  return async (req: NextRequest) => {
    try {
      return await wrappedHandler(req);
    } catch (error) {
      console.error(`API Error: ${req.method} ${req.nextUrl.pathname}`, error);

      // Return a standardized error response
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  };
}
