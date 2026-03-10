import type { ImageLoaderProps } from 'next/image';

const STORYBLOK_HOSTNAMES = new Set(['a.storyblok.com', 'img2.storyblok.com']);
const DEFAULT_STORYBLOK_QUALITY = 70;

type StoryblokImageFormat = 'webp' | 'avif' | 'jpg' | 'jpeg' | 'png';

interface StoryblokImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: StoryblokImageFormat;
  smart?: boolean;
}

export const isStoryblokAssetUrl = (src?: string): boolean => {
  if (!src) return false;

  try {
    const { hostname } = new URL(src);
    return STORYBLOK_HOSTNAMES.has(hostname);
  } catch {
    return false;
  }
};

export const transformStoryblokImageUrl = (
  src: string,
  {
    width = 0,
    height = 0,
    quality = DEFAULT_STORYBLOK_QUALITY,
    format = 'webp',
    smart = true,
  }: StoryblokImageTransformOptions = {},
): string => {
  if (!isStoryblokAssetUrl(src) || src.includes('/m/')) return src;

  const [path, query] = src.split('?');
  const normalizedWidth = Math.max(0, Math.round(width));
  const normalizedHeight = Math.max(0, Math.round(height));
  const filters = [`format(${format})`, `quality(${quality})`];
  const smartPart = smart ? '/smart' : '';
  const filtersPart = `/filters:${filters.join(':')}`;
  const transformed = `${path}/m/${normalizedWidth}x${normalizedHeight}${smartPart}${filtersPart}`;

  return query ? `${transformed}?${query}` : transformed;
};

export const storyblokImageLoader = ({
  src,
  width,
  quality,
}: ImageLoaderProps): string =>
  transformStoryblokImageUrl(src, {
    width,
    quality: quality ?? DEFAULT_STORYBLOK_QUALITY,
  });
