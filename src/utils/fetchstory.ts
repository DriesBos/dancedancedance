import { ISbResponse } from '@storyblok/react/rsc';
import { getStoryblokApi } from '@/lib/storyblok';

export const fetchStory = async (
  version: 'draft' | 'published',
  slug?: string[]
) => {
  try {
    getStoryblokApi();
    const correctSlug = `/${slug ? slug.join('/') : 'home'}`;
    console.log('FETCHSTORY - Slug:', correctSlug, 'Version:', version);

    const token =
      version === 'published'
        ? process.env.NEXT_PUBLIC_STORYBLOK_TOKEN
        : process.env.NEXT_PREVIEW_STORYBLOK_TOKEN;

    if (!token) {
      console.error('Missing token for version:', version);
      throw new Error(`Missing Storyblok token for version: ${version}`);
    }

    const url = `https://api.storyblok.com/v2/cdn/stories${correctSlug}?version=${version}&token=${token}`;
    console.log('Fetching from Storyblok:', url.replace(token, 'TOKEN_HIDDEN'));

    const response = await fetch(url, {
      next: { tags: ['cms'] },
      cache: version === 'published' ? 'default' : 'no-store',
    });

    if (!response.ok) {
      console.error(
        'Storyblok API error:',
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error('Error body:', errorText);
      throw new Error(
        `Failed to fetch story: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('Successfully fetched story:', data.story?.name || 'unknown');
    return data as { story: ISbResponse };
  } catch (error) {
    console.error('Error in fetchStory:', error);
    throw error;
  }
};
