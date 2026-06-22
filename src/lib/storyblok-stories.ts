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
  total?: number | string;
  headers?: {
    total?: number | string;
    get?: (name: string) => number | string | null | undefined;
  };
};

const STORYBLOK_STORIES_PER_PAGE = 100;
const STORYBLOK_STORIES_PAGE_BATCH_SIZE = 4;
const STORYBLOK_STORIES_REVALIDATE_SECONDS = 3600;

const readStoryblokTotal = <TStory extends PublishedStoryListItem>(
  response: StoryblokStoriesResponse<TStory>,
): number => {
  const rawTotal =
    response.total ??
    response.headers?.total ??
    response.headers?.get?.('total') ??
    response.data?.stories?.length ??
    0;
  const total = Number(rawTotal);

  return Number.isFinite(total) && total >= 0 ? total : 0;
};

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

  const firstResponse = await fetchStoryPage(1);
  const firstStories = firstResponse.data?.stories ?? [];
  const total = readStoryblokTotal(firstResponse);
  const lastPage = Math.ceil(total / STORYBLOK_STORIES_PER_PAGE);

  if (lastPage <= 1) {
    return firstStories as TStory[];
  }

  const remainingPages = Array.from(
    { length: lastPage - 1 },
    (_, index) => index + 2,
  );
  const remainingStories: TStory[][] = [];

  for (
    let index = 0;
    index < remainingPages.length;
    index += STORYBLOK_STORIES_PAGE_BATCH_SIZE
  ) {
    const pageBatch = remainingPages.slice(
      index,
      index + STORYBLOK_STORIES_PAGE_BATCH_SIZE,
    );
    const pageStories = await Promise.all(
      pageBatch.map(async (currentPage) => {
        const response = await fetchStoryPage(currentPage);
        return response.data?.stories ?? [];
      }),
    );

    remainingStories.push(...pageStories);
  }

  return [firstStories, ...remainingStories].flat() as TStory[];
}
