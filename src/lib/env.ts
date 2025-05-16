import { z } from "zod";

/**
 * Environment variable validation schema using Zod
 * This ensures all required environment variables are present and correctly typed
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // MongoDB
  MONGODB_URI: z.string().min(1),

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Supabase Storage
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Redis (optional in development)
  REDIS_URL: z.string().optional(),

  // Sentry Error Tracking (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_VOICE_CHANNELS: z.enum(["true", "false"]).optional().default("false"),
  NEXT_PUBLIC_ENABLE_DIRECT_MESSAGES: z.enum(["true", "false"]).optional().default("true"),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().optional().default("100"),
  RATE_LIMIT_WINDOW_MS: z.string().optional().default("60000"), // 1 minute
});

/**
 * Parse and validate environment variables
 * This will throw an error if any required variables are missing
 */
const parseEnv = () => {
  // In development, we can use default values for some variables
  const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

    // Set default values for development
    if (isDev) {
      // Set default values for required variables in development
      if (!process.env.NODE_ENV) process.env = { ...process.env, NODE_ENV: "development" };
      if (!process.env.NEXT_PUBLIC_APP_URL) process.env = { ...process.env, NEXT_PUBLIC_APP_URL: "http://localhost:3002" };
      if (!process.env.MONGODB_URI && process.env.NODE_ENV === "development") {
        process.env = {
          ...process.env,
          MONGODB_URI: "mongodb+srv://contactrishabhshukla:5AxuD9rSIoCd0DSB@chattersphere-cluster.iao9njh.mongodb.net/?retryWrites=true&w=majority&appName=ChatterSphere-Cluster"
        };
      }
      if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        process.env = {
          ...process.env,
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_Y2hvaWNlLW11ZGZpc2gtMS5jbGVyay5hY2NvdW50cy5kZXYk"
        };
      }
      if (!process.env.CLERK_SECRET_KEY) {
        process.env = {
          ...process.env,
          CLERK_SECRET_KEY: "sk_test_OzIu3sooY8vWJTMXMtyqw5Md3HiOMzcH9VpCQN0QU3"
        };
      }
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        process.env = {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: "https://szviiyruknxtluzcmcik.supabase.co"
        };
      }
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        process.env = {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dmlpeXJ1a254dGx1emNtY2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMjE3NDQsImV4cCI6MjA2MDY5Nzc0NH0.mQmZZb_u5ZxMNhf6Wk7X1daAFCwxhA-1NCwzep0nUP4"
        };
      }
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        process.env = {
          ...process.env,
          SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dmlpeXJ1a254dGx1emNtY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTEyMTc0NCwiZXhwIjoyMDYwNjk3NzQ0fQ.example_service_role_key"
        };
      }
  }

  // If Redis is not set in development, we'll use a mock implementation
  if (isDev && !process.env.REDIS_URL) {
    console.warn("⚠️ REDIS_URL not set, using in-memory cache for development");
  }

  // Always use fallback values in development to prevent errors
  if (isDev) {
    console.warn("Using fallback values for missing environment variables in development");
    return envSchema.parse({
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "development",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002",
      MONGODB_URI:
        process.env.MONGODB_URI ||
        "mongodb+srv://contactrishabhshukla:5AxuD9rSIoCd0DSB@chattersphere-cluster.iao9njh.mongodb.net/?retryWrites=true&w=majority&appName=ChatterSphere-Cluster",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        "pk_test_Y2hvaWNlLW11ZGZpc2gtMS5jbGVyay5hY2NvdW50cy5kZXYk",
      CLERK_SECRET_KEY:
        process.env.CLERK_SECRET_KEY || "sk_test_OzIu3sooY8vWJTMXMtyqw5Md3HiOMzcH9VpCQN0QU3",
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://szviiyruknxtluzcmcik.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dmlpeXJ1a254dGx1emNtY2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMjE3NDQsImV4cCI6MjA2MDY5Nzc0NH0.mQmZZb_u5ZxMNhf6Wk7X1daAFCwxhA-1NCwzep0nUP4",
      SUPABASE_SERVICE_ROLE_KEY:
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dmlpeXJ1a254dGx1emNtY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTEyMTc0NCwiZXhwIjoyMDYwNjk3NzQ0fQ.example_service_role_key",
    });
  }

  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join("."));
      console.error(`❌ Missing or invalid environment variables: ${missingVars.join(", ")}`);

      // For production, we still throw an error
      throw new Error(`❌ Missing or invalid environment variables: ${missingVars.join(", ")}`);
    }
    throw error;
  }
};

/**
 * Validated environment variables
 */
export const env = parseEnv();

/**
 * Type definition for environment variables
 */
export type Env = z.infer<typeof envSchema>;
