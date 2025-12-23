/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the default Next.js loading indicator
  devIndicators: false,
  // Performance optimizations
  compress: true, // Gzip compression
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true, // Catch bugs early

  // sassOptions: {
  //   additionalData: `@import "src/assets/styles/variables.sass"`,
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.storyblok.com',
      },
    ],
    qualities: [50, 75, 80, 90],
  },
  // Ensure proper handling on Netlify
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Add experimental features for better stability
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
