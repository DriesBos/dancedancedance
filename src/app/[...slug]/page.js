import { storyblokInit, apiPlugin } from '@storyblok/react/rsc';
import { getStoryblokApi } from '@storyblok/react/rsc';
import StoryblokStory from '@storyblok/react/story';
import RunGSAP from '../../helpers/runGSAP';
import RunLaser from '../../helpers/runLaser';

storyblokInit({
  accessToken: process.env.DB_STORYBLOK_PREVIEW,
  use: [apiPlugin],
});

export default async function Page({ params }) {
  let slug = params.slug ? params.slug.join('/') : 'home';

  const storyblokApi = getStoryblokApi();
  let { data } = await storyblokApi.get(
    `cdn/stories/${slug}`,
    { version: 'draft' },
    { cache: 'no-store' }
  );

  return (
    <>
      <RunGSAP />
      <RunLaser />
      <StoryblokStory story={data.story} bridgeOptions={{}} />
    </>
  );
}

export async function generateStaticParams() {
  const storyblokApi = getStoryblokApi();
  let { data } = await storyblokApi.get('cdn/links/', {
    version: 'draft',
  });

  let paths = [];

  Object.keys(data.links).forEach((linkKey) => {
    if (data.links[linkKey].is_folder) {
      return;
    }
    const slug = data.links[linkKey].slug;
    if (slug == 'home') {
      return;
    }
    let splittedSlug = slug.split('/');
    paths.push({ slug: splittedSlug });
  });
  return paths;
}
