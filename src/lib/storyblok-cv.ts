import type { ISbStoriesParams } from '@storyblok/react/rsc';
import { STORYBLOK_TAG_ALL, STORYBLOK_TAG_CV } from '@/lib/storyblok-cache';

type StoryblokSpaceResponse = {
  cv?: number;
  space?: {
    version?: number;
  };
};

const STORYBLOK_CV_REVALIDATE_SECONDS = 3600;

const readStoryblokCv = (payload: StoryblokSpaceResponse): number | null => {
  const candidate = payload.cv ?? payload.space?.version;
  if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
    return null;
  }

  return candidate > 0 ? candidate : null;
};

const fetchPublishedStoryblokCv = async (
  token: string,
): Promise<number | null> => {
  try {
    const url = new URL('https://api.storyblok.com/v2/cdn/spaces/me');
    url.searchParams.set('token', token);

    const response = await fetch(url, {
      cache: 'force-cache',
      next: {
        revalidate: STORYBLOK_CV_REVALIDATE_SECONDS,
        tags: [STORYBLOK_TAG_ALL, STORYBLOK_TAG_CV],
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as StoryblokSpaceResponse;
    return readStoryblokCv(payload);
  } catch {
    return null;
  }
};

export const getPublishedStoryblokCv = async (
  token?: string,
): Promise<number | undefined> => {
  if (!token) return undefined;
  const cv = await fetchPublishedStoryblokCv(token);
  return cv === null ? undefined : cv;
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
