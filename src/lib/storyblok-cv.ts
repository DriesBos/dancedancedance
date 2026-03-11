import type { ISbStoriesParams } from '@storyblok/react/rsc';
import { unstable_cache } from 'next/cache';
import { STORYBLOK_TAG_ALL, STORYBLOK_TAG_CV } from '@/lib/storyblok-cache';

type StoryblokSpaceResponse = {
  cv?: number;
  space?: {
    version?: number;
  };
};

const STORYBLOK_CV_REVALIDATE_SECONDS = 3600;
const STORYBLOK_CV_CACHE_KEY = 'storyblok:space-cv';

const readStoryblokCv = (payload: StoryblokSpaceResponse): number | null => {
  const candidate = payload.cv ?? payload.space?.version;
  if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
    return null;
  }

  return candidate > 0 ? candidate : null;
};

const fetchPublishedStoryblokCv = unstable_cache(
  async (token: string): Promise<number | null> => {
    try {
      const response = await fetch(
        `https://api.storyblok.com/v2/cdn/spaces/me?token=${encodeURIComponent(token)}`,
        {
          cache: 'force-cache',
          next: {
            revalidate: STORYBLOK_CV_REVALIDATE_SECONDS,
            tags: [STORYBLOK_TAG_ALL, STORYBLOK_TAG_CV],
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as StoryblokSpaceResponse;
      return readStoryblokCv(payload);
    } catch {
      return null;
    }
  },
  [STORYBLOK_CV_CACHE_KEY],
  {
    revalidate: STORYBLOK_CV_REVALIDATE_SECONDS,
    tags: [STORYBLOK_TAG_ALL, STORYBLOK_TAG_CV],
  },
);

export const getPublishedStoryblokCv = async (
  token?: string,
): Promise<number | undefined> => {
  if (!token) return undefined;
  const cv = await fetchPublishedStoryblokCv(token);
  return cv ?? undefined;
};

export const withPublishedStoryblokCv = async <T extends ISbStoriesParams>(
  params: T,
  token?: string,
): Promise<T> => {
  if (params.version !== 'published') return params;

  const cv = await getPublishedStoryblokCv(token);
  if (!cv) return params;

  return {
    ...params,
    cv,
  };
};
