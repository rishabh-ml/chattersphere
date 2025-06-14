import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/env";

/**
 * Initialize Sentry for error tracking
 * Only initializes if SENTRY_DSN is set in environment variables
 */
export function initSentry() {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      // Performance monitoring
      tracesSampleRate: 0.2, // Capture 20% of transactions for performance monitoring
      profilesSampleRate: 0.1, // Capture 10% of transactions for profiling

      // Only enable in production
      enabled: process.env.NODE_ENV === "production",

      // Set environment
      environment: process.env.NODE_ENV,

      // Ignore common errors
      ignoreErrors: [
        // Network errors that we don't need to track
        "Network request failed",
        "Failed to fetch",
        "NetworkError",
        "AbortError",
        // Client-side navigation cancellations
        "cancelled",
        "ResizeObserver loop limit exceeded",
      ],

      // Adjust this based on your application's needs
      maxBreadcrumbs: 50,

      // Add context to errors
      beforeSend(event) {
        // Don't send PII (Personally Identifiable Information)
        if (event.user) {
          // Keep the ID but remove other PII
          delete event.user.ip_address;
          delete event.user.email;
          delete event.user.username;
        }

        return event;
      },
    });
  }
}

/**
 * Capture an exception with Sentry
 * @param error Error to capture
 * @param context Additional context
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // Log to console in development
    console.error("Error captured:", error, context);
  }
}

/**
 * Set user context for Sentry
 * @param userId User ID
 */
export function setUser(userId: string) {
  if (env.SENTRY_DSN) {
    Sentry.setUser({ id: userId });
  }
}

/**
 * Clear user context for Sentry
 */
export function clearUser() {
  if (env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
}
