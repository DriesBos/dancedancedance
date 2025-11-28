import { ISbStoriesParams } from '@storyblok/react/rsc';
import { getStoryblokApi } from '@/lib/storyblok';

export async function fetchData() {
  let sbParams: ISbStoriesParams = { version: 'draft' };

  const storyblokApi = getStoryblokApi();
  if (!storyblokApi) {
    console.warn('Storyblok API not initialized');
    return { data: { story: null } };
  }
  return await storyblokApi.get(`cdn/stories/home`, sbParams, {
    cache: 'no-store',
  });
}
