import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';

type Params = Promise<{ slug?: string[] }>;

export default async function Home({ params }: { params: Params }) {
  const slug = (await params).slug;
  const pageData = await fetchStory('draft', slug);

  if (!pageData || !pageData.story) {
    return <div style={{ padding: '2rem' }}>Story not found in preview.</div>;
  }

  return <StoryblokStory story={pageData.story} />;
}
