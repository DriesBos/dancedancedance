import { ISbStoriesParams, getStoryblokApi } from '@storyblok/react/rsc';

export async function fetchData() {
  let sbParams: ISbStoriesParams = { version: 'draft' };

  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/home`, sbParams, {
    cache: 'no-store',
  });
}
