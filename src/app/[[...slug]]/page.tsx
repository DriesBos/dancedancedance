import { StoryblokStory } from '@storyblok/react/rsc';
import { fetchStory } from '@/utils/fetchstory';
import { getStoryblokApi } from '@/lib/storyblok';
import PageTransition from '@/components/PageTransition';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

// Enable dynamic params for catch-all route
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const storyblokApi = getStoryblokApi(false);
    const response = await storyblokApi.get(
      'cdn/stories',
      {
        version: 'published',
        is_startpage: false,
        per_page: 100,
      },
      {
        cache: 'force-cache',
        next: { revalidate: 3600 },
      },
    );

    const stories = (response.data?.stories || []) as Array<{
      slug?: string;
      is_folder?: boolean;
    }>;

    const staticParams = stories
      .filter(
        (story) => !story.is_folder && !!story.slug && story.slug !== 'home',
      )
      .map((story) => ({
        slug: story.slug!.split('/'),
      }));

    // Optional catch-all root route (`/`)
    return [{}, ...staticParams];
  } catch (error) {
    console.error('Error generating static params:', error);
    return [{}];
  }
}

type Params = Promise<{ slug?: string[] }>;

const getStoryVersion = (): 'draft' | 'published' => {
  const useDraftInDev =
    process.env.NODE_ENV === 'development' &&
    process.env.STORYBLOK_USE_DRAFT === 'true';

  return useDraftInDev ? 'draft' : 'published';
};

const getSlugPath = (slug?: string[]) =>
  slug && slug.length > 0 ? slug.join('/') : '';

const getPageData = cache(
  async (version: 'draft' | 'published', slugPath: string) => {
    const slug = slugPath ? slugPath.split('/') : undefined;
    return fetchStory(version, slug);
  },
);

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  try {
    const slug = (await params).slug;
    const version = getStoryVersion();
    const slugPath = getSlugPath(slug);
    const pageData = await getPageData(version, slugPath);

    if (!pageData || !pageData.story) {
      return {
        title: 'Dries Bos',
      };
    }

    const story = pageData.story as any;
    const storyName = story.name || '';
    const storySlug = slugPath;

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
  const slug = (await params).slug;
  const version = getStoryVersion();
  const slugPath = getSlugPath(slug);
  const pageData = await getPageData(version, slugPath);

  if (!pageData?.story) {
    notFound();
  }

  return (
    <PageTransition>
      <StoryblokStory story={pageData.story} />
    </PageTransition>
  );
}
