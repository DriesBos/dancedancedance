import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';

export async function generateStaticParams() {
  return [];
}

type Params = Promise<{ slug?: string[] }>;

export default async function Home({ params }: { params: Params }) {
  const slug = (await params).slug;
  const pageData = await fetchStory('published', slug);
  console.log('STORY DYNAMIC PAGE:', pageData);

  return <StoryblokStory story={pageData.story} />;
}
