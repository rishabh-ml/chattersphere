// This file configures the initialization of Sentry for edge functions.
// The config you add here will be used whenever an edge function handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.5,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Set environment
  environment: process.env.NODE_ENV,

  // Enable performance monitoring
  enableTracing: true,
});
