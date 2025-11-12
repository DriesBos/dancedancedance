import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';
import PageTransition from '@/components/PageTransition';

// Enable dynamic params for catch-all route
export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [];
}

type Params = Promise<{ slug?: string[] }>;

export default async function Home({ params }: { params: Params }) {
  try {
    const slug = (await params).slug;
    // Use 'draft' in development, 'published' in production
    const version =
      process.env.NODE_ENV === 'development' ? 'draft' : 'published';
    const pageData = await fetchStory(version, slug);

    if (!pageData || !pageData.story) {
      return (
        <PageTransition>
          <div style={{ padding: '2rem' }}>
            <h1>Story not found</h1>
            <p>Could not load content from Storyblok.</p>
          </div>
        </PageTransition>
      );
    }

    console.log('Page data:', pageData);

    return (
      <PageTransition>
        <StoryblokStory story={pageData.story} />
      </PageTransition>
    );
  } catch (error) {
    console.error('Error loading page:', error);
    return (
      <PageTransition>
        <div style={{ padding: '2rem' }}>
          <h1>Error loading page</h1>
          <p>An error occurred while loading this page.</p>
          <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
        </div>
      </PageTransition>
    );
  }
}
