/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.storyblok.com',
        pathname: '/f/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: '**.storyblokchina.cn',
        pathname: '/f/**',
        search: '',
      },
    ],
    minimumCacheTTL: 86400,
    qualities: [50, 60, 70, 75, 80, 90],
  },
  // Ensure proper handling on Netlify
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
