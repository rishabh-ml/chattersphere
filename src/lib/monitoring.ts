/**
 * Monitoring Service
 *
 * This file contains utilities for monitoring application performance and errors.
 * It integrates with Sentry for error tracking and performance monitoring.
 */

// Import Sentry with dynamic import to avoid ESM/CJS conflicts
let Sentry: typeof import('@sentry/nextjs');

// Use try-catch to handle potential import errors
try {
  // Use require for CommonJS compatibility
  Sentry = require('@sentry/nextjs');
} catch (error) {
  // Fallback empty implementation if Sentry fails to load
  console.warn('Failed to load Sentry, using fallback implementation');
  Sentry = {
    captureException: (err: Error) => console.error(err),
    captureMessage: (msg: string) => console.log(msg),
    setTag: () => {},
    addBreadcrumb: () => {},
    startTransaction: () => ({
      setMeasurement: () => {},
      finish: () => {},
    }),
    init: () => {},
  } as any;
}

import { getPerformanceMetrics, getSlowestRoutes } from '@/middleware/performanceMonitoring';
import { getCacheStats, getCacheHitRate } from '@/lib/redis';

// Performance thresholds in milliseconds
export const PerformanceThresholds = {
  GOOD: 100,
  ACCEPTABLE: 300,
  SLOW: 1000,
  VERY_SLOW: 3000,
};

/**
 * Initialize monitoring
 */
export function initMonitoring() {
  // Sentry is already initialized by @sentry/nextjs
  // This function is for any additional setup

  // Set up periodic performance reporting
  if (process.env.NODE_ENV === 'production') {
    // Report performance metrics every 5 minutes
    setInterval(reportPerformanceMetrics, 5 * 60 * 1000);
  }
}

/**
 * Report performance metrics to monitoring service
 */
export async function reportPerformanceMetrics() {
  try {
    // Get performance metrics
    const metrics = getPerformanceMetrics();
    const slowestRoutes = getSlowestRoutes(5);

    // Get cache statistics
    const cacheStats = getCacheStats();
    const cacheHitRate = getCacheHitRate();

    // Report to Sentry
    Sentry.setTag('cache.hitRate', cacheHitRate.toFixed(2));
    Sentry.setTag('performance.averageResponseTime', metrics.length > 0
      ? (metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length).toFixed(2)
      : '0');

    // Report slowest routes
    slowestRoutes.forEach((route, index) => {
      Sentry.setTag(`performance.slowestRoute.${index + 1}`, `${route.route} (${route.avgDuration}ms)`);
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metrics:', {
        metrics: metrics.slice(0, 5),
        slowestRoutes,
        cacheStats,
        cacheHitRate,
      });
    }
  } catch (error) {
    console.error('Error reporting performance metrics:', error);
    Sentry.captureException(error);
  }
}

/**
 * Monitor a function execution and report if it's slow
 * @param name Function name or description
 * @param fn Function to monitor
 * @param threshold Threshold in milliseconds
 * @returns Function result
 */
export async function monitorFunction<T>(
  name: string,
  fn: () => Promise<T>,
  threshold = PerformanceThresholds.ACCEPTABLE
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    // Report if the function is slow
    if (duration > threshold) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow function: ${name} took ${duration}ms`,
        level: 'warning',
      });      // Create a performance span
      const transaction = Sentry.startSpan({
        name: `function.${name}`,
        op: 'function',
      }, () => {
        // Span operations here
      });

      Sentry.setMeasurement('duration', duration, 'millisecond');
      // transaction.finish(); // Not needed with startSpan

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Slow function: ${name} took ${duration}ms`);
      }
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Report the error with performance context
    Sentry.captureException(error, {
      tags: {
        functionName: name,
        duration: duration.toString(),
      },
    });

    // Re-throw the error
    throw error;
  }
}

/**
 * Monitor a database query execution and report if it's slow
 * @param name Query name or description
 * @param fn Query function to monitor
 * @param threshold Threshold in milliseconds
 * @returns Query result
 */
export async function monitorQuery<T>(
  name: string,
  fn: () => Promise<T>,
  threshold = PerformanceThresholds.ACCEPTABLE
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    // Report if the query is slow
    if (duration > threshold) {
      Sentry.addBreadcrumb({
        category: 'database',
        message: `Slow query: ${name} took ${duration}ms`,
        level: 'warning',
      });      // Create a performance span
      const transaction = Sentry.startSpan({
        name: `query.${name}`,
        op: 'db',
      }, () => {
        // Span operations here
      });

      Sentry.setMeasurement('duration', duration, 'millisecond');
      // transaction.finish(); // Not needed with startSpan

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Slow query: ${name} took ${duration}ms`);
      }
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Report the error with performance context
    Sentry.captureException(error, {
      tags: {
        queryName: name,
        duration: duration.toString(),
      },
    });

    // Re-throw the error
    throw error;
  }
}

/**
 * Set up performance budget alerts
 * @param budgets Performance budgets
 */
export function setupPerformanceBudgets(budgets: {
  route: string;
  budget: number;
}[]) {
  // Check performance budgets every minute
  setInterval(() => {
    try {
      const metrics = getPerformanceMetrics();

      // Group metrics by route
      const routeMetrics = new Map<string, number[]>();

      metrics.forEach(metric => {
        if (!routeMetrics.has(metric.route)) {
          routeMetrics.set(metric.route, []);
        }
        routeMetrics.get(metric.route)!.push(metric.duration);
      });

      // Check each budget
      budgets.forEach(budget => {
        const routeDurations = routeMetrics.get(budget.route);

        if (routeDurations && routeDurations.length > 0) {
          const avgDuration = routeDurations.reduce((sum, d) => sum + d, 0) / routeDurations.length;

          if (avgDuration > budget.budget) {
            // Report budget violation
            Sentry.captureMessage(`Performance budget exceeded: ${budget.route} (${avgDuration.toFixed(2)}ms > ${budget.budget}ms)`, {
              level: 'warning',
              tags: {
                route: budget.route,
                budget: budget.budget.toString(),
                actual: avgDuration.toFixed(2),
              },
            });

            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Performance budget exceeded: ${budget.route} (${avgDuration.toFixed(2)}ms > ${budget.budget}ms)`);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error checking performance budgets:', error);
    }
  }, 60 * 1000); // Check every minute
}
