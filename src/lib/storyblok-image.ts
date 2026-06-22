const DEFAULT_STORYBLOK_QUALITY = 70;
const STORYBLOK_HOST_SUFFIXES = ['.storyblok.com', '.storyblokchina.cn'];
const STORYBLOK_ASSET_URL_BASE = 'https://storyblok.local';
const STORYBLOK_IMAGE_DIMENSIONS_PATTERN = /\/f\/[^/]+\/(\d+)x(\d+)\//;

type StoryblokImageFormat = 'webp' | 'avif' | 'jpg' | 'jpeg' | 'png';

export type StoryblokImageDimensions = {
  width: number;
  height: number;
};

export const STORYBLOK_FALLBACK_IMAGE_DIMENSIONS: StoryblokImageDimensions = {
  width: 1600,
  height: 900,
};

interface StoryblokImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: StoryblokImageFormat;
  smart?: boolean;
  noUpscale?: boolean;
}

interface WarmStoryblokImageOptions extends StoryblokImageTransformOptions {
  fetchPriority?: 'high' | 'low' | 'auto';
  cacheLimit?: number;
}

const DEFAULT_STORYBLOK_WARM_CACHE_LIMIT = 256;

export const isStoryblokAssetUrl = (src?: string): boolean => {
  if (!src) return false;

  try {
    const { hostname } = new URL(src, STORYBLOK_ASSET_URL_BASE);
    return STORYBLOK_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
};

export const parseStoryblokImageDimensions = (
  src?: string | null,
): StoryblokImageDimensions | null => {
  if (!src || !isStoryblokAssetUrl(src)) return null;

  try {
    const { pathname } = new URL(src, STORYBLOK_ASSET_URL_BASE);
    const match = pathname.match(STORYBLOK_IMAGE_DIMENSIONS_PATTERN);
    if (!match) return null;

    const width = Number(match[1]);
    const height = Number(match[2]);

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }

    return { width, height };
  } catch {
    return null;
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

  const resizePart = hasResize
    ? `/m/${normalizedWidth}x${normalizedHeight}`
    : '/m';
  const smartPart =
    smart && normalizedWidth > 0 && normalizedHeight > 0 ? '/smart' : '';
  const filtersPart = filters.length > 0 ? `/filters:${filters.join(':')}` : '';
  const transformed = `${path}${resizePart}${smartPart}${filtersPart}`;

  return query ? `${transformed}?${query}` : transformed;
};

export const storyblokVideoPosterUrl = (
  src?: string,
  width = 1600,
  quality = 60,
): string | undefined => {
  if (!src) return undefined;
  return transformStoryblokImageUrl(src, { width, quality, noUpscale: true });
};

const addCappedWarmSrc = (
  warmedSrcs: Set<string>,
  src: string,
  cacheLimit: number,
) => {
  // Warm caches are per component module and capped for long-lived sessions.
  while (warmedSrcs.size >= cacheLimit) {
    const oldestSrc = warmedSrcs.values().next().value as string | undefined;
    if (!oldestSrc) break;
    warmedSrcs.delete(oldestSrc);
  }

  warmedSrcs.add(src);
};

export const warmStoryblokImage = (
  src: string | null | undefined,
  {
    fetchPriority = 'high',
    cacheLimit = DEFAULT_STORYBLOK_WARM_CACHE_LIMIT,
    ...transformOptions
  }: WarmStoryblokImageOptions,
  warmedSrcs: Set<string>,
) => {
  if (!src) return;

  const warmSrc = transformStoryblokImageUrl(src, transformOptions);
  if (!warmSrc || warmedSrcs.has(warmSrc)) return;

  addCappedWarmSrc(warmedSrcs, warmSrc, cacheLimit);
  if (typeof window === 'undefined') return;

  const image = new window.Image();
  if ('fetchPriority' in image) {
    (image as HTMLImageElement & { fetchPriority?: 'high' | 'low' | 'auto' })
      .fetchPriority = fetchPriority;
  }
  image.decoding = 'async';
  image.src = warmSrc;
  image.decode?.().catch(() => {});
};
