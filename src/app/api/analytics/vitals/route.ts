import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentry";
import { rateLimit } from "@/middleware/rateLimit";

/**
 * Web Vitals analytics endpoint
 * Collects performance metrics from the client
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(req, {
    maxRequests: 50, // 50 requests per minute
    windowMs: 60000, // 1 minute
    identifier: "analytics:vitals",
  });

  // If rate limit response is not 'next', return it
  if (rateLimitResponse.status !== 200) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();

    // Log metrics to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("Web Vitals:", body);
    }

    // In production, you would store these metrics in a database
    // or send them to an analytics service like Google Analytics,
    // Datadog, New Relic, etc.

    // For now, we'll just acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    captureException(error as Error, { context: "analytics:vitals" });
    return NextResponse.json({ error: "Failed to process analytics" }, { status: 500 });
  }
}
