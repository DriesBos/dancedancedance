import { ISbStoriesParams, getStoryblokApi } from '@storyblok/react/rsc';
import ProjectList from '../components/ProjectList';
// import StoryblokStory from '@storyblok/react/story';
import RunGSAP from '../helpers/runGSAP';

export default async function Home() {
  const { data } = await fetchData();

  return (
    <>
      <RunGSAP />
      <ProjectList />
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
