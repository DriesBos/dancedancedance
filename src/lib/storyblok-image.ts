import type { ImageLoaderProps } from 'next/image';

const DEFAULT_STORYBLOK_QUALITY = 70;
const STORYBLOK_HOST_SUFFIXES = ['.storyblok.com', '.storyblokchina.cn'];

type StoryblokImageFormat = 'webp' | 'avif' | 'jpg' | 'jpeg' | 'png';

interface StoryblokImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: StoryblokImageFormat;
  smart?: boolean;
  noUpscale?: boolean;
}

export const isStoryblokAssetUrl = (src?: string): boolean => {
  if (!src) return false;

  try {
    const { hostname } = new URL(src);
    return STORYBLOK_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
    );
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
    format,
    smart = false,
    noUpscale = true,
  }: StoryblokImageTransformOptions = {},
): string => {
  if (!isStoryblokAssetUrl(src) || src.includes('/m/')) {
    return src;
  }

  const [path, query] = src.split('?');
  const normalizedWidth = Math.max(0, Math.round(width));
  const normalizedHeight = Math.max(0, Math.round(height));

  const filters: string[] = [];
  if (typeof quality === 'number') {
    const normalizedQuality = Math.max(0, Math.min(100, Math.round(quality)));
    filters.push(`quality(${normalizedQuality})`);
  }
  if (format) {
    filters.push(`format(${format})`);
  }
  if (noUpscale && (normalizedWidth > 0 || normalizedHeight > 0)) {
    filters.push('no_upscale()');
  }

  const hasResize = normalizedWidth > 0 || normalizedHeight > 0;
  if (!hasResize && filters.length === 0) return src;

  const resizePart = hasResize ? `/m/${normalizedWidth}x${normalizedHeight}` : '/m';
  const smartPart = smart && normalizedWidth > 0 && normalizedHeight > 0 ? '/smart' : '';
  const filtersPart = filters.length > 0 ? `/filters:${filters.join(':')}` : '';
  const transformed = `${path}${resizePart}${smartPart}${filtersPart}`;

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

export const storyblokVideoPosterUrl = (
  src?: string,
  width = 1600,
  quality = 60,
): string | undefined => {
  if (!src) return undefined;
  return transformStoryblokImageUrl(src, { width, quality, noUpscale: true });
};
