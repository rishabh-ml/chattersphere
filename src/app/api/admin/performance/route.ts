import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getPerformanceMetrics,
  getAverageResponseTime,
  getSlowestRoutes,
} from "@/middleware/performanceMonitoring";
import { withApiMiddleware } from "@/lib/apiUtils";

/**
 * GET /api/admin/performance - Get performance metrics
 */
async function getPerformanceHandler(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real app, you would check if the user is an admin
    // For now, we'll just check if the user is authenticated

    // Parse query parameters
    const url = new URL(req.url);
    const route = url.searchParams.get("route");
    const limit = parseInt(url.searchParams.get("limit") || "5", 10);

    // Get performance metrics
    const metrics = getPerformanceMetrics();
    const avgResponseTime = getAverageResponseTime(route || undefined);
    const slowestRoutes = getSlowestRoutes(limit);

    // Return the metrics
    return NextResponse.json(
      {
        metrics: metrics.slice(0, 20), // Only return the most recent 20 metrics
        stats: {
          avgResponseTime,
          slowestRoutes,
          totalRequests: metrics.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return NextResponse.json({ error: "Failed to fetch performance metrics" }, { status: 500 });
  }
}

// Export the handler with middleware
export const GET = withApiMiddleware(getPerformanceHandler, {
  enableRateLimit: true,
  maxRequests: 20,
  windowMs: 60000, // 1 minute
  identifier: "admin:performance:get",
});
