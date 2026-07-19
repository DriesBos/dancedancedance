import type { ISbStoriesParams } from '@storyblok/react/rsc';
import { STORYBLOK_TAG_ALL } from '@/lib/storyblok-cache';
import { withPublishedStoryblokCv } from '@/lib/storyblok-cv';
import { getOptionalStoryblokApi, getStoryblokAccessToken } from '@/lib/storyblok';

export type PublishedStoryListItem = {
  slug?: string;
  is_folder?: boolean;
  published_at?: string;
  updated_at?: string;
};

type FetchPublishedStoryListOptions = {
  tags?: string[];
};

type StoryblokStoriesResponse<TStory> = {
  data?: {
    stories?: TStory[];
  };
};

const STORYBLOK_STORIES_PER_PAGE = 100;
const STORYBLOK_STORIES_REVALIDATE_SECONDS = 3600;

export async function fetchPublishedStoryList<
  TStory extends PublishedStoryListItem = PublishedStoryListItem,
>(
  params: ISbStoriesParams = {},
  { tags = [] }: FetchPublishedStoryListOptions = {},
): Promise<TStory[]> {
  const storyblokApi = getOptionalStoryblokApi(false);
  if (!storyblokApi) {
    console.warn('Storyblok API not initialized, returning empty story list');
    return [];
  }

  const publishedToken = getStoryblokAccessToken(false);
  const paramsWithCv = await withPublishedStoryblokCv(
    {
      version: 'published',
      is_startpage: false,
      ...params,
    },
    publishedToken,
  );

  const cacheOptions = {
    cache: 'force-cache' as const,
    next: {
      revalidate: STORYBLOK_STORIES_REVALIDATE_SECONDS,
      tags: [STORYBLOK_TAG_ALL, ...tags],
    },
  };

  const fetchStoryPage = async (
    page: number,
  ): Promise<StoryblokStoriesResponse<TStory>> =>
    (await storyblokApi.get(
      'cdn/stories',
      {
        ...paramsWithCv,
        per_page: STORYBLOK_STORIES_PER_PAGE,
        page,
      },
      cacheOptions,
    )) as StoryblokStoriesResponse<TStory>;

  const stories: TStory[] = [];

  for (let page = 1; ; page += 1) {
    const pageStories = (await fetchStoryPage(page)).data?.stories ?? [];
    stories.push(...pageStories);

    if (pageStories.length < STORYBLOK_STORIES_PER_PAGE) break;
  }

  return stories;
}
