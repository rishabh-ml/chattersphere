/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  // Other Next.js config options
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "img.clerk.com",
      "images.clerk.dev",
      "storage.googleapis.com",
      "cdn.chattersphere.com",
      "uploadthing.com",
      "placehold.co"
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
