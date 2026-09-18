import { isStoryblokAssetUrl, transformStoryblokImageUrl } from './storyblok-image';

// Only these CMS image fields need placeholders; video posters remain player-owned.
export async function addStoryblokImageBlurs<T>(content: T, published = true): Promise<T> {
  const pending = new Map<string, Promise<string | undefined>>();
  const placeholder = (src: string) => {
    if (!pending.has(src)) {
      pending.set(src, (async () => {
        try {
          const url = new URL(src);
          if (url.protocol !== 'https:' || !isStoryblokAssetUrl(src) ||
              url.pathname.includes('/m/') || !/\.(jpe?g|png|webp|avif)$/i.test(url.pathname)) return;
          const response = await fetch(transformStoryblokImageUrl(src, {
            width: 8, quality: 20, format: 'webp',
          }), {
            redirect: 'error',
            signal: AbortSignal.timeout(3000),
            cache: published ? 'force-cache' : 'no-store',
            ...(published ? { next: { revalidate: false } } : {}),
          });
          if (!response.ok || !response.headers.get('content-type')?.startsWith('image/webp')) return;
          const bytes = await response.arrayBuffer();
          if (bytes.byteLength > 8192) return;
          return `data:image/webp;base64,${Buffer.from(bytes).toString('base64')}`;
        } catch {
          // A missing preview must never prevent the full image from rendering.
          return;
        }
      })());
    }
    return pending.get(src)!;
  };
  const asset = async (value: unknown): Promise<unknown> => {
    if (!value || typeof value !== 'object') return value;
    const image = value as Record<string, unknown>;
    if (typeof image.filename !== 'string') return value;
    const blurDataURL = await placeholder(image.filename);
    return blurDataURL ? { ...image, blurDataURL } : value;
  };
  const visit = async (value: unknown): Promise<unknown> => {
    if (Array.isArray(value)) return Promise.all(value.map(visit));
    if (!value || typeof value !== 'object') return value;
    const blok = value as Record<string, unknown>;
    return Object.fromEntries(await Promise.all(Object.entries(blok).map(async ([key, child]) => {
      if (blok.component === 'Column Image' && key === 'image') return [key, await asset(child)];
      if (blok.component === 'Column Slider' && (key === 'images' || key === 'images_mobile') && Array.isArray(child)) {
        return [key, await Promise.all(child.map(asset))];
      }
      return [key, await visit(child)];
    })));
  };
  return await visit(content) as T;
}
