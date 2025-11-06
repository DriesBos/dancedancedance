/** @type {import('next').NextConfig} */
const nextConfig = {
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
