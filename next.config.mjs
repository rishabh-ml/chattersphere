/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  // Other Next.js config options
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
