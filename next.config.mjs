/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  images: {
    loader: 'custom',
    loaderFile: './src/lib/storyblok-image-loader.ts',
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
};

export default nextConfig;
