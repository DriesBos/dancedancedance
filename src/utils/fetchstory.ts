import { ISbResponse } from '@storyblok/react/rsc';
import { getStoryblokApi } from '@/lib/storyblok';

export const fetchStory = async (
  version: 'draft' | 'published',
  slug?: string[]
) => {
  try {
    getStoryblokApi();
    const correctSlug = slug ? slug.join('/') : 'home';

    const token =
      version === 'published'
        ? process.env.NEXT_PUBLIC_STORYBLOK_TOKEN
        : process.env.NEXT_PREVIEW_STORYBLOK_TOKEN;

    if (!token) {
      throw new Error(`Missing Storyblok token for version: ${version}`);
    }

    const url = `https://api.storyblok.com/v2/cdn/stories/${correctSlug}?version=${version}&token=${token}`;

    const response = await fetch(url, {
      next: {
        tags: ['cms'],
        revalidate: version === 'published' ? 3600 : 0, // Cache published for 1 hour
      },
      cache: version === 'published' ? 'force-cache' : 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch story: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return data as { story: ISbResponse };
  } catch (error) {
    console.error('Error in fetchStory:', error);
    throw error;
  }
};
