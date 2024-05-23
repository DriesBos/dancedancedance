import { ISbStoriesParams, getStoryblokApi } from '@storyblok/react/rsc';
import StoryblokStory from '@storyblok/react/story';

export default async function Home() {
  const { data } = await fetchData();

  return (
    <>
      <StoryblokStory story={data.story} />
    </>
  );
}

export async function fetchData() {
  let sbParams: ISbStoriesParams = { version: 'draft' };

  const storyblokApi = getStoryblokApi();
  return await storyblokApi.get(`cdn/stories/home`, sbParams, {
    cache: 'no-store',
  });
}
