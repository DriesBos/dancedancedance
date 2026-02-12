import { getStoryblokAccessToken, getStoryblokApi } from '@/lib/storyblok';

type StoryblokResponse = { story: any };
type StoryblokStartpageResponse = { stories?: any[] };

class StoryblokHttpError extends Error {
  status: number;

  constructor(
    status: number,
    statusText: string,
    errorText: string,
    context: string
  ) {
    super(`Failed to fetch ${context}: ${status} ${statusText} - ${errorText}`);
    this.name = 'StoryblokHttpError';
    this.status = status;
  }
}

let hasWarnedAboutAuth = false;

const isAuthError = (error: unknown): error is StoryblokHttpError =>
  error instanceof StoryblokHttpError &&
  (error.status === 401 || error.status === 403);

const fetchStoryByPath = async (
  token: string,
  version: 'draft' | 'published',
  path: string
): Promise<StoryblokResponse | null> => {
  const url = `https://api.storyblok.com/v2/cdn/stories/${path}?version=${version}&token=${token}`;

  const response = await fetch(url, {
    next: {
      tags: ['cms'],
      revalidate: version === 'published' ? 3600 : 0,
    },
    cache: version === 'published' ? 'force-cache' : 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new StoryblokHttpError(
      response.status,
      response.statusText,
      errorText,
      'story'
    );
  }

  return (await response.json()) as StoryblokResponse;
};

const fetchStartpageStory = async (
  token: string,
  version: 'draft' | 'published'
): Promise<StoryblokResponse | null> => {
  const url = `https://api.storyblok.com/v2/cdn/stories?version=${version}&token=${token}&is_startpage=1&per_page=1`;

  const response = await fetch(url, {
    next: {
      tags: ['cms'],
      revalidate: version === 'published' ? 3600 : 0,
    },
    cache: version === 'published' ? 'force-cache' : 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new StoryblokHttpError(
      response.status,
      response.statusText,
      errorText,
      'startpage'
    );
  }

  const data = (await response.json()) as StoryblokStartpageResponse;
  const story = data.stories?.[0];
  if (!story) return null;

  return { story };
};

export const fetchStory = async (
  version: 'draft' | 'published',
  slug?: string[]
) => {
  getStoryblokApi(version === 'draft');

  const publicToken = getStoryblokAccessToken(false);
  const previewToken = getStoryblokAccessToken(true);

  const tokenCandidates =
    version === 'published'
      ? [publicToken]
      : [previewToken, publicToken].filter(Boolean);

  if (tokenCandidates.length === 0) {
    throw new Error(`Missing Storyblok token for version: ${version}`);
  }

  const slugPath = slug && slug.length > 0 ? slug.join('/') : 'home';
  const isRootRequest = !slug || slug.length === 0;

  let lastError: Error | null = null;
  let sawAuthError = false;

  for (const token of tokenCandidates) {
    if (!token) continue;
    try {
      const story = await fetchStoryByPath(token, version, slugPath);
      if (story) {
        return story;
      }
    } catch (error) {
      if (isAuthError(error)) {
        sawAuthError = true;
        continue;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (isRootRequest) {
    for (const token of tokenCandidates) {
      if (!token) continue;
      try {
        const startpageStory = await fetchStartpageStory(token, version);
        if (startpageStory) {
          return startpageStory;
        }
      } catch (error) {
        if (isAuthError(error)) {
          sawAuthError = true;
          continue;
        }
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  if (sawAuthError && !hasWarnedAboutAuth) {
    hasWarnedAboutAuth = true;
    console.warn(
      'Storyblok returned Unauthorized (401/403). Check STORYBLOK_PREVIEW_ACCESS_TOKEN / STORYBLOK_PUBLIC_ACCESS_TOKEN (or NEXT_PREVIEW_STORYBLOK_TOKEN / NEXT_PUBLIC_STORYBLOK_TOKEN).'
    );
  }

  if (lastError) {
    throw lastError;
  }

  return null;
};
