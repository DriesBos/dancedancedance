import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import { getStoryblokAccessToken, getStoryblokApi } from '@/lib/storyblok';
import { withPublishedStoryblokCv } from '@/lib/storyblok-cv';

type StoryblokStoryListItem = {
  slug?: string;
  is_folder?: boolean;
  published_at?: string;
  updated_at?: string;
};

const getPublishedEntries = async (
  baseUrl: string,
): Promise<MetadataRoute.Sitemap> => {
  try {
    const storyblokApi = getStoryblokApi(false);
    const publishedToken = getStoryblokAccessToken(false);
    const paramsWithCv = await withPublishedStoryblokCv(
      {
        version: 'published',
        is_startpage: false,
        per_page: 100,
      },
      publishedToken,
    );
    const response = await storyblokApi.get(
      'cdn/stories',
      paramsWithCv,
      {
        cache: 'force-cache',
        next: { revalidate: 3600 },
      },
    );

    const stories = (response.data?.stories || []) as StoryblokStoryListItem[];

    return stories
      .filter(
        (story) => !story.is_folder && !!story.slug && story.slug !== 'home',
      )
      .map((story) => ({
        url: `${baseUrl}/${story.slug}`,
        lastModified: new Date(story.updated_at || story.published_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
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
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...(await getPublishedEntries(baseUrl)),
  ];
}
