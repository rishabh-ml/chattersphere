// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

  // Capture MongoDB queries
  integrations: [
    new Sentry.Integrations.Mongo({
      useMongoose: true,
    }),
  ],

  // Ignore errors from specific sources
  ignoreErrors: [
    // Common server errors to ignore
    "SequelizeConnectionError",
    "SequelizeConnectionRefusedError",
    "SequelizeHostNotFoundError",
    "SequelizeHostNotReachableError",
    "SequelizeInvalidConnectionError",
    "SequelizeConnectionTimedOutError",
    "TimeoutError",
  ],

  // Set sampling based on transaction name
  tracesSampler: (samplingContext) => {
    // Adjust sampling based on transaction name
    const transactionName = samplingContext.transactionContext?.name;
    
    if (!transactionName) return 0.5;
    
    // Sample health checks and static assets at a lower rate
    if (transactionName.includes('/api/health')) return 0.01;
    if (transactionName.includes('/_next/static')) return 0.01;
    
    // Sample important API endpoints at a higher rate
    if (transactionName.includes('/api/posts')) return 0.8;
    if (transactionName.includes('/api/communities')) return 0.8;
    if (transactionName.includes('/api/profile')) return 0.8;
    
    // Default sampling rate
    return 0.5;
  },
});
