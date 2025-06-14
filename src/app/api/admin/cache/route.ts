import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCacheStats, getCacheHitRate, resetCacheStats, invalidateCache } from "@/lib/redis";
import { withApiMiddleware } from "@/lib/apiUtils";

/**
 * GET /api/admin/cache - Get cache statistics
 */
async function getCacheStatsHandler(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real app, you would check if the user is an admin
    // For now, we'll just check if the user is authenticated

    // Get cache statistics
    const stats = getCacheStats();
    const hitRate = getCacheHitRate();

    // Return the statistics
    return NextResponse.json(
      {
        stats,
        hitRate,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching cache statistics:", error);
    return NextResponse.json({ error: "Failed to fetch cache statistics" }, { status: 500 });
  }
}

/**
 * POST /api/admin/cache - Reset cache statistics or invalidate cache
 */
async function postCacheHandler(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real app, you would check if the user is an admin
    // For now, we'll just check if the user is authenticated

    // Parse the request body
    const body = await req.json();
    const { action, pattern } = body;

    if (action === "reset") {
      // Reset cache statistics
      resetCacheStats();
      return NextResponse.json({ message: "Cache statistics reset successfully" }, { status: 200 });
    } else if (action === "invalidate" && pattern) {
      // Invalidate cache keys matching the pattern
      await invalidateCache(pattern);
      return NextResponse.json(
        { message: `Cache keys matching pattern "${pattern}" invalidated successfully` },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: "Invalid action or missing pattern" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling cache action:", error);
    return NextResponse.json({ error: "Failed to handle cache action" }, { status: 500 });
  }
}

// Export the handler functions with middleware
export const GET = withApiMiddleware(getCacheStatsHandler, {
  enableRateLimit: true,
  maxRequests: 20,
  windowMs: 60000, // 1 minute
  identifier: "admin:cache:get",
});

export const POST = withApiMiddleware(postCacheHandler, {
  enableRateLimit: true,
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  identifier: "admin:cache:post",
});
