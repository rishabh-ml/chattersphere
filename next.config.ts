import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

// Enable bundle analyzer if ANALYZE is set
const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Base Next.js configuration
const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "img.clerk.com",
      "images.clerk.dev",
      "storage.googleapis.com",
      "cdn.chattersphere.com",
      "uploadthing.com",
      "placehold.co",
      "szviiyruknxtluzcmcik.supabase.co"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "cdn.chattersphere.com",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "szviiyruknxtluzcmcik.supabase.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  eslint: {
    // Only ignore during builds in CI, not in development
    ignoreDuringBuilds: true,
    dirs: ["src"],
  },
  typescript: {
    // Only ignore during builds in CI, not in development
    ignoreBuildErrors: true,
  },
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression
  productionBrowserSourceMaps: true, // Enable source maps in production for error tracking
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },
  // Disable static site generation completely
  output: 'standalone',
  distDir: '.next',
  generateEtags: false,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  // Configure redirects for common paths
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
  // Configure rewrites for API proxying if needed
  async rewrites() {
    return [
      // Example: Proxy requests to external API to avoid CORS issues
      // {
      //   source: "/api/external/:path*",
      //   destination: "https://external-api.com/:path*",
      // },
    ];
  },
};

// Apply bundle analyzer wrapper
const configWithBundleAnalyzer = analyzeBundles(nextConfig);

// Apply Sentry wrapper (will only be active if SENTRY_DSN is set)
const sentryWebpackPluginOptions = {
  // Additional config options for Sentry
  silent: process.env.NODE_ENV === "development",
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
};

export default process.env.SENTRY_DSN
  ? withSentryConfig(configWithBundleAnalyzer, sentryWebpackPluginOptions)
  : configWithBundleAnalyzer;
