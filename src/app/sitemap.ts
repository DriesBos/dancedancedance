import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import { fetchPublishedStoryList } from '@/lib/storyblok-stories';

type StoryblokStoryListItem = {
  slug?: string;
  full_slug?: string;
  is_folder?: boolean;
  published_at?: string;
  updated_at?: string;
};

const getPublishedEntries = async (
  baseUrl: string,
): Promise<MetadataRoute.Sitemap> => {
  try {
    const stories = await fetchPublishedStoryList<StoryblokStoryListItem>();

    return stories
      .filter(
        (story) => !story.is_folder && !!story.slug && story.slug !== 'home',
      )
      .map((story) => {
        const path = (story.full_slug || story.slug || '').replace(/^\/+|\/+$/g, '');
        const lastModified = story.updated_at || story.published_at;

        return {
          url: `${baseUrl}/${path}`,
          ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
        };
      });
  } catch (error) {
    console.error('Error generating sitemap entries:', error);
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  return [
    {
      url: baseUrl,
    },
    ...(await getPublishedEntries(baseUrl)),
  ];
}
