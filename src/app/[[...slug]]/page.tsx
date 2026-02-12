import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';
import PageTransition from '@/components/PageTransition';
import type { Metadata } from 'next';
import { Suspense } from 'react';

// Enable dynamic params for catch-all route
export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [];
}

type Params = Promise<{ slug?: string[] }>;

const getStoryVersion = (): 'draft' | 'published' => {
  const useDraftInDev =
    process.env.NODE_ENV === 'development' &&
    process.env.STORYBLOK_USE_DRAFT === 'true';

  return useDraftInDev ? 'draft' : 'published';
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  try {
    const slug = (await params).slug;
    const version = getStoryVersion();
    const pageData = await fetchStory(version, slug);

    if (!pageData || !pageData.story) {
      return {
        title: 'Dries Bos',
      };
    }

    const story = pageData.story as any;
    const storyName = story.name || '';
    const storySlug = slug ? slug.join('/') : '';

    // Home page
    if (!slug || slug.length === 0 || storySlug === 'home') {
      return {
        title: 'Dries Bos — Creative Developer',
        description: 'Dries Bos — Creative Developer',
      };
    }

    // About page
    if (storySlug === 'about') {
      return {
        title: 'About Dries Bos',
        description: 'About Dries Bos — Creative Developer',
      };
    }

    // Project pages (assuming they have component type 'pageProject' or similar)
    if (story.content?.component === 'pageProject') {
      return {
        title: `Dries Bos — ${storyName}`,
        description: `${storyName} — Project by Dries Bos`,
      };
    }

    // Default for other pages
    return {
      title: `Dries Bos — ${storyName}`,
      description: `${storyName} — Dries Bos`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Dries Bos',
    };
  }
}

export default async function Home({ params }: { params: Params }) {
  try {
    const slug = (await params).slug;
    const version = getStoryVersion();
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
