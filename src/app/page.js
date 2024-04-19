import { getStoryblokApi } from '@storyblok/react/rsc';
import StoryblokStory from '@storyblok/react/story';

export default async function Home() {
  const { data } = await fetchData();

  // console.log('DATA', data.story);

  return (
    <div>
      <StoryblokStory story={data.story} />
    </div>
  );
}
async function fetchData() {
  let sbParams = { version: 'draft' };

  const storyblokApi = getStoryblokApi();
  return storyblokApi.get(`cdn/stories/home`, sbParams, { cache: 'no-store' });
}
