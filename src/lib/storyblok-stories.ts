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
      per_page: 100,
      ...params,
    },
    publishedToken,
  );

  const response = await storyblokApi.get('cdn/stories', paramsWithCv, {
    cache: 'force-cache',
    next: {
      revalidate: 3600,
      tags: [STORYBLOK_TAG_ALL, ...tags],
    },
  });

  return (response.data?.stories ?? []) as TStory[];
}
