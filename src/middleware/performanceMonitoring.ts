import { NextRequest, NextResponse } from "next/server";

// Interface for performance metrics
interface PerformanceMetrics {
  route: string;
  method: string;
  duration: number;
  timestamp: Date;
  status: number;
}

// In-memory storage for performance metrics (last 100 requests)
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS = 100;

// Thresholds for performance warnings (in milliseconds)
const SLOW_THRESHOLD = 500;
const VERY_SLOW_THRESHOLD = 1000;

/**
 * Performance monitoring middleware
 * Tracks request duration and logs slow requests
 */
export async function performanceMonitoring(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const method = req.method;
  const url = req.url;
  const path = new URL(url).pathname;

  try {
    // Process the request
    const response = await handler(req);

    // Calculate request duration
    const duration = Date.now() - startTime;
    const status = response.status;

    // Store metrics
    storeMetrics({
      route: path,
      method,
      duration,
      timestamp: new Date(),
      status,
    });

    // Log slow requests
    if (duration > VERY_SLOW_THRESHOLD) {
      console.warn(`[VERY SLOW REQUEST] ${method} ${path} took ${duration}ms - Status: ${status}`);
    } else if (duration > SLOW_THRESHOLD) {
      console.warn(`[SLOW REQUEST] ${method} ${path} took ${duration}ms - Status: ${status}`);
    }

    // Add timing headers to the response
    response.headers.set("X-Response-Time", `${duration}ms`);

    return response;
  } catch (error) {
    // Calculate request duration even for errors
    const duration = Date.now() - startTime;

    // Store metrics for failed requests
    storeMetrics({
      route: path,
      method,
      duration,
      timestamp: new Date(),
      status: 500, // Assume 500 for errors
    });

    // Log error with timing information
    console.error(`[ERROR] ${method} ${path} failed after ${duration}ms`, error);

    // Re-throw the error to be handled by the error handler
    throw error;
  }
}

/**
 * Store performance metrics
 */
function storeMetrics(metrics: PerformanceMetrics): void {
  // Add to the beginning of the array
  performanceMetrics.unshift(metrics);

  // Trim the array if it exceeds the maximum size
  if (performanceMetrics.length > MAX_METRICS) {
    performanceMetrics.length = MAX_METRICS;
  }
}

/**
 * Get performance metrics
 * @returns Array of performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics[] {
  return [...performanceMetrics];
}

/**
 * Get average response time for a specific route
 * @param route Route path
 * @returns Average response time in milliseconds
 */
export function getAverageResponseTime(route?: string): number {
  const filteredMetrics = route
    ? performanceMetrics.filter((m) => m.route === route)
    : performanceMetrics;

  if (filteredMetrics.length === 0) {
    return 0;
  }

  const sum = filteredMetrics.reduce((acc, m) => acc + m.duration, 0);
  return Math.round(sum / filteredMetrics.length);
}

/**
 * Get the slowest routes
 * @param limit Number of routes to return
 * @returns Array of routes with their average response times
 */
export function getSlowestRoutes(limit: number = 5): { route: string; avgDuration: number }[] {
  // Group metrics by route
  const routeMap = new Map<string, number[]>();

  performanceMetrics.forEach((m) => {
    if (!routeMap.has(m.route)) {
      routeMap.set(m.route, []);
    }
    routeMap.get(m.route)!.push(m.duration);
  });

  // Calculate average duration for each route
  const routeAvgs = Array.from(routeMap.entries()).map(([route, durations]) => {
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const avg = Math.round(sum / durations.length);
    return { route, avgDuration: avg };
  });

  // Sort by average duration (descending) and take the top N
  return routeAvgs.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, limit);
}

/**
 * Higher-order function to wrap API handlers with performance monitoring
 */
export function withPerformanceMonitoring(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    return performanceMonitoring(req, handler);
  };
}
