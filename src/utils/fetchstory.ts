import { ISbResponse } from '@storyblok/react/rsc';
import { getStoryblokApi } from '@/lib/storyblok';

export const fetchStory = async (
  version: 'draft' | 'published',
  slug?: string[]
) => {
  getStoryblokApi();
  const correctSlug = `/${slug ? slug.join('/') : 'home'}`;
  console.log('FETCHSTORY', correctSlug, version);

  return fetch(
    `
    https://api.storyblok.com/v2/cdn/stories${correctSlug}?version=${version}&token=${
      version === 'published'
        ? process.env.NEXT_PUBLIC_STORYBLOK_TOKEN
        : process.env.NEXT_PREVIEW_STORYBLOK_TOKEN
    }`,
    {
      next: { tags: ['cms'] },
      cache: version === 'published' ? 'default' : 'no-store',
    }
  ).then((res) => res.json()) as Promise<{ story: ISbResponse }>;
};
