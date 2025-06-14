import { NextRequest, NextResponse } from "next/server";

/**
 * Request logger middleware
 * Logs request details and timing information
 */
export async function requestLogger(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const method = req.method;
  const url = req.url;
  const path = new URL(url).pathname;

  console.log(`[${method}] Request started: ${path}`);

  try {
    // Process the request
    const response = await handler(req);

    // Calculate request duration
    const duration = Date.now() - startTime;
    const status = response.status;

    // Log request completion
    console.log(`[${method}] Request completed: ${path} (${status}) - ${duration}ms`);

    // Add timing headers to the response
    response.headers.set("X-Response-Time", `${duration}ms`);

    // Log slow requests (over 500ms)
    if (duration > 500) {
      console.warn(`[SLOW REQUEST] ${method} ${path} took ${duration}ms`);
    }

    return response;
  } catch (error) {
    // Calculate request duration even for errors
    const duration = Date.now() - startTime;

    // Log error
    console.error(`[${method}] Request failed: ${path} - ${duration}ms`, error);

    // Re-throw the error to be handled by the error handler
    throw error;
  }
}

/**
 * Higher-order function to wrap API handlers with request logging
 */
export function withRequestLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    return requestLogger(req, handler);
  };
}
