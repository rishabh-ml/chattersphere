// next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

// Enable bundle analysis when ANALYZE=true
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const baseConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      "img.clerk.com",
      "images.clerk.dev",
      "storage.googleapis.com",
      "cdn.chattersphere.com",
      "uploadthing.com",
      "placehold.co",
      "szviiyruknxtluzcmcik.supabase.co",
    ],
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "cdn.chattersphere.com" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "szviiyruknxtluzcmcik.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  eslint: {
    ignoreDuringBuilds: true,
    dirs: ["src"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Remove serverExternalPackages as it doesn't exist in ExperimentalConfig
  },

  webpack(config, { isServer }) {
    config.experiments = { ...(config.experiments || {}), topLevelAwait: true };
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      async_hooks: false,
      fs: false,
      perf_hooks: false,
    };
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "@opentelemetry/api",
        "@opentelemetry/core",
        "@opentelemetry/semantic-conventions",
        "@opentelemetry/resources",
        "@opentelemetry/sdk-trace-base",
      ];
    }
    return config;
  },

  transpilePackages: [
    "@sentry/nextjs",
    "@opentelemetry/api",
    "@opentelemetry/core",
    "@opentelemetry/semantic-conventions",
  ],
  output: "standalone",
  distDir: ".next",
  generateEtags: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  async redirects() {
    return [{ source: "/home", destination: "/", permanent: true }];
  },

  async rewrites() {
    return [];
  },
};

const config = process.env.SENTRY_DSN  ? withSentryConfig(withBundleAnalyzer(baseConfig), {
      silent: process.env.NODE_ENV === "development",
      org: process.env.SENTRY_ORG || "",
      project: process.env.SENTRY_PROJECT || "",
      autoInstrumentServerFunctions: false,
    })
  : withBundleAnalyzer(baseConfig);

export default config;
