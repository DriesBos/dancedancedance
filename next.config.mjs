/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  // `max` is redefined to one year so the route `s-maxage` Netlify derives
  // matches STORYBLOK_REVALIDATE_SECONDS; freshness comes from the webhook
  // purge (src/lib/storyblok-cache.ts), not the clock.
  cacheLife: {
    max: { stale: 300, revalidate: 31536000, expire: 31536000 },
  },
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
