import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  return [];
}

type Params = Promise<{ slug?: string[] }>;

export default async function Home({ params }: { params: Params }) {
  try {
    const slug = (await params).slug;
    const pageData = await fetchStory('published', slug);

    if (!pageData || !pageData.story) {
      return (
        <div style={{ padding: '2rem' }}>
          <h1>Story not found</h1>
          <p>Could not load content from Storyblok.</p>
        </div>
      );
    }

    return <StoryblokStory story={pageData.story} />;
  } catch (error) {
    console.error('Error loading page:', error);
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Error loading page</h1>
        <p>An error occurred while loading this page.</p>
        <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
      </div>
    );
  }
}
