import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';

type Params = Promise<{ slug?: string[] }>;

export default async function Home({ params }: { params: Params }) {
  const slug = (await params).slug;
  const pageData = await fetchStory('draft', slug);
  console.log('LIVEPREVIEW DYNAMIC PAGE:', pageData);

  return <StoryblokStory story={pageData.story} />;
}
