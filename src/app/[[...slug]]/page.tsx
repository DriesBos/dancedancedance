import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  return [];
}

type Params = Promise<{ slug?: string[] }>;

export default async function Home({ params }: { params: Params }) {
  try {
    const slug = (await params).slug;
    console.log('Fetching story for slug:', slug);

    const pageData = await fetchStory('published', slug);
    console.log('STORY DYNAMIC PAGE:', pageData);

    if (!pageData || !pageData.story) {
      console.error('No story data returned');
      return <div>Story not found</div>;
    }

    return <StoryblokStory story={pageData.story} />;
  } catch (error) {
    console.error('Error in page component:', error);
    throw error;
  }
}
